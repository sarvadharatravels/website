/* SARVADHARA TRAVELS — booking panel, Sarathi, motion */
const CONTACT = {
  phoneDisplay: "+91 99402 99543",
  phoneE164: "919940299543",
  whatsappEnabled: true,
  email: "sarvadharatravels@gmail.com",
  brand: "Sarvadhara Travels",
  formSubmitEndpoint: "https://formsubmit.co/sarvadharatravels@gmail.com",
  /* Paste Apps Script Web App URL after one-time setup (enquiry-backend/SETUP.md).
     Until set, FormSubmit handles owner + customer emails; Sheet logging needs the URL. */
  enquiryWebAppUrl: "",
  whatsappGreeting:
    "Hi Sarvadhara Travels, I would like to enquire about your services.",
};

const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
const isFinePointer = window.matchMedia("(pointer: fine)").matches;
const ENQUIRY_STORAGE_KEY = "svt_last_enquiry";

function waUrl(text) {
  const msg = text || CONTACT.whatsappGreeting;
  return `https://wa.me/${CONTACT.phoneE164}?text=${encodeURIComponent(msg)}`;
}


function makeEnquiryRef() {
  const d = new Date();
  const y = String(d.getFullYear()).slice(-2);
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let x = "";
  for (let i = 0; i < 4; i++) x += chars[Math.floor(Math.random() * chars.length)];
  return `SVT-${y}${m}${day}-${x}`;
}

function buildEnquirySummary(fields) {
  const skip = new Set(["_subject", "_captcha", "_template", "_next", "_honey", "_autoresponse", "_replyto", "honey"]);
  const order = [
    "reference", "enquiry_type", "trip_type", "route", "from", "to", "date", "return_date",
    "passengers", "cabin_class", "tour_type", "tour_destination", "tour_start", "tour_end",
    "tour_pax", "tour_notes", "doc_service", "visa_country", "doc_applicants", "doc_city",
    "trade_product", "trade_quantity", "trade_destination", "trade_incoterm",
    "sender_name", "pickup_address", "pickup_pin", "receiver_name", "receiver_phone", "receiver_address", "receiver_pin", "receiver_country", "parcel_type", "shipment_scope", "weight_kg", "length_cm", "width_cm", "height_cm", "declared_value", "contents", "cod", "selected_courier", "selected_price", "selected_etd", "agree_terms", "product", "quantity", "destination_country", "incoterm", "notes", "question",
    "name", "email", "phone", "source",
  ];
  const label = (k) => k.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
  const lines = [];
  const seen = new Set();
  order.forEach((k) => {
    if (skip.has(k) || seen.has(k)) return;
    const v = fields[k];
    if (v == null || String(v).trim() === "") return;
    seen.add(k);
    lines.push(`${label(k)}: ${String(v).trim()}`);
  });
  Object.keys(fields).forEach((k) => {
    if (skip.has(k) || seen.has(k) || k.startsWith("_")) return;
    const v = fields[k];
    if (v == null || String(v).trim() === "") return;
    lines.push(`${label(k)}: ${String(v).trim()}`);
  });
  return lines.join("\n");
}

function buildCustomerAutoresponse(ref, name, enquiryType, summary) {
  const who = name || "Guest";
  return [
    `Dear ${who},`,
    ``,
    `Thank you for contacting ${CONTACT.brand}.`,
    ``,
    `We have received your enquiry.`,
    `Your reference number is: ${ref}`,
    ``,
    `Enquiry type: ${enquiryType || "Enquiry"}`,
    ``,
    `Summary of your request:`,
    summary,
    ``,
    `Please keep this reference for your records. We will reply by email shortly.`,
    `You can also message us on WhatsApp with this reference.`,
    ``,
    `Write to us at ${CONTACT.email}.`,
    ``,
    `${CONTACT.brand} acts only as a booking agent and will only provide support.`,
    ``,
    `Warm regards,`,
    CONTACT.brand,
    CONTACT.email,
    `https://sarvadharatravels.in`,
  ].join("\n");
}

function buildWhatsAppEnquiryMessage(ref, fields, summary) {
  const name = (fields.name || "").trim() || "Guest";
  const type = (fields.enquiry_type || fields.type || "Enquiry").trim();
  return [
    `Hi Sarvadhara Travels,`,
    ``,
    `I just submitted an enquiry on the website.`,
    `Reference: ${ref}`,
    `Name: ${name}`,
    `Type: ${type}`,
    fields.email ? `Email: ${fields.email}` : "",
    fields.phone ? `Phone: ${fields.phone}` : "",
    ``,
    `Details:`,
    summary,
    ``,
    `Please assist. Thank you.`,
  ].filter((line, i, arr) => !(line === "" && arr[i - 1] === "")).join("\n");
}

function saveEnquiryLocal(payload) {
  try {
    sessionStorage.setItem(ENQUIRY_STORAGE_KEY, JSON.stringify(payload));
  } catch (_) {}
}

