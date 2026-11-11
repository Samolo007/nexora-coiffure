# Google Sheets booking integration

The booking form sends a standard HTML form to a Google Apps Script web app. The script writes each request to a private spreadsheet, sends a request notification to the barber, and emails the customer a receipt. The customer email says the requested slot still needs confirmation; this prototype does not connect to Google Calendar.

## Configure the spreadsheet and email

1. Create a Google spreadsheet for reservations. Copy the spreadsheet ID from its URL (`/spreadsheets/d/SPREADSHEET_ID/edit`).
2. From the spreadsheet, open **Extensions → Apps Script** and paste the contents of `Code.gs` into the project.
3. In **Project Settings → Script properties**, add:

   | Property | Value |
   | --- | --- |
   | `SHEET_ID` | The spreadsheet ID from step 1 |
   | `BARBER_EMAIL` | The mailbox that should receive booking notifications |
   | `SHOP_NAME` | `Le Fauteuil` or the real shop name |
   | `TIMEZONE` | `Europe/Paris` (use the shop's actual time zone) |
   | `SHEET_NAME` | `Réservations` |

4. In the Apps Script editor, select and run `setupBookingSheet` once. Review and grant the Google Sheets permission.
5. Select **Deploy → New deployment → Web app**. Set **Execute as** to the account that owns the spreadsheet and sends the emails. Choose an access level that permits your website's visitors to submit the form. Review the access warning: a public endpoint must be protected and monitored.
6. Authorize the Google Sheets and email permissions when prompted. Copy the deployed web app URL ending in `/exec`.
7. Set `window.BOOKING_WEB_APP_URL` in the workspace `config.js` to that URL and publish the website.

The spreadsheet should remain private; visitors only submit through the web app. Do not put the spreadsheet ID or barber email into browser code as a substitute for the server-side properties.

## Prototype behavior and operational notes

- The sheet records the request before email is sent. Its status column notes whether both messages were sent.
- The barber gets the full request; the customer gets an email acknowledging receipt. The requested appointment is **not confirmed** until the barber verifies it.
- The server rejects closed days, outside-hours requests, invalid services, duplicate request IDs, and a time already present in the sheet. Available times shown in the page are based on opening hours; the server checks the sheet again when the form is submitted.
- Requests are limited to five per email address per hour. This lightweight limit and the hidden anti-spam field are not a substitute for a production anti-abuse service.
- The page collects a name, email address, phone number, appointment request, and optional note. Publish an appropriate privacy notice and define who can access the sheet and when old requests are deleted before using real customer data.
- Review shop hours, prices, services, spreadsheet access, Apps Script deployment access, and email quota before using this for real bookings.
