const BOOKING_HEADERS = [
  "Date de réception",
  "Référence",
  "Nom",
  "E-mail",
  "Téléphone",
  "Prestation",
  "Déclinaison",
  "Option",
  "Date demandée",
  "Heure demandée",
  "Prix estimé",
  "Précision",
  "Statut"
];

const BOOKING_SERVICES = {
  "Dégradé": { price: 25, variants: ["Dégradé bas", "Dégradé moyen", "Dégradé haut"] },
  "Taper": { price: 27, variants: ["Taper bas", "Taper haut", "Burst taper"] },
  "Coupe classique": { price: 23, variants: [] },
  "Buzz cut": { price: 18, variants: [] },
  "French crop": { price: 25, variants: [] },
  "Coupe aux ciseaux": { price: 28, variants: [] }
};

const BOOKING_EXTRAS = {
  none: { name: "Aucune option", price: 0 },
  beard: { name: "Taille de barbe", price: 12 },
  shave: { name: "Rasage traditionnel", price: 18 }
};

const OPENING_PERIODS = [
  { start: 9 * 60, end: 12 * 60 },
  { start: 13 * 60, end: 19 * 60 }
];

function setupBookingSheet() {
  const properties = PropertiesService.getScriptProperties();
  const spreadsheetId = properties.getProperty("SHEET_ID");
  if (!spreadsheetId) throw new Error("Set the SHEET_ID script property before setup.");

  const sheetName = properties.getProperty("SHEET_NAME") || "Réservations";
  const spreadsheet = SpreadsheetApp.openById(spreadsheetId);
  const sheet = spreadsheet.getSheetByName(sheetName) || spreadsheet.insertSheet(sheetName);
  if (sheet.getLastRow() === 0) {
    sheet.getRange(1, 1, 1, BOOKING_HEADERS.length).setValues([BOOKING_HEADERS]);
    sheet.setFrozenRows(1);
    sheet.getRange(1, 1, 1, BOOKING_HEADERS.length).setFontWeight("bold");
  }
  return sheet.getName();
}

function doPost(event) {
  const parameters = event && event.parameter ? event.parameter : {};
  const requestId = text_(parameters.requestId, 80);

  if (text_(parameters.website, 200)) {
    return response_({ status: "rejected", requestId: requestId });
  }

  try {
    if (!/^[A-Za-z0-9-]{16,80}$/.test(requestId)) {
      throw new Error("Missing or invalid request ID.");
    }

    const config = configuration_();
    const booking = validateBooking_(parameters, config.timezone);
    const rateLimit = checkRateLimit_(booking.email);
    if (!rateLimit.allowed) {
      return response_({
        status: "error",
        requestId: requestId,
        message: "Trop de demandes récentes pour cette adresse e-mail. Réessayez un peu plus tard."
      });
    }

    const saved = saveBooking_(booking, requestId, config);
    if (saved.status === "duplicate") {
      return response_({ status: "duplicate", requestId: requestId });
    }
    if (saved.status === "slot_taken") {
      return response_({ status: "slot_taken", requestId: requestId });
    }

    const emailErrors = sendBookingEmails_(booking, requestId, config);
    const finalStatus = emailErrors.length === 0
      ? "E-mail client et notification salon envoyés"
      : `Demande enregistrée · erreur e-mail (${emailErrors.join(", ")})`;
    saved.sheet.getRange(saved.row, BOOKING_HEADERS.length).setValue(finalStatus);

    return response_({
      status: emailErrors.length === 0 ? "success" : "email_error",
      requestId: requestId
    });
  } catch (error) {
    console.error(error && error.stack ? error.stack : error);
    return response_({
      status: "error",
      requestId: requestId,
      message: "Le service n’a pas pu enregistrer la demande. Vérifiez les informations ou contactez le salon."
    });
  }
}

function configuration_() {
  const properties = PropertiesService.getScriptProperties();
  const spreadsheetId = properties.getProperty("SHEET_ID");
  const barberEmail = properties.getProperty("BARBER_EMAIL");
  const timezone = properties.getProperty("TIMEZONE") || "Europe/Paris";
  if (!spreadsheetId || !barberEmail || !validEmail_(barberEmail)) {
    throw new Error("Set valid SHEET_ID and BARBER_EMAIL script properties.");
  }
  return {
    spreadsheetId: spreadsheetId,
    barberEmail: barberEmail,
    sheetName: properties.getProperty("SHEET_NAME") || "Réservations",
    shopName: properties.getProperty("SHOP_NAME") || "Le Fauteuil",
    timezone: timezone
  };
}