function readEnquiryLocal() {
  try {
    const raw = sessionStorage.getItem(ENQUIRY_STORAGE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch (_) {
    return null;
  }
}

function formToFields(form) {
  const fd = new FormData(form);
  const fields = {};
  fd.forEach((v, k) => {
    if (fields[k] == null) fields[k] = String(v);
  });
  return fields;
}

function ensureHidden(form, name, value) {
  let el = form.querySelector(`input[name="${name}"]`);
  if (!el) {
    el = document.createElement("input");
    el.type = "hidden";
    el.name = name;
    form.appendChild(el);
  }
  el.value = value == null ? "" : String(value);
  return el;
}

document.addEventListener("DOMContentLoaded", () => {
  wireContact();
  wireNav();
  wireHeaderScroll();
  wireSearchPanel();
  wireThanksHash();
  wireServicePanels();
  wireScrollReveal();
  wireSectionInview();
  wireStarfield();
  wireTradeMap();
  wireTranslateCleanup();
  wireLangSelect();
  wireSarathi();
  const y = document.getElementById("year");
  if (y) y.textContent = String(new Date().getFullYear());
});

function wireContact() {
  const mail = CONTACT.email;
  ["contactEmail", "footerEmail"].forEach((id) => {
    const el = document.getElementById(id);
    if (!el) return;
    el.href = `mailto:${mail}`;
    el.textContent = mail;
  });

  const showPhone = Boolean(CONTACT.phoneDisplay && CONTACT.phoneE164);
  document.querySelectorAll('[data-contact="phone"]').forEach((el) => {
    el.hidden = !showPhone;
  });
  const phoneLink = document.getElementById("contactPhone");
  if (phoneLink && showPhone) {
    phoneLink.href = `tel:+${CONTACT.phoneE164}`;
    phoneLink.textContent = CONTACT.phoneDisplay;
  }
  const footerPhone = document.getElementById("footerPhone");
  if (footerPhone && showPhone) {
    footerPhone.href = `tel:+${CONTACT.phoneE164}`;
    footerPhone.textContent = CONTACT.phoneDisplay;
  }

  const showWa = Boolean(CONTACT.whatsappEnabled && CONTACT.phoneE164);
  document.querySelectorAll('[data-contact="whatsapp"]').forEach((el) => {
    el.hidden = !showWa;
  });
  const waIds = ["navWhatsApp", "heroWhatsApp", "contactWhatsApp", "cardWhatsApp", "footerWhatsApp"];
  waIds.forEach((id) => {
    const el = document.getElementById(id);
    if (el && showWa) el.href = waUrl();
  });
  const sarathiEmail = document.getElementById("sarathiEmail");
  if (sarathiEmail) {
    sarathiEmail.href = `mailto:${mail}`;
    sarathiEmail.textContent = "Email us";
  }
  const sarathiWa = document.getElementById("sarathiWhatsApp");
  if (sarathiWa) {
    if (showWa) {
      sarathiWa.hidden = false;
      sarathiWa.textContent = "WhatsApp us";
      sarathiWa.href = waUrl("Hi Sarvadhara Travels, I have a question from the Sarathi chat on your website.");
    } else {
      sarathiWa.hidden = true;
    }
  }
  const floatWa = document.getElementById("floatWhatsApp");
  if (floatWa) {
    if (showWa) {
      floatWa.hidden = false;
      if (floatWa.tagName === "A") {
        floatWa.href = waUrl();
      }
    } else {
      floatWa.hidden = true;
    }
  }
  const floatWrap = document.getElementById("floatWhatsAppWrap");
  if (floatWrap) floatWrap.hidden = !showWa;

  document.querySelectorAll("[data-form-next]").forEach((next) => {
    const base = location.href.split("#")[0].split("?")[0];
    next.value = `${base}#thank-you`;
  });
  const next = document.getElementById("formNext");
  if (next) {
    const base = location.href.split("#")[0].split("?")[0];
    next.value = `${base}#thank-you`;
  }
}


function wireNav() {
  const toggle = document.getElementById("navToggle");
  const drawer = document.getElementById("navDrawer");
  const backdrop = document.getElementById("navBackdrop");
  const closeBtn = document.getElementById("navDrawerClose");
  const links = document.getElementById("navLinks");
  if (!toggle || !drawer) return;

  const setOpen = (open) => {
    drawer.hidden = false;
    if (backdrop) backdrop.hidden = false;
    requestAnimationFrame(() => {
      drawer.classList.toggle("is-open", open);
      if (backdrop) backdrop.classList.toggle("is-open", open);
    });
    if (!open) {
      setTimeout(() => {
        if (!drawer.classList.contains("is-open")) {
          drawer.hidden = true;
          if (backdrop) backdrop.hidden = true;
        }
      }, 400);
    }
    toggle.setAttribute("aria-expanded", open ? "true" : "false");
    document.body.classList.toggle("drawer-open", open);
  };

  toggle.addEventListener("click", () => {
    const open = !drawer.classList.contains("is-open");
    setOpen(open);
  });
  if (closeBtn) closeBtn.addEventListener("click", () => setOpen(false));
  if (backdrop) backdrop.addEventListener("click", () => setOpen(false));
  if (links) {
    links.querySelectorAll("a").forEach((a) =>
      a.addEventListener("click", () => setOpen(false))
    );
  }
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && drawer.classList.contains("is-open")) setOpen(false);
  });
}

function wireHeaderScroll() {
  const header = document.querySelector(".site-header");
  const root = document.querySelector(".snap-root") || window;
  if (!header) return;
  // Legal / light pages stay solid (cream bar + maroon logos) — never transparent white type
  const alwaysSolid = header.hasAttribute("data-solid") ||
    document.body.classList.contains("page-legal");
  if (alwaysSolid) {
    header.classList.add("is-solid");
    return;
  }
  const onScroll = () => {
    const y = root === window ? window.scrollY : root.scrollTop;
    header.classList.toggle("is-solid", y > 40);
  };
  onScroll();
  root.addEventListener("scroll", onScroll, { passive: true });
  window.addEventListener("scroll", onScroll, { passive: true });
}

