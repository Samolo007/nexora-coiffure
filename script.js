const cuts = {
      degrade: {
        name: "Dégradé", price: "25 €", priceAmount: 25,
        variants: [
          {
            name: "Dégradé bas",
            description: "Le fondu commence près des oreilles et de la nuque pour un résultat discret.",
            images: [
              "images/degrade-face.png",
              "images/degrade-dos.png",
              "images/degrade-profil-gauche.png",
              "images/degrade-profil-droit.png"
            ]
          },
          { name: "Dégradé moyen", description: "Le fondu remonte à mi-hauteur pour un contraste équilibré." },
          { name: "Dégradé haut", description: "Le fondu démarre plus haut sur les côtés pour un contraste marqué." }
        ],
        summary: "Un fondu progressif sur les côtés, associé à la longueur et au coiffage de votre choix.",
        ideal: "Un style net et facile à personnaliser.",
        maintenance: "Toutes les 2 à 3 semaines.",
        description: "Le dégradé se décline en version basse, moyenne ou haute selon le rendu souhaité. Votre barbier ajuste la transition à la forme de votre tête et à votre longueur sur le dessus. Pensez à préciser en commentaire si vous avez une préférence."
      },
      taper: {
        name: "Taper", price: "27 €", priceAmount: 27,
        variants: [
          { name: "Taper bas", description: "Un fondu très bas aux tempes et à la nuque, pour une finition discrète." },
          { name: "Taper haut", description: "Un fondu plus visible autour des tempes et de la nuque." },
          { name: "Burst taper", description: "Un fondu arrondi autour des oreilles, avec davantage de longueur conservée derrière." }
        ],
        summary: "Un dégradé discret autour des tempes et de la nuque, avec davantage de longueur conservée.",
        ideal: "Un rendu soigné, naturel et polyvalent.",
        maintenance: "Toutes les 2 à 4 semaines.",
        description: "Le taper affine progressivement les contours sans raccourcir toute la longueur des côtés. Il s’accorde facilement à différentes coiffures et peut être réalisé avec une finition naturelle ou plus marquée."
      },
      classique: {
        name: "Coupe classique", price: "23 €", priceAmount: 23,
        summary: "Une coupe équilibrée, travaillée aux ciseaux ou à la tondeuse selon votre style.",
        ideal: "Une coupe simple, adaptée à votre quotidien.",
        maintenance: "Toutes les 3 à 5 semaines.",
        description: "La coupe classique est ajustée à votre longueur actuelle et à la façon dont vous aimez vous coiffer. La prestation comprend un échange sur le résultat souhaité, la coupe et les finitions."
      },
      buzz: {
        name: "Buzz cut", price: "18 €", priceAmount: 18,
        images: [
          "images/buzz-face.png",
          "images/buzz-dos.png",
          "images/buzz-profil-gauche.png",
          "images/buzz-profil-droit.png"
        ],
        summary: "Une coupe courte et uniforme à la tondeuse, avec contours propres.",
        ideal: "Un style court, pratique et facile d’entretien.",
        maintenance: "Toutes les 2 à 4 semaines.",
        description: "La longueur est définie ensemble avant la coupe, puis la tondeuse est passée de manière régulière. Les contours sont ensuite nettoyés pour une finition nette."
      },
      crop: {
        name: "French crop", price: "25 €", priceAmount: 25,
        summary: "Des côtés courts et un dessus texturé, souvent porté avec une frange courte.",
        ideal: "Une coiffure texturée avec peu de mise en forme.",
        maintenance: "Toutes les 3 à 4 semaines.",
        description: "Le french crop joue sur le contraste entre des côtés courts et un dessus texturé. La longueur de la frange et le niveau de dégradé sont adaptés à votre préférence."
      },
      ciseaux: {
        name: "Coupe aux ciseaux", price: "28 €", priceAmount: 28,
        summary: "Une coupe réalisée principalement aux ciseaux pour conserver du mouvement et de la longueur.",
        ideal: "Les cheveux mi-longs ou une finition naturelle.",
        maintenance: "Toutes les 4 à 6 semaines.",
        description: "Le travail aux ciseaux permet de garder de la matière et d’ajuster les longueurs avec précision. La prestation se termine par un coiffage simple pour vous montrer le rendu."
      }
    };
    const extras = {
      none: { name: "Aucune option", price: 0 },
      beard: { name: "Taille de barbe", price: 12 },
      shave: { name: "Rasage traditionnel", price: 18 }
    };
    const openingPeriods = [{ start: 9 * 60, end: 12 * 60 }, { start: 13 * 60, end: 19 * 60 }];
    const angles = ["Face", "Dos", "Profil gauche", "Profil droit"];
    const detailRouteIds = ["accueil", "coupes", "reservation", "contact"];
    const detailSection = document.querySelector("#cutDetail");
    const galleryStage = document.querySelector("#galleryStage");
    const detailPhoto = document.querySelector("#detailPhoto");
    const photoPlaceholder = document.querySelector("#photoPlaceholder");
    const cutVariants = document.querySelector("#cutVariants");
    const variantOptions = document.querySelector("#variantOptions");
    const variantDescription = document.querySelector("#variantDescription");
    const variantBookingField = document.querySelector("#variantBookingField");
    const variantInput = document.querySelector("#variant");
    let activeCut = "";
    let activeVariantIndex = 0;
    let selectedVariantService = "";
    let activePhoto = 0;

    const serviceSelect = document.querySelector("#service");
    const bookingForm = document.querySelector("#bookingForm");
    const formMessage = document.querySelector("#formMessage");
    const dateInput = document.querySelector("#date");
    const extraSelect = document.querySelector("#extra");
    const timeSelect = document.querySelector("#time");
    const availabilityMessage = document.querySelector("#availabilityMessage");
    const priceEstimate = document.querySelector("#priceEstimate");
    const confirmationDetails = document.querySelector("#confirmationDetails");
    const today = new Date();
    const localToday = new Date(today.getTime() - today.getTimezoneOffset() * 60000);
    dateInput.min = localToday.toISOString().slice(0, 10);
    const bookingHorizon = new Date(localToday);
    bookingHorizon.setDate(bookingHorizon.getDate() + 60);
    dateInput.max = bookingHorizon.toISOString().slice(0, 10);

    const cutSlugs = {
      "Dégradé": "degrade",
      "Taper": "taper",
      "Coupe classique": "classique",
      "Buzz cut": "buzz",
      "French crop": "crop",
      "Coupe aux ciseaux": "ciseaux"
    };

    function renderGallery(index) {
      activePhoto = (index + angles.length) % angles.length;
      const angle = angles[activePhoto];
      const cut = cuts[activeCut];
      const images = cut.variants?.[activeVariantIndex]?.images ?? cut.images;
      const imagePath = images?.[activePhoto];
      detailPhoto.classList.toggle("has-photo", Boolean(imagePath));
      detailPhoto.classList.toggle("no-photo", !imagePath);
      galleryStage.classList.toggle("no-photo", !imagePath);
      photoPlaceholder.hidden = Boolean(imagePath);
      detailPhoto.style.backgroundImage = imagePath ? `url("${imagePath}")` : "";
      detailPhoto.dataset.angle = angle;
      detailPhoto.setAttribute(
        "aria-label",
        imagePath ? `Coupe ${cut.name}, vue de ${angle.toLowerCase()}` : `Vue de ${angle.toLowerCase()} — photo à ajouter`
      );
      document.querySelector("#angleLabel").textContent = `VUE ${angle.toUpperCase()}`;
      document.querySelectorAll(".gallery-thumbnail").forEach((button, buttonIndex) => {
        const isActive = buttonIndex === activePhoto;
        const thumbnail = button.querySelector("img");
        const thumbnailPath = images?.[buttonIndex];
        if (thumbnailPath) {
          thumbnail.src = thumbnailPath;
        } else {
          thumbnail.removeAttribute("src");
        }
        thumbnail.hidden = !images;
        button.classList.toggle("no-photo", !images);
        button.classList.toggle("active", isActive);
        button.setAttribute("aria-pressed", String(isActive));
      });
    }

    function renderVariant(index) {
      const cut = cuts[activeCut];
      if (!cut.variants) return;
      activeVariantIndex = index;
      const variant = cut.variants[index];
      variantOptions.querySelectorAll("button").forEach((button, buttonIndex) => {
        const isActive = buttonIndex === index;
        button.classList.toggle("active", isActive);
        button.setAttribute("aria-pressed", String(isActive));
      });
      variantDescription.textContent = variant.description;
      document.querySelector("#detailDescription").textContent = `${cut.description} ${variant.description}`;
      variantInput.value = variant.name;
      selectedVariantService = cut.name;
      variantBookingField.hidden = serviceSelect.value !== cut.name;
      renderGallery(0);
    }

    function renderRoute() {
      const slug = window.location.hash.startsWith("#coupe/") ? window.location.hash.slice("#coupe/".length) : "";
      const cut = cuts[slug];
      const isDetail = Boolean(cut);
      detailRouteIds.forEach((id) => {
        document.querySelector(`#${id}`).hidden = isDetail;
      });
      detailSection.hidden = !isDetail;

      if (isDetail && slug !== activeCut) {
        activeCut = slug;
        galleryStage.className = `gallery-stage ${slug === "degrade" ? "fade" : slug}`;
        document.querySelector("#detailTitle").textContent = cut.name;
        document.querySelector("#detailSummary").textContent = cut.summary;
        document.querySelector("#detailPrice").textContent = cut.price;
        document.querySelector("#detailIdeal").textContent = cut.ideal;
        document.querySelector("#detailMaintenance").textContent = cut.maintenance;
        cutVariants.hidden = !cut.variants;
        variantOptions.replaceChildren();
        if (cut.variants) {
          cut.variants.forEach((variant, index) => {
            const button = document.createElement("button");
            button.type = "button";
            button.className = "variant-option";
            button.textContent = variant.name;
            button.setAttribute("aria-pressed", "false");
            button.addEventListener("click", () => renderVariant(index));
            variantOptions.append(button);
          });
          renderVariant(0);
        } else {
          variantInput.value = "";
          variantBookingField.hidden = true;
          document.querySelector("#detailDescription").textContent = cut.description;
        }
        renderGallery(0);
      }

      if (isDetail) {
        window.scrollTo({ top: 0, behavior: "instant" });
      } else {
        activeCut = "";
        const target = window.location.hash.slice(1);
        if (target && target !== "accueil") {
          requestAnimationFrame(() => document.getElementById(target)?.scrollIntoView({ behavior: "smooth" }));
        } else {
          window.scrollTo({ top: 0, behavior: "instant" });
        }
      }
    }

    document.querySelectorAll(".cut-card").forEach((card) => {
      const openDetails = () => {
        window.location.hash = `coupe/${cutSlugs[card.dataset.service]}`;
      };
      card.addEventListener("click", openDetails);
      card.addEventListener("keydown", (event) => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          openDetails();
        }
      });
    });

    document.querySelectorAll(".gallery-thumbnail").forEach((button) => {
      button.addEventListener("click", () => renderGallery(Number(button.dataset.photo)));
    });
    document.querySelector("#previousPhoto").addEventListener("click", () => renderGallery(activePhoto - 1));
    document.querySelector("#nextPhoto").addEventListener("click", () => renderGallery(activePhoto + 1));
    document.querySelector("#bookThisCut").addEventListener("click", () => {
      serviceSelect.value = cuts[activeCut].name;
      variantInput.value = cuts[activeCut].variants?.[activeVariantIndex]?.name ?? "";
      selectedVariantService = variantInput.value ? cuts[activeCut].name : "";
      variantBookingField.hidden = !variantInput.value;
      updateAvailableSlots();
      window.location.hash = "reservation";
    });
    galleryStage.addEventListener("keydown", (event) => {
      if (event.key === "ArrowLeft") {
        event.preventDefault();
        renderGallery(activePhoto - 1);
      } else if (event.key === "ArrowRight") {
        event.preventDefault();
        renderGallery(activePhoto + 1);
      }
    });
    let galleryTouchStartX = null;
    galleryStage.addEventListener("touchstart", (event) => {
      galleryTouchStartX = event.changedTouches[0]?.clientX ?? null;
    }, { passive: true });
    galleryStage.addEventListener("touchend", (event) => {
      const touchEndX = event.changedTouches[0]?.clientX;
      if (galleryTouchStartX === null || touchEndX === undefined) return;
      const distance = touchEndX - galleryTouchStartX;
      if (Math.abs(distance) > 45) renderGallery(activePhoto + (distance < 0 ? 1 : -1));
      galleryTouchStartX = null;
    }, { passive: true });
    window.addEventListener("hashchange", renderRoute);
    renderRoute();

    function resetConfirmation() {
      formMessage.classList.remove("visible");
      confirmationDetails.replaceChildren();
    }

    function formatTime(minutes) {
      return `${String(Math.floor(minutes / 60)).padStart(2, "0")}:${String(minutes % 60).padStart(2, "0")}`;
    }

    function updatePriceEstimate() {
      const cut = Object.values(cuts).find((item) => item.name === serviceSelect.value);
      const extra = extras[extraSelect.value];
      priceEstimate.textContent = cut
        ? `Prix estimé : ${cut.priceAmount + extra.price} €`
        : "Choisissez une coupe pour voir le prix estimé.";
    }

    function updateAvailableSlots() {
      resetConfirmation();
      timeSelect.replaceChildren(new Option("Aucun créneau sélectionné", ""));
      const cut = Object.values(cuts).find((item) => item.name === serviceSelect.value);
      const date = dateInput.value;
      updatePriceEstimate();

      if (!date) {
        dateInput.setCustomValidity("");
        availabilityMessage.textContent = "Horaires démo : mardi–samedi, 9 h–12 h et 13 h–19 h. Fermé dimanche et lundi.";
        return;
      }

      const selectedDate = new Date(`${date}T12:00:00`);
      if (selectedDate.getDay() === 0 || selectedDate.getDay() === 1) {
        dateInput.setCustomValidity("Le salon est fermé le dimanche et le lundi dans cette démonstration.");
        availabilityMessage.textContent = "Fermé le dimanche et le lundi (horaires de démonstration).";
        return;
      }
      dateInput.setCustomValidity("");

      if (!cut) {
        availabilityMessage.textContent = "Choisissez une coupe pour afficher les heures de rendez-vous.";
        return;
      }

      const todayValue = localToday.toISOString().slice(0, 10);
      const currentMinutes = today.getHours() * 60 + today.getMinutes();
      const availableSlots = [];

      openingPeriods.forEach((period) => {
        for (let start = period.start; start < period.end; start += 30) {
          if (date === todayValue && start <= currentMinutes) continue;
          availableSlots.push(start);
        }
      });

      availableSlots.forEach((start) => {
        timeSelect.add(new Option(formatTime(start), String(start)));
      });

      availabilityMessage.textContent = availableSlots.length
        ? `${availableSlots.length} heures proposées selon les horaires d’ouverture.`
        : "Plus aucun horaire d’ouverture disponible pour aujourd’hui. Choisissez une autre date.";
    }

    [serviceSelect, extraSelect, dateInput].forEach((control) => {
      control.addEventListener("change", updateAvailableSlots);
    });
    serviceSelect.addEventListener("change", () => {
      if (serviceSelect.value !== selectedVariantService) {
        variantInput.value = "";
        selectedVariantService = "";
      }
      variantBookingField.hidden = !variantInput.value;
    });
    [
      document.querySelector("#name"),
      document.querySelector("#phone"),
      document.querySelector("#note")
    ].forEach((control) => {
      control.addEventListener("input", resetConfirmation);
    });
    timeSelect.addEventListener("change", resetConfirmation);

    bookingForm.addEventListener("submit", (event) => {
      event.preventDefault();
      if (!bookingForm.reportValidity()) return;
      const formData = new FormData(bookingForm);
      const service = Object.values(cuts).find((item) => item.name === formData.get("service"));
      const extra = extras[formData.get("extra")];
      if (!service || !extra || !formData.get("time")) {
        updateAvailableSlots();
        availabilityMessage.textContent = "Choisissez une coupe, une date et une heure d’ouverture.";
        return;
      }

      const date = new Date(`${formData.get("date")}T12:00:00`).toLocaleDateString("fr-FR", {
        weekday: "long", day: "numeric", month: "long"
      });
      const lines = [
        ["Nom", formData.get("name")],
        ["Téléphone", formData.get("phone")],
        ["Prestation", service.name],
        ...(formData.get("variant") ? [["Déclinaison", formData.get("variant")]] : []),
        ["Option", extra.name],
        ["Date", date],
        ["Heure", formatTime(Number(formData.get("time")))],
        ["Prix estimé", `${service.priceAmount + extra.price} €`]
      ];
      const note = formData.get("note").trim();
      if (note) lines.push(["Précision", note]);
      confirmationDetails.replaceChildren(...lines.map(([label, value]) => {
        const item = document.createElement("li");
        const title = document.createElement("strong");
        title.textContent = `${label} : `;
        item.append(title, document.createTextNode(value));
        return item;
      }));
      formMessage.classList.add("visible");
    });

    const menuToggle = document.querySelector("#menuToggle");
    const navLinks = document.querySelector("#navLinks");
    menuToggle.addEventListener("click", () => {
      const isOpen = navLinks.classList.toggle("open");
      menuToggle.setAttribute("aria-expanded", String(isOpen));
      menuToggle.setAttribute("aria-label", isOpen ? "Fermer le menu" : "Ouvrir le menu");
    });
    navLinks.querySelectorAll("a").forEach((link) => {
      link.addEventListener("click", () => {
        navLinks.classList.remove("open");
        menuToggle.setAttribute("aria-expanded", "false");
        menuToggle.setAttribute("aria-label", "Ouvrir le menu");
      });
    });