function validateBooking_(parameters, timezone) {
  const name = text_(parameters.name, 100);
  const email = text_(parameters.email, 160).toLowerCase();
  const phone = text_(parameters.phone, 30);
  const serviceName = text_(parameters.service, 60);
  const variant = text_(parameters.variant, 60);
  const extraKey = text_(parameters.extra, 20);
  const date = text_(parameters.date, 10);
  const time = text_(parameters.time, 5);
  const note = text_(parameters.note, 300);
  const consent = parameters.consent === "on";

  if (parameters.website) throw new Error("Invalid request.");
  if (!name || !email || !validEmail_(email) || !validPhone_(phone) || !consent) {
    throw new Error("Missing or invalid contact details or consent.");
  }

  const service = Object.prototype.hasOwnProperty.call(BOOKING_SERVICES, serviceName)
    ? BOOKING_SERVICES[serviceName]
    : null;
  const extra = Object.prototype.hasOwnProperty.call(BOOKING_EXTRAS, extraKey)
    ? BOOKING_EXTRAS[extraKey]
    : null;
  if (!service || !extra) throw new Error("Unknown service.");
  if (variant && !service.variants.includes(variant)) throw new Error("Unknown service variant.");
  validateAppointment_(date, time, timezone);

  return {
    name: name,
    email: email,
    phone: phone,
    serviceName: serviceName,
    variant: variant,
    extra: extra,
    date: date,
    time: time,
    price: service.price + extra.price,
    note: note
  };
}

function validateAppointment_(date, time, timezone) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date) || !/^\d{2}:\d{2}$/.test(time)) {
    throw new Error("Invalid appointment date or time.");
  }

  const parts = date.split("-").map(Number);
  const dateValue = new Date(Date.UTC(parts[0], parts[1] - 1, parts[2], 12));
  if (Utilities.formatDate(dateValue, "UTC", "yyyy-MM-dd") !== date) {
    throw new Error("Invalid calendar date.");
  }

  const weekday = dateValue.getUTCDay();
  if (weekday === 0 || weekday === 1) throw new Error("The shop is closed on this day.");

  const requestedMinutes = Number(time.slice(0, 2)) * 60 + Number(time.slice(3, 5));
  if (!OPENING_PERIODS.some((period) =>
    requestedMinutes >= period.start &&
    requestedMinutes < period.end &&
    requestedMinutes % 30 === 0
  )) {
    throw new Error("The requested time is outside opening hours.");
  }

  const today = Utilities.formatDate(new Date(), timezone, "yyyy-MM-dd");
  if (date < today) throw new Error("Appointment date is in the past.");
  const maximumDate = new Date(`${today}T12:00:00Z`);
  maximumDate.setUTCDate(maximumDate.getUTCDate() + 60);
  if (date > Utilities.formatDate(maximumDate, "UTC", "yyyy-MM-dd")) {
    throw new Error("Appointment date is outside the booking window.");
  }

  if (date === today) {
    const currentTime = Utilities.formatDate(new Date(), timezone, "HH:mm");
    const currentMinutes = Number(currentTime.slice(0, 2)) * 60 + Number(currentTime.slice(3, 5));
    if (requestedMinutes <= currentMinutes) throw new Error("The requested time has passed.");
  }
}

function saveBooking_(booking, requestId, config) {
  const lock = LockService.getScriptLock();
  lock.waitLock(15000);
  try {
    const spreadsheet = SpreadsheetApp.openById(config.spreadsheetId);
    const sheet = spreadsheet.getSheetByName(config.sheetName) || spreadsheet.insertSheet(config.sheetName);
    ensureHeaders_(sheet);

    const lastRow = sheet.getLastRow();
    if (lastRow > 1) {
      const rows = sheet.getRange(2, 1, lastRow - 1, BOOKING_HEADERS.length).getDisplayValues();
      for (let index = 0; index < rows.length; index += 1) {
        const row = rows[index];
        if (requestId && row[1] === requestId) {
          return { status: "duplicate", sheet: sheet, row: index + 2 };
        }
        if (row[8] === booking.date && row[9] === booking.time) {
          return { status: "slot_taken" };
        }
      }
    }

    const row = [
      new Date(),
      sheetText_(requestId),
      sheetText_(booking.name),
      sheetText_(booking.email),
      sheetText_(booking.phone),
      sheetText_(booking.serviceName),
      sheetText_(booking.variant),
      sheetText_(booking.extra.name),
      sheetText_(booking.date),
      sheetText_(booking.time),
      `${booking.price} €`,
      sheetText_(booking.note),
      "Envoi des e-mails en cours"
    ];
    sheet.appendRow(row);
    return { status: "saved", sheet: sheet, row: sheet.getLastRow() };
  } finally {
    lock.releaseLock();
  }
}