/* ---------- Custom select ---------- */
function initCSelect(root) {
  const trigger = root.querySelector(".cselect-trigger");
  const menu = root.querySelector(".cselect-menu");
  const hidden = root.querySelector('input[type="hidden"]');
  const label = trigger.querySelector(".cselect-label");
  if (!trigger || !menu) return;

  const close = () => {
    root.classList.remove("open");
    trigger.setAttribute("aria-expanded", "false");
  };
  const open = () => {
    document.querySelectorAll(".cselect.open").forEach((el) => {
      if (el !== root) el.classList.remove("open");
    });
    document.querySelectorAll(".pax-field.open").forEach((el) => el.classList.remove("open"));
    root.classList.add("open");
    trigger.setAttribute("aria-expanded", "true");
  };

  trigger.addEventListener("click", (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (root.classList.contains("open")) close();
    else open();
  });
  trigger.addEventListener("keydown", (e) => {
    if (e.key === "Enter" || e.key === " " || e.key === "ArrowDown") {
      e.preventDefault();
      open();
      const first = menu.querySelector(".cselect-option");
      if (first) first.focus();
    }
    if (e.key === "Escape") close();
  });

  menu.querySelectorAll(".cselect-option").forEach((opt) => {
    opt.addEventListener("click", (e) => {
      e.preventDefault();
      const val = opt.dataset.value || opt.textContent.trim();
      if (hidden) hidden.value = val;
      if (label) label.textContent = opt.textContent.trim();
      menu.querySelectorAll(".cselect-option").forEach((o) => o.setAttribute("aria-selected", "false"));
      opt.setAttribute("aria-selected", "true");
      close();
      trigger.focus();
    });
    opt.addEventListener("keydown", (e) => {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        opt.click();
      }
      if (e.key === "Escape") {
        close();
        trigger.focus();
      }
      if (e.key === "ArrowDown") {
        e.preventDefault();
        const next = opt.nextElementSibling;
        if (next) next.focus();
      }
      if (e.key === "ArrowUp") {
        e.preventDefault();
        const prev = opt.previousElementSibling;
        if (prev) prev.focus();
      }
    });
  });
}

function wireSearchPanel() {
  const form = document.getElementById("bookingForm");
  if (!form) return;
  form.action = CONTACT.formSubmitEndpoint;

  document.querySelectorAll(".cselect").forEach(initCSelect);

  document.addEventListener("click", (e) => {
    if (!e.target.closest(".cselect")) {
      document.querySelectorAll(".cselect.open").forEach((el) => {
        el.classList.remove("open");
        const t = el.querySelector(".cselect-trigger");
        if (t) t.setAttribute("aria-expanded", "false");
      });
    }
    if (!e.target.closest(".pax-field")) {
      document.querySelectorAll(".pax-field.open").forEach((el) => el.classList.remove("open"));
    }
  });

  // Tabs
  const tabs = document.querySelectorAll(".search-tab");
  const typeInput = document.getElementById("travelType");
  const groups = document.querySelectorAll(".panel-group");

  function setType(type) {
    if (typeInput) typeInput.value = type;
    tabs.forEach((t) => {
      const on = t.dataset.type === type;
      t.classList.toggle("active", on);
      t.setAttribute("aria-selected", on ? "true" : "false");
    });
    groups.forEach((g) => {
      const show = (g.dataset.show || "").split(",");
      g.hidden = !show.includes(type);
    });
    // trip pills only for flights/hotels
    const trip = document.getElementById("tripPills");
    if (trip) trip.hidden = !(type === "Flights" || type === "Hotels");
  }

  tabs.forEach((tab) => tab.addEventListener("click", () => setType(tab.dataset.type)));
  setType(tabs[0] ? tabs[0].dataset.type : "Flights");

  // Trip pills
  document.querySelectorAll(".trip-pill").forEach((pill) => {
    pill.addEventListener("click", () => {
      document.querySelectorAll(".trip-pill").forEach((p) => p.classList.remove("active"));
      pill.classList.add("active");
      const tripType = document.getElementById("tripType");
      if (tripType) tripType.value = pill.dataset.trip || pill.textContent.trim();
      const ret = document.getElementById("fieldReturn");
      if (ret) ret.hidden = pill.dataset.trip === "One way";
    });
  });

  // Emirates-style airport pickers
  const AP = window.SarvadharaAirportPicker;
  let fromPicker = null;
  let toPicker = null;
  let tourDestPicker = null;
  if (AP) {
    const fromField = document.getElementById("fromField");
    const toField = document.getElementById("toField");
    const tourField = document.getElementById("tourDestField");
    if (fromField) {
      fromPicker = AP.create(fromField, { label: "From", focusNext: "#toField" });
    }
    if (toField) {
      toPicker = AP.create(toField, { label: "To" });
    }
    if (tourField) {
      tourDestPicker = AP.create(tourField, { label: "Destination" });
    }
    // Sensible defaults: Chennai → Dubai
    const list = window.SARVADHARA_AIRPORTS || [];
    const byCode = Object.fromEntries(list.map((a) => [a.code, a]));
    if (fromPicker && byCode.MAA) fromPicker.setSelected(byCode.MAA, true);
    if (toPicker && byCode.DXB) toPicker.setSelected(byCode.DXB, true);
  }

  // Swap From ↔ To (preserves selected airport objects)
  const swap = document.getElementById("swapBtn");
  if (swap) {
    swap.addEventListener("click", () => {
      if (fromPicker && toPicker) {
        const a = fromPicker.getSelected();
        const b = toPicker.getSelected();
        fromPicker.setSelected(b || null, true);
        toPicker.setSelected(a || null, true);
        return;
      }
      const a = document.getElementById("from");
      const b = document.getElementById("to");
      if (!a || !b) return;
      const tmp = a.value;
      a.value = b.value;
      b.value = tmp;
    });
  }

  // Passengers popover
  const paxField = document.getElementById("paxField");
  const paxTrigger = document.getElementById("paxTrigger");
  const paxDone = document.getElementById("paxDone");
  const adults = { el: document.getElementById("adultsVal"), min: 1, max: 9, v: 1 };
  const children = { el: document.getElementById("childrenVal"), min: 0, max: 8, v: 0 };
  const infants = { el: document.getElementById("infantsVal"), min: 0, max: 4, v: 0 };
  const cabinHidden = document.getElementById("cabinClass");
  const paxHidden = document.getElementById("passengers");

  function syncPaxLabel() {
    const total = adults.v + children.v + infants.v;
    const cabin = (cabinHidden && cabinHidden.value) || "Economy";
    if (paxTrigger) paxTrigger.textContent = `${total} traveller${total > 1 ? "s" : ""}, ${cabin}`;
    if (paxHidden) paxHidden.value = String(total);
  }

  function wireStepper(decId, incId, state) {
    const dec = document.getElementById(decId);
    const inc = document.getElementById(incId);
    const refresh = () => {
      if (state.el) state.el.textContent = String(state.v);
      if (dec) dec.disabled = state.v <= state.min;
      if (inc) inc.disabled = state.v >= state.max;
      syncPaxLabel();
    };
    if (dec) dec.addEventListener("click", () => { state.v = Math.max(state.min, state.v - 1); refresh(); });
    if (inc) inc.addEventListener("click", () => { state.v = Math.min(state.max, state.v + 1); refresh(); });
    refresh();
  }
  wireStepper("adultsDec", "adultsInc", adults);
  wireStepper("childrenDec", "childrenInc", children);
  wireStepper("infantsDec", "infantsInc", infants);

  if (paxTrigger && paxField) {
    paxTrigger.addEventListener("click", (e) => {
      e.preventDefault();
      e.stopPropagation();
      document.querySelectorAll(".cselect.open").forEach((el) => el.classList.remove("open"));
      paxField.classList.toggle("open");
      paxTrigger.setAttribute("aria-expanded", paxField.classList.contains("open") ? "true" : "false");
    });
  }
  if (paxDone && paxField) {
    paxDone.addEventListener("click", () => {
      paxField.classList.remove("open");
      if (paxTrigger) paxTrigger.focus();
    });
  }

  // cabin class chips inside popover
  document.querySelectorAll("[data-cabin]").forEach((btn) => {
    btn.addEventListener("click", () => {
      document.querySelectorAll("[data-cabin]").forEach((b) => b.classList.remove("active"));
      btn.classList.add("active");
      if (cabinHidden) cabinHidden.value = btn.dataset.cabin;
      syncPaxLabel();
    });
  });
  syncPaxLabel();

  form.addEventListener("submit", (e) => {
    form.querySelectorAll(".invalid").forEach((el) => el.classList.remove("invalid"));
    let ok = true;
    const mark = (el) => {
      if (!el) return;
      const wrap = el.closest(".search-field") || el;
      wrap.classList.add("invalid");
      el.classList.add("invalid");
      ok = false;
    };
    const name = form.querySelector('[name="name"]');
    const email = form.querySelector('[name="email"]');
    if (name && !String(name.value || "").trim()) mark(name);
    if (email && !String(email.value || "").trim()) mark(email);
    else if (email && email.value && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.value)) mark(email);

    const type = typeInput ? typeInput.value : "Flights";
    if (type === "Flights" || type === "Hotels") {
      const from = document.getElementById("from");
      const to = document.getElementById("to");
      const fromField = document.getElementById("fromField");
      const toField = document.getElementById("toField");
      if (from && !from.value.trim()) mark(fromField || from);
      if (to && !to.value.trim()) mark(toField || to);
    }
    if (type === "Holidays") {
      const dest = document.getElementById("tourDest");
      const destField = document.getElementById("tourDestField");
      if (dest && !dest.value.trim()) mark(destField || dest);
    }
    const route = document.getElementById("routeLine");
    if (route) {
      const f = (document.getElementById("from") || {}).value || "";
      const tv = (document.getElementById("to") || {}).value || "";
      route.value = f && tv ? `${f} → ${tv}` : f || tv || "";
    }
    if (type === "Export & Import") {
      const product = document.getElementById("tradeProduct");
      if (product && !product.value.trim()) mark(product);
    }
    if (!ok) {
      e.preventDefault();
      const first = form.querySelector(".invalid");
      if (first) first.focus();
      return;
    }

    e.preventDefault();
    prepareAndSendEnquiry(form, {
      enquiryType: type === "Export & Import" ? "Export & Import" : type,
      source: "Website booking panel",
    });
  });
}

function prepareAndSendEnquiry(form, opts) {
  const optsSafe = opts || {};
  const ref = makeEnquiryRef();
  const base = location.href.split("#")[0].split("?")[0];
  const thankUrl = `${base}?ref=${encodeURIComponent(ref)}#thank-you`;

  ensureHidden(form, "reference", ref);
  ensureHidden(form, "source", optsSafe.source || "Website form");
  if (optsSafe.enquiryType) ensureHidden(form, "enquiry_type", optsSafe.enquiryType);

  const fields = formToFields(form);
  fields.reference = ref;
  if (optsSafe.enquiryType) fields.enquiry_type = optsSafe.enquiryType;
  const summary = buildEnquirySummary(fields);
  const enquiryType = fields.enquiry_type || "Enquiry";
  const autoresponse = buildCustomerAutoresponse(ref, fields.name, enquiryType, summary);
  const waText = buildWhatsAppEnquiryMessage(ref, fields, summary);

  saveEnquiryLocal({
    reference: ref,
    name: fields.name || "",
    email: fields.email || "",
    phone: fields.phone || "",
    enquiryType,
    summary,
    waText,
    at: Date.now(),
  });

  const useApps = Boolean(CONTACT.enquiryWebAppUrl && CONTACT.enquiryWebAppUrl.indexOf("script.google.com") !== -1);

  if (useApps) {
    ensureHidden(form, "_next", thankUrl);
    form.action = CONTACT.enquiryWebAppUrl;
    form.method = "POST";
    // Remove FormSubmit-only fields if present
    ["_autoresponse", "_captcha", "_template", "_replyto"].forEach((n) => {
      const el = form.querySelector(`input[name="${n}"]`);
      if (el) el.remove();
    });
    ensureHidden(form, "_subject", `[${ref}] ${enquiryType} — Sarvadhara Travels`);
    form.submit();
    return;
  }

  // FormSubmit path: owner email + customer autoresponse with reference
  form.action = CONTACT.formSubmitEndpoint;
  form.method = "POST";
  ensureHidden(form, "_subject", `[${ref}] ${enquiryType} — Sarvadhara Travels`);
  ensureHidden(form, "_captcha", "false");
  ensureHidden(form, "_template", "table");
  ensureHidden(form, "_next", thankUrl);
  ensureHidden(form, "_replyto", fields.email || CONTACT.email);
  ensureHidden(form, "_autoresponse", autoresponse);
  form.submit();
}