function ensureHeaders_(sheet) {
  if (sheet.getLastRow() === 0) {
    sheet.getRange(1, 1, 1, BOOKING_HEADERS.length).setValues([BOOKING_HEADERS]);
    sheet.setFrozenRows(1);
    sheet.getRange(1, 1, 1, BOOKING_HEADERS.length).setFontWeight("bold");
    return;
  }
  const actual = sheet.getRange(1, 1, 1, BOOKING_HEADERS.length).getDisplayValues()[0];
  if (BOOKING_HEADERS.some((header, index) => actual[index] !== header)) {
    throw new Error("The reservations sheet has unexpected columns. Keep the header row unchanged.");
  }
}

function sendBookingEmails_(booking, requestId, config) {
  const details = [
    `Référence : ${requestId || "non disponible"}`,
    `Nom : ${booking.name}`,
    `E-mail : ${booking.email}`,
    `Téléphone : ${booking.phone}`,
    `Prestation : ${booking.serviceName}`,
    booking.variant ? `Déclinaison : ${booking.variant}` : "",
    `Option : ${booking.extra.name}`,
    `Date demandée : ${booking.date}`,
    `Heure demandée : ${booking.time}`,
    `Prix estimé : ${booking.price} €`,
    booking.note ? `Précision : ${booking.note}` : ""
  ].filter(Boolean).join("\n");

  const errors = [];
  try {
    MailApp.sendEmail({
      to: config.barberEmail,
      replyTo: booking.email,
      name: config.shopName,
      subject: `Nouvelle demande de rendez-vous — ${booking.date} à ${booking.time}`,
      body: `Une demande de rendez-vous vient d’être enregistrée.\n\n${details}\n\nRépondez à cet e-mail pour contacter le client.`
    });
  } catch (error) {
    console.error(`Barber notification failed: ${error && error.stack ? error.stack : error}`);
    errors.push("notification salon");
  }

  try {
    MailApp.sendEmail({
      to: booking.email,
      replyTo: config.barberEmail,
      name: config.shopName,
      subject: `Demande de rendez-vous reçue — ${config.shopName}`,
      body: `Bonjour ${booking.name},\n\nNous avons bien reçu votre demande. Le créneau demandé reste à confirmer par le salon.\n\n${details}\n\nLe salon vous recontactera si le créneau doit être ajusté.\n\nÀ bientôt,\n${config.shopName}`
    });
  } catch (error) {
    console.error(`Customer confirmation failed: ${error && error.stack ? error.stack : error}`);
    errors.push("confirmation client");
  }
  return errors;
}

function checkRateLimit_(email) {
  const digest = Utilities.computeDigest(
    Utilities.DigestAlgorithm.SHA_256,
    email.toLowerCase(),
    Utilities.Charset.UTF_8
  );
  const key = `booking_${digest.map((value) => (value + 256).toString(16).slice(-2)).join("")}`;
  const cache = CacheService.getScriptCache();
  const count = Number(cache.get(key) || "0");
  if (count >= 5) return { allowed: false };
  cache.put(key, String(count + 1), 3600);
  return { allowed: true };
}

function validEmail_(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) && email.length <= 160;
}

function validPhone_(phone) {
  const digits = phone.replace(/\D/g, "");
  return /^[0-9+().\s-]+$/.test(phone) && digits.length >= 7 && digits.length <= 15;
}

function text_(value, maximumLength) {
  return String(value || "").trim().slice(0, maximumLength);
}

function sheetText_(value) {
  const text = String(value || "").trim();
  return /^[=+\-@]/.test(text) ? `'${text}` : text;
}

function response_(payload) {
  const json = JSON.stringify(payload)
    .replace(/</g, "\\u003c")
    .replace(/>/g, "\\u003e")
    .replace(/&/g, "\\u0026")
    .replace(/\u2028/g, "\\u2028")
    .replace(/\u2029/g, "\\u2029");
  const html = `<!doctype html><html><head><meta charset="utf-8"></head><body><script>window.parent.postMessage(${json}, "*");</script></body></html>`;
  return HtmlService.createHtmlOutput(html)
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
}