function wireThanksHash() {
  const thanks = document.getElementById("thank-you");
  const again = document.getElementById("thanksAgain");
  const refEl = document.getElementById("thanksRef");
  const summaryEl = document.getElementById("thanksSummary");
  const waBtn = document.getElementById("thanksWhatsApp");

  function paramsRef() {
    try {
      return new URLSearchParams(location.search).get("ref") || "";
    } catch (_) {
      return "";
    }
  }

  function sync() {
    if (!thanks) return;
    const show = location.hash === "#thank-you";
    thanks.hidden = !show;
    if (!show) return;

    const stored = readEnquiryLocal() || {};
    const ref = paramsRef() || stored.reference || "";
    if (refEl) {
      refEl.textContent = ref || "—";
      refEl.parentElement.hidden = !ref;
    }
    if (summaryEl) {
      if (stored.summary) {
        summaryEl.textContent = stored.summary;
        summaryEl.hidden = false;
      } else {
        summaryEl.hidden = true;
      }
    }
    if (waBtn && CONTACT.whatsappEnabled && CONTACT.phoneE164) {
      const waText = stored.waText || (
        ref
          ? `Hi Sarvadhara Travels,\n\nI submitted an enquiry. Reference: ${ref}\nPlease assist. Thank you.`
          : CONTACT.whatsappGreeting
      );
      waBtn.href = waUrl(waText);
      waBtn.textContent = "WhatsApp us";
      waBtn.hidden = false;
      const isMobile = /Android|iPhone|iPad|iPod|Mobile/i.test(navigator.userAgent);
      if (isMobile && ref && stored.reference === ref && !stored.waOpened) {
        try {
          stored.waOpened = true;
          saveEnquiryLocal(stored);
          setTimeout(() => {
            window.open(waBtn.href, "_blank", "noopener,noreferrer");
          }, 600);
        } catch (_) {}
      }
    }
  }
  sync();
  window.addEventListener("hashchange", sync);
  window.addEventListener("popstate", sync);
  if (again) {
    again.addEventListener("click", () => {
      if (thanks) thanks.hidden = true;
      history.replaceState(null, "", location.pathname);
    });
  }
}

function wireServicePanels() {
  document.querySelectorAll(".service-card").forEach((card) => {
    const btn = card.querySelector(".svc-toggle");
    const body = card.querySelector(".svc-body");
    if (!btn || !body) return;
    btn.addEventListener("click", () => {
      const open = btn.getAttribute("aria-expanded") === "true";
      const next = !open;
      btn.setAttribute("aria-expanded", next ? "true" : "false");
      body.hidden = !next;
      card.classList.toggle("is-open", next);
    });
  });
  document.querySelectorAll("[data-enquiry]").forEach((a) => {
    a.addEventListener("click", () => {
      const type = a.getAttribute("data-enquiry");
      const tab = document.querySelector(`.search-tab[data-type="${type}"]`);
      if (tab) tab.click();
    });
  });
}

function wireScrollReveal() {
  const els = document.querySelectorAll(".reveal, .reveal-num");
  if (!els.length) return;
  if (reduceMotion || !("IntersectionObserver" in window)) {
    els.forEach((el) => {
      el.classList.add("is-visible");
      if (el.classList.contains("reveal-num") && el.dataset.count) {
        const suffix = el.dataset.suffix || "";
        el.textContent = el.dataset.count + suffix;
      }
    });
    return;
  }
  const io = new IntersectionObserver(
    (entries) => {
      entries.forEach((e) => {
        if (e.isIntersecting) {
          e.target.classList.add("is-visible");
          if (e.target.classList.contains("reveal-num") && e.target.dataset.count) {
            animateCount(e.target, Number(e.target.dataset.count));
          }
          io.unobserve(e.target);
        }
      });
    },
    { rootMargin: "0px 0px -8% 0px", threshold: 0.08 }
  );
  els.forEach((el) => io.observe(el));
}

function animateCount(el, target) {
  const suffix = el.dataset.suffix || "";
  const prefix = el.dataset.prefix || "";
  if (reduceMotion) {
    el.textContent = prefix + String(target) + suffix;
    return;
  }
  const dur = 1100;
  const t0 = performance.now();
  const tick = (now) => {
    const p = Math.min(1, (now - t0) / dur);
    const eased = 1 - Math.pow(1 - p, 3);
    el.textContent = prefix + String(Math.round(target * eased)) + suffix;
    if (p < 1) requestAnimationFrame(tick);
  };
  requestAnimationFrame(tick);
}

function wireSectionInview() {
  const sections = document.querySelectorAll(".snap-section");
  const mark = (s) => {
    s.classList.add("is-inview");
    s.querySelectorAll(".fp-dot animateMotion").forEach((am) => {
      try { am.beginElement(); } catch (_) { /* ignore */ }
    });
  };
  if (!sections.length) return;
  if (reduceMotion || !("IntersectionObserver" in window)) {
    sections.forEach(mark);
    return;
  }
  const io = new IntersectionObserver(
    (entries) => {
      entries.forEach((e) => {
        if (e.isIntersecting) mark(e.target);
      });
    },
    { threshold: 0.35 }
  );
  sections.forEach((s) => io.observe(s));
}

function wireTradeMap() {
  const wrap = document.getElementById("tradeMap");
  if (!wrap) return;
  const activate = () => {
    wrap.classList.add("is-drawn");
    if (!reduceMotion) {
      window.setTimeout(() => wrap.classList.add("is-flowing"), 1600);
    } else {
      wrap.classList.add("is-flowing");
    }
  };
  if (reduceMotion || !("IntersectionObserver" in window)) {
    activate();
    return;
  }
  const io = new IntersectionObserver(
    (entries) => {
      entries.forEach((e) => {
        if (e.isIntersecting) {
          activate();
          io.disconnect();
        }
      });
    },
    { threshold: 0.25 }
  );
  io.observe(wrap);
}

function wireStarfield() {
  if (reduceMotion || !isFinePointer) return;
  const root = document.createElement("div");
  root.className = "starfield";
  root.setAttribute("aria-hidden", "true");
  const c = document.createElement("canvas");
  root.appendChild(c);
  document.body.appendChild(root);
  const ctx = c.getContext("2d");
  let w = 0, h = 0, dpr = 1;
  const resize = () => {
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    w = window.innerWidth;
    h = window.innerHeight;
    c.width = Math.floor(w * dpr);
    c.height = Math.floor(h * dpr);
    c.style.width = w + "px";
    c.style.height = h + "px";
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  };
  resize();
  window.addEventListener("resize", resize, { passive: true });

  const stars = Array.from({ length: 10 }, (_, i) => ({
    x: -999, y: -999, tx: -999, ty: -999,
    lag: 0.08 + i * 0.035,
    r: 1.2 + (i % 3) * 0.55,
    a: 0.25 + (i % 5) * 0.1,
    ang: (i / 10) * Math.PI * 2,
    orbit: 10 + i * 5.5,
  }));
  let mx = -999, my = -999, on = false, raf = 0;

  const draw = () => {
    ctx.clearRect(0, 0, w, h);
    if (!on || mx < 0) {
      raf = requestAnimationFrame(draw);
      return;
    }
    // soft orbit glow
    const g = ctx.createRadialGradient(mx, my, 0, mx, my, 90);
    g.addColorStop(0, "rgba(201,162,77,0.16)");
    g.addColorStop(0.45, "rgba(201,162,77,0.06)");
    g.addColorStop(1, "rgba(201,162,77,0)");
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.arc(mx, my, 90, 0, Math.PI * 2);
    ctx.fill();
    // thin gold orbit ring
    ctx.strokeStyle = "rgba(201,162,77,0.28)";
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.ellipse(mx, my, 42, 26, Math.PI / 7, 0, Math.PI * 2);
    ctx.stroke();

    const t = performance.now() / 1000;
    stars.forEach((s, i) => {
      const ox = Math.cos(t * 0.9 + s.ang) * s.orbit;
      const oy = Math.sin(t * 0.9 + s.ang) * s.orbit * 0.62;
      s.tx = mx + ox;
      s.ty = my + oy;
      s.x += (s.tx - s.x) * s.lag;
      s.y += (s.ty - s.y) * s.lag;
      ctx.beginPath();
      ctx.fillStyle = `rgba(232,205,122,${s.a})`;
      ctx.shadowColor = "rgba(201,162,77,0.7)";
      ctx.shadowBlur = 8;
      ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
      ctx.fill();
      if (i === 0) {
        ctx.shadowBlur = 0;
        ctx.strokeStyle = "rgba(201,162,77,0.35)";
        ctx.beginPath();
        ctx.moveTo(mx, my);
        ctx.lineTo(s.x, s.y);
        ctx.stroke();
      }
    });
    ctx.shadowBlur = 0;
    raf = requestAnimationFrame(draw);
  };
  raf = requestAnimationFrame(draw);

  window.addEventListener("mousemove", (e) => {
    mx = e.clientX;
    my = e.clientY;
    on = true;
    root.classList.add("is-on");
  }, { passive: true });
  window.addEventListener("mouseleave", () => {
    on = false;
    root.classList.remove("is-on");
  });
  document.addEventListener("visibilitychange", () => {
    if (document.hidden) cancelAnimationFrame(raf);
    else raf = requestAnimationFrame(draw);
  });
}

function wireTranslateCleanup() {
  const kill = () => {
    document.querySelectorAll("iframe.goog-te-banner-frame, .goog-te-banner-frame").forEach((n) => n.remove());
    document.body.style.top = "0";
  };
  kill();
  setInterval(kill, 2000);
}

function wireLangSelect() {
  const sel = document.getElementById("langNative");
  if (!sel) return;
  const KEY = "sarvadhara_lang";
  const langs = ["en", "ta", "hi", "te", "ml", "kn", "bn", "mr", "gu", "pa", "ur"];

  const clearGoogTrans = () => {
    const host = location.hostname;
    const expire = "Thu, 01 Jan 1970 00:00:00 GMT";
    ["googtrans", "googtrans"].forEach(() => {});
    document.cookie = "googtrans=;path=/;expires=" + expire;
    if (host && host !== "localhost" && host !== "127.0.0.1") {
      document.cookie = "googtrans=;path=/;domain=" + host + ";expires=" + expire;
      document.cookie = "googtrans=;path=/;domain=." + host + ";expires=" + expire;
    }
  };

  const setGoogTrans = (lang) => {
    if (!lang || lang === "en") {
      clearGoogTrans();
      return;
    }
    const val = "/en/" + lang;
    document.cookie = "googtrans=" + val + ";path=/;max-age=31536000";
    const host = location.hostname;
    if (host && host !== "localhost" && host !== "127.0.0.1") {
      document.cookie = "googtrans=" + val + ";path=/;domain=" + host + ";max-age=31536000";
    }
  };

  const triggerCombo = (lang) => {
    const combo = document.querySelector(".goog-te-combo");
    if (!combo || !combo.options || !combo.options.length) return false;
    const code = langs.includes(lang) ? lang : "en";
    let idx = -1;
    for (let i = 0; i < combo.options.length; i++) {
      const v = (combo.options[i].value || "").toLowerCase();
      if (code === "en") {
        if (v === "" || v === "en" || v === "/en/en" || /\/en$/.test(v)) { idx = i; break; }
      } else if (v === code || v.endsWith("/" + code) || v.indexOf("/" + code) !== -1) {
        idx = i; break;
      }
    }
    if (idx < 0) return false;
    if (combo.selectedIndex !== idx) combo.selectedIndex = idx;
    combo.value = combo.options[idx].value;
    combo.dispatchEvent(new Event("change", { bubbles: true }));
    combo.dispatchEvent(new Event("input", { bubbles: true }));
    return true;
  };

  const saved = (() => {
    try { return localStorage.getItem(KEY) || "en"; } catch (_) { return "en"; }
  })();
  if (langs.includes(saved)) sel.value = saved;
  sel.classList.add("notranslate");
  sel.setAttribute("translate", "no");

  // Keep cookie aligned so Google Translate restores on next page
  setGoogTrans(saved);

  let bootTries = 0;
  const boot = () => {
    if (saved === "en") {
      triggerCombo("en");
      return;
    }
    if (triggerCombo(saved) || bootTries++ > 50) return;
    setTimeout(boot, 200);
  };
  // Wait for GT to inject .goog-te-combo (HORIZONTAL layout)
  setTimeout(boot, 300);
  const slot = document.getElementById("google_translate_element");
  if (slot && typeof MutationObserver === "function") {
    const mo = new MutationObserver(() => {
      if (document.querySelector(".goog-te-combo")) {
        bootTries = 0;
        boot();
        mo.disconnect();
      }
    });
    mo.observe(slot, { childList: true, subtree: true });
  }

  sel.addEventListener("change", () => {
    const lang = langs.includes(sel.value) ? sel.value : "en";
    try { localStorage.setItem(KEY, lang); } catch (_) {}
    setGoogTrans(lang);
    let tries = 0;
    const tick = () => {
      const ok = triggerCombo(lang);
      if (ok) {
        // English reset often needs a reload to drop translated DOM
        const translated = document.documentElement.classList.contains("translated-ltr")
          || document.documentElement.classList.contains("translated-rtl")
          || !!document.querySelector("font[style*='vertical-align']")
          || !!document.querySelector(".goog-te-spinner-animation");
        if (lang === "en") {
          setTimeout(() => location.reload(), 80);
        }
        return;
      }
      if (tries++ > 30) {
        // Cookie is set — reload so GT bootstraps in the chosen language
        location.reload();
        return;
      }
      setTimeout(tick, 200);
    };
    tick();
  });
}

/* ---------- Sarathi chat ---------- */
const SARATHI_FAQS = [
{
    keys: ["cancel", "cancellation", "refund", "rebook", "reschedule", "date change"],
    reply: "Write to SARVADHARA TRAVELS at sarvadharatravels@gmail.com and we will respond to you shortly. Refunds and changes follow the airline's fare rules. Sarvadhara Travels acts only as a booking agent and will assist you with the airline's process.",
  },
{
    keys: ["flight", "flights", "plane", "airfare", "ticket"],
    reply: "I can help you enquire about domestic and international flights. Use the Flights tab in the search panel above, or tell me your route and dates. I'm Sarathi, your on-site journey guide — not a human agent.",
  },
{
    keys: ["visa", "passport", "schengen", "embassy"],
    reply: "SARVADHARA TRAVELS offers passport and visa application assistance (Gulf, Asia, UK, USA, Canada, Australia, Schengen). We assist with forms and appointments — we are not a government office or embassy. Open Visa & Passport in the search panel, or ask me a specific country.",
  },
{
    keys: ["holiday", "tour", "package", "honeymoon", "pilgrimage", "hotel"],
    reply: "We arrange customised holidays — pilgrimage, honeymoon, family and group tours, plus hotel bookings. Use the Holidays or Hotels tab, or share your destination and dates.",
  },
{
    keys: ["export", "import", "spice", "spices", "coconut", "rice", "wheat", "trade", "iec"],
    reply: "Export & Import is handled by SarvadharaSai Enterprises (a Sarvadhara group business) — spices, coconut oil, rice, wheat and other agro products. IEC registered; Spices Board, FSSAI and APEDA requirements complied with as applicable. Visit the Export & Import page or use the Export & Import tab to send a trade enquiry.",
  },
{
    keys: ["cargo", "freight", "shipment", "shipping"],
    reply: "We arrange domestic and international cargo booking assistance (air/sea, door pickup, documentation help). We arrange — we are not the carrier. Use the enquiry form or WhatsApp.",
  },
{
    keys: ["pet", "dog", "cat", "animal"],
    reply: "We assist with pet transport (documents, AQCS guidance, IATA crate guidance, airline booking help). Official certificates remain with the authorities.",
  },
{
    keys: ["contact", "phone", "whatsapp", "email", "call", "address"],
    reply: "Write to SARVADHARA TRAVELS at sarvadharatravels@gmail.com and we will respond to you shortly.",
  },
{
    keys: ["bus", "train", "irctc", "tatkal"],
    reply: "We help with bus and IRCTC train bookings (including Tatkal assistance). Share your route and date in the enquiry form.",
  },
{
    keys: ["hello", "hi", "hey", "namaste", "vanakkam"],
    reply: "Namaste — I'm Sarathi, your journey guide for SARVADHARA TRAVELS. Ask about Flights, Visa & Passport, Holidays, Export & Import, or Contact. I'm an on-site assistant, not a human.",
  },
];

function wireSarathi() {
  const root = document.getElementById("sarathi");
  if (!root) return;
  const fab = document.getElementById("sarathiFab");
  const closeBtn = document.getElementById("sarathiClose");
  const msgs = document.getElementById("sarathiMsgs");
  const input = document.getElementById("sarathiInput");
  const send = document.getElementById("sarathiSend");
  const chips = root.querySelectorAll(".sarathi-chip");

  let leadMode = null; // collecting lead fields
  let lead = { name: "", phone: "", email: "", question: "" };

  function addBubble(text, who) {
    const d = document.createElement("div");
    d.className = `sarathi-bubble ${who}`;
    d.textContent = text;
    msgs.appendChild(d);
    msgs.scrollTop = msgs.scrollHeight;
  }

  function openPanel() {
    root.classList.add("open");
    fab.setAttribute("aria-expanded", "true");
    if (!msgs.dataset.greeted) {
      addBubble("Namaste — I'm Sarathi, your journey guide. I answer from our website FAQs. I'm not a human. Pick a topic or type a question.", "bot");
      msgs.dataset.greeted = "1";
    }
    if (input) input.focus();
  }
  function closePanel() {
    root.classList.remove("open");
    fab.setAttribute("aria-expanded", "false");
  }

  if (fab) fab.addEventListener("click", () => {
    if (root.classList.contains("open")) closePanel();
    else openPanel();
  });
  if (closeBtn) closeBtn.addEventListener("click", closePanel);

  function matchFaq(q) {
    const lower = q.toLowerCase();
    for (const item of SARATHI_FAQS) {
      if (item.keys.some((k) => lower.includes(k))) return item.reply;
    }
    return null;
  }

  function startLead(question) {
    lead = { name: "", phone: "", email: "", question: question || "" };
    leadMode = "name";
    addBubble("I don't have that exact answer yet. Leave your details and our team will email you. What's your name?", "bot");
  }

  function handleLead(text) {
    if (leadMode === "name") {
      lead.name = text;
      leadMode = "phone";
      addBubble("Thanks. Your phone number?", "bot");
      return;
    }
    if (leadMode === "phone") {
      lead.phone = text;
      leadMode = "email";
      addBubble("And your email?", "bot");
      return;
    }
    if (leadMode === "email") {
      lead.email = text;
      leadMode = null;
      addBubble("Sending your enquiry securely…", "bot");
      submitLead();
    }
  }

  function submitLead() {
    const f = document.createElement("form");
    f.method = "POST";
    f.style.display = "none";
    const fields = {
      name: lead.name,
      phone: lead.phone,
      email: lead.email,
      question: lead.question,
      enquiry_type: "Sarathi chat",
      source: "Sarathi chat",
    };
    Object.entries(fields).forEach(([k, v]) => {
      const inp = document.createElement("input");
      inp.name = k;
      inp.value = v;
      f.appendChild(inp);
    });
    document.body.appendChild(f);
    const ref = makeEnquiryRef();
    ensureHidden(f, "reference", ref);
    const all = formToFields(f);
    all.reference = ref;
    const summary = buildEnquirySummary(all);
    const autoresponse = buildCustomerAutoresponse(ref, lead.name, "Sarathi chat", summary);
    const waText = buildWhatsAppEnquiryMessage(ref, all, summary);
    saveEnquiryLocal({
      reference: ref,
      name: lead.name,
      email: lead.email,
      phone: lead.phone,
      enquiryType: "Sarathi chat",
      summary,
      waText,
      at: Date.now(),
    });
    const base = location.href.split("#")[0].split("?")[0];
    const thankUrl = `${base}?ref=${encodeURIComponent(ref)}#thank-you`;
    addBubble(`Enquiry prepared. Reference ${ref}. You will also get a confirmation by email.`, "bot");

    const useApps = Boolean(CONTACT.enquiryWebAppUrl && CONTACT.enquiryWebAppUrl.indexOf("script.google.com") !== -1);
    if (useApps) {
      f.action = CONTACT.enquiryWebAppUrl;
      ensureHidden(f, "_next", thankUrl);
      ensureHidden(f, "_subject", `[${ref}] Sarathi chat — Sarvadhara Travels`);
      f.submit();
      return;
    }
    f.action = CONTACT.formSubmitEndpoint;
    ensureHidden(f, "_subject", `[${ref}] Sarathi chat — Sarvadhara Travels`);
    ensureHidden(f, "_captcha", "false");
    ensureHidden(f, "_template", "table");
    ensureHidden(f, "_next", thankUrl);
    ensureHidden(f, "_replyto", lead.email || CONTACT.email);
    ensureHidden(f, "_autoresponse", autoresponse);
    const body = new FormData(f);
    fetch(CONTACT.formSubmitEndpoint, { method: "POST", body, headers: { Accept: "application/json" } })
      .then((r) => {
        if (r.ok) {
          addBubble(`Enquiry sent. Reference ${ref}. Check your email, or tap WhatsApp below to send the same details.`, "bot");
          location.hash = "thank-you";
          history.replaceState(null, "", `${base}?ref=${encodeURIComponent(ref)}#thank-you`);
          window.dispatchEvent(new Event("hashchange"));
        } else {
          f.submit();
        }
      })
      .catch(() => {
        addBubble("Opening secure send…", "bot");
        f.submit();
      });
  }

  function handleUser(text) {
    const q = text.trim();
    if (!q) return;
    addBubble(q, "user");
    if (leadMode) {
      handleLead(q);
      return;
    }
    const ans = matchFaq(q);
    if (ans) addBubble(ans, "bot");
    else startLead(q);
  }

  if (send && input) {
    send.addEventListener("click", () => {
      handleUser(input.value);
      input.value = "";
    });
    input.addEventListener("keydown", (e) => {
      if (e.key === "Enter") {
        e.preventDefault();
        handleUser(input.value);
        input.value = "";
      }
    });
  }

  chips.forEach((chip) => {
    chip.addEventListener("click", () => {
      openPanel();
      handleUser(chip.dataset.q || chip.textContent.trim());
    });
  });
}
