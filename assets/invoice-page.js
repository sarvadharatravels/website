(function () {
  "use strict";

  const TRAVEL_EMAIL = "sarvadharatravels@gmail.com";
  const ENTERPRISE_EMAIL = "Sarvadharasai.Enterprises@gmail.com";
  const CC_EMAIL = TRAVEL_EMAIL;
  const LS_SEQ = "sdt_invoice_seq_v2";
  const LS_DRAFTS = "sdt_invoice_drafts_v2";
  const LS_HISTORY = "sdt_invoice_history_v2";
  const LS_BIZ = "sdt_invoice_biz_v2";

  const SERVICE_TYPES = [
    "Flight ticket",
    "Hotel",
    "Holiday package",
    "Car rental",
    "Visa/Passport assistance",
    "Courier",
    "Cargo",
    "Export/Import",
    "Other",
  ];
  const ENTERPRISE_SERVICES = new Set(["Courier", "Cargo", "Export/Import"]);

  function isEnterpriseService(type) {
    return ENTERPRISE_SERVICES.has(type);
  }

  function invoiceNameFor(type) {
    return isEnterpriseService(type) ? "SarvadharaSai Enterprises" : "Sarvadhara Travels";
  }

  function defaultEmailFor(type) {
    return isEnterpriseService(type) ? ENTERPRISE_EMAIL : TRAVEL_EMAIL;
  }

  function isDefaultEmail(value) {
    const v = (value || "").trim().toLowerCase();
    return !v || v === TRAVEL_EMAIL.toLowerCase() || v === ENTERPRISE_EMAIL.toLowerCase();
  }

  function applyIssuerFromService() {
    const type = (el("serviceType") && el("serviceType").value) || SERVICE_TYPES[0];
    const name = invoiceNameFor(type);
    if (el("bizInvoiceName")) el("bizInvoiceName").value = name;
    const emailEl = el("bizEmail");
    if (emailEl && isDefaultEmail(emailEl.value)) {
      emailEl.value = defaultEmailFor(type);
    }
    const termsSheet = el("invoiceTermsSheet");
    if (termsSheet) termsSheet.hidden = isEnterpriseService(type);
  }
  const GST_RATES = [0, 5, 12, 18];
  const PAY_MODES = ["Cash", "UPI", "Bank transfer", "Card", "Cheque", "Pending"];

  const AIR_PRESETS = {
    domestic: { key: "domestic", category: "Domestic", fee: 500 },
    gulf: { key: "gulf", category: "Gulf / Short-haul", fee: 1500 },
    longhaul: { key: "longhaul", category: "Long-haul", fee: 2500 },
  };

  function hasBizGstin() {
    return !!(el("bizGstin") && el("bizGstin").value.trim());
  }

  function serviceFeeGstRate() {
    return hasBizGstin() ? 18 : 0;
  }

  function syncAirFeeGst() {
    const rate = serviceFeeGstRate();
    $$("#lineBody .line-row[data-air-fee=\"1\"]").forEach((tr) => {
      const sel = tr.querySelector(".l-gst");
      if (sel && Number(sel.value) !== rate) {
        sel.value = String(rate);
      }
    });
  }

  function applyAirPreset(key) {
    const preset = AIR_PRESETS[key];
    if (!preset) return;
    if (el("serviceType")) el("serviceType").value = "Flight ticket";
    applyIssuerFromService();
    const gst = serviceFeeGstRate();
    addLine({
      desc: "Air fare (pass-through) — " + preset.category,
      pnr: "",
      qty: 1,
      rate: "",
      gst: 0,
    });
    // mark the service fee line specially
    addLine({
      desc: "Service fee — " + preset.category + " air ticket",
      pnr: "",
      qty: 1,
      rate: preset.fee,
      gst: gst,
      airFee: true,
    });
    toast(preset.category + " ticket lines added · fee ₹" + preset.fee.toLocaleString("en-IN"));
  }

  const $ = (sel, root) => (root || document).querySelector(sel);
  const $$ = (sel, root) => Array.from((root || document).querySelectorAll(sel));
  const el = (id) => document.getElementById(id);

  function todayISO() {
    const d = new Date();
    return d.toISOString().slice(0, 10);
  }

  function addDaysISO(iso, days) {
    const d = new Date(iso + "T12:00:00");
    d.setDate(d.getDate() + days);
    return d.toISOString().slice(0, 10);
  }

  function formatDateIN(iso) {
    if (!iso) return "—";
    const [y, m, d] = iso.split("-");
    return `${d}/${m}/${y}`;
  }

  function money(n) {
    const v = Number(n) || 0;
    return "₹" + v.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  }

  function escapeHtml(str) {
    return String(str == null ? "" : str)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  function amountInWordsIndian(amount) {
    const ones = ["", "One", "Two", "Three", "Four", "Five", "Six", "Seven", "Eight", "Nine", "Ten", "Eleven", "Twelve", "Thirteen", "Fourteen", "Fifteen", "Sixteen", "Seventeen", "Eighteen", "Nineteen"];
    const tens = ["", "", "Twenty", "Thirty", "Forty", "Fifty", "Sixty", "Seventy", "Eighty", "Ninety"];
    function two(n) {
      if (n < 20) return ones[n];
      return tens[Math.floor(n / 10)] + (n % 10 ? " " + ones[n % 10] : "");
    }
    function three(n) {
      const h = Math.floor(n / 100);
      const r = n % 100;
      return (h ? ones[h] + " Hundred" + (r ? " " : "") : "") + (r ? two(r) : "");
    }
    amount = Math.round((Number(amount) || 0) * 100) / 100;
    let rupees = Math.floor(amount);
    let paise = Math.round((amount - rupees) * 100);
    if (rupees === 0 && paise === 0) return "Zero Rupees Only";
    let out = "";
    const crore = Math.floor(rupees / 10000000);
    rupees %= 10000000;
    const lakh = Math.floor(rupees / 100000);
    rupees %= 100000;
    const thousand = Math.floor(rupees / 1000);
    rupees %= 1000;
    const hundred = rupees;
    if (crore) out += three(crore) + " Crore ";
    if (lakh) out += three(lakh) + " Lakh ";
    if (thousand) out += three(thousand) + " Thousand ";
    if (hundred) out += three(hundred) + " ";
    out = out.trim() ? out.trim() + " Rupees" : "";
    if (paise) out += (out ? " and " : "") + two(paise) + " Paise";
    return (out || "Zero Rupees") + " Only";
  }

  function peekNextInvoiceNo() {
    const y = new Date().getFullYear();
    let seq = 1;
    try {
      const raw = localStorage.getItem(LS_SEQ);
      const obj = raw ? JSON.parse(raw) : {};
      if (obj.year === y && Number(obj.seq) > 0) seq = Number(obj.seq) + 1;
      else seq = 1;
    } catch (e) {
      seq = 1;
    }
    return `SDT-${y}-${String(seq).padStart(4, "0")}`;
  }

  function commitInvoiceNo(no) {
    const m = String(no || "").match(/^SDT-(\d{4})-(\d+)$/i);
    if (!m) return;
    const y = Number(m[1]);
    const seq = Number(m[2]);
    try {
      const raw = localStorage.getItem(LS_SEQ);
      const obj = raw ? JSON.parse(raw) : {};
      if (obj.year === y && Number(obj.seq) >= seq) return;
      localStorage.setItem(LS_SEQ, JSON.stringify({ year: y, seq }));
    } catch (e) { /* ignore */ }
  }

  function loadBiz() {
    try {
      return JSON.parse(localStorage.getItem(LS_BIZ) || "{}") || {};
    } catch (e) {
      return {};
    }
  }

  function saveBiz() {
    const data = {
      gstin: el("bizGstin").value.trim(),
      address: el("bizAddress").value.trim(),
      phone: el("bizPhone").value.trim(),
      email: el("bizEmail").value.trim() || CC_EMAIL,
    };
    try {
      localStorage.setItem(LS_BIZ, JSON.stringify(data));
    } catch (e) { /* ignore */ }
  }

  function applyBizDefaults() {
    const b = loadBiz();
    el("bizGstin").value = b.gstin || "";
    el("bizAddress").value = b.address || "";
    el("bizPhone").value = b.phone || "";
    el("bizEmail").value = b.email || CC_EMAIL;
  }

  function addLine(data) {
    data = data || {};
    const tbody = el("lineBody");
    const tr = document.createElement("tr");
    tr.className = "line-row";
    if (data.airFee) tr.setAttribute("data-air-fee", "1");

    const gstOpts = GST_RATES.map((g) =>
      `<option value="${g}"${Number(data.gst) === g ? " selected" : ""}>${g}%</option>`
    ).join("");

    tr.innerHTML = `
      <td><input type="text" class="l-desc" placeholder="Service description" value="${escapeHtml(data.desc || "")}" /></td>
      <td><input type="text" class="l-pnr" placeholder="PNR / Ref" value="${escapeHtml(data.pnr || "")}" /></td>
      <td><input type="number" class="l-qty" min="0" step="1" value="${data.qty != null ? data.qty : 1}" /></td>
      <td><input type="number" class="l-rate" min="0" step="0.01" placeholder="0.00" value="${data.rate != null && data.rate !== "" ? data.rate : ""}" /></td>
      <td><select class="l-gst">${gstOpts}</select></td>
      <td class="l-amt amt">₹0.00</td>
      <td class="no-print"><button type="button" class="btn-icon l-rm" aria-label="Remove line">×</button></td>
    `;
    tbody.appendChild(tr);
    tr.querySelector(".l-rm").addEventListener("click", () => {
      tr.remove();
      render();
    });
    $$("input, select", tr).forEach((n) => {
      n.addEventListener("input", render);
      n.addEventListener("change", render);
    });
    render();
  }

  function readLines() {
    return $$("#lineBody .line-row").map((tr) => {
      const desc = tr.querySelector(".l-desc").value.trim();
      const pnr = tr.querySelector(".l-pnr").value.trim();
      const qty = Number(tr.querySelector(".l-qty").value) || 0;
      const rate = Number(tr.querySelector(".l-rate").value) || 0;
      const gst = Number(tr.querySelector(".l-gst").value) || 0;
      const base = qty * rate;
      return { desc, pnr, qty, rate, gst, base, amount: base };
    });
  }

  function state() {
    const lines = readLines().filter((l) => l.desc || l.rate || l.pnr);
    const serviceFee = Number(el("serviceFee").value) || 0;
    const discount = Number(el("discount").value) || 0;
    const taxMode = ($$('input[name="taxMode"]:checked')[0] || {}).value || "cgst";

    let taxable = 0;
    let gstTotal = 0;
    const computed = lines.map((l) => {
      const base = l.qty * l.rate;
      const gstAmt = base * (l.gst / 100);
      taxable += base;
      gstTotal += gstAmt;
      return Object.assign({}, l, { base, gstAmt, amount: base });
    });

    taxable = Math.max(0, taxable + serviceFee - discount);
    // Recompute GST on lines only (service fee/discount without GST for simplicity unless lines have GST)
    // GST is per-line on line base; service fee and discount are outside GST unless noted
    let lineGst = computed.reduce((s, l) => s + l.gstAmt, 0);

    // Adjust: if discount/fee, GST stays on line items only (standard travel invoice practice)
    const cgst = taxMode === "cgst" ? lineGst / 2 : 0;
    const sgst = taxMode === "cgst" ? lineGst / 2 : 0;
    const igst = taxMode === "igst" ? lineGst : 0;
    const subtotal = computed.reduce((s, l) => s + l.base, 0);
    const total = Math.max(0, subtotal + serviceFee - discount + lineGst);
    const paid = Number(el("amtPaid").value) || 0;
    const balance = Math.max(0, total - paid);

    return {
      no: el("invNo").value.trim() || peekNextInvoiceNo(),
      date: el("invDate").value || todayISO(),
      due: el("invDue").value || "",
      serviceType: el("serviceType").value,
      invoiceName: invoiceNameFor(el("serviceType").value),
      custName: el("custName").value.trim(),
      custAddr: el("custAddr").value.trim(),
      custPhone: el("custPhone").value.trim(),
      custGstin: el("custGstin").value.trim(),
      lines: computed,
      subtotal,
      serviceFee,
      discount,
      taxMode,
      lineGst,
      cgst,
      sgst,
      igst,
      total,
      paid,
      balance,
      payMode: el("payMode").value,
      notes: el("invNotes").value.trim(),
      terms: el("invTerms").value.trim(),
      words: amountInWordsIndian(total),
      biz: {
        gstin: el("bizGstin").value.trim(),
        address: el("bizAddress").value.trim(),
        phone: el("bizPhone").value.trim(),
        email: el("bizEmail").value.trim() || CC_EMAIL,
      },
    };
  }

  function render() {
    const s = state();
    $$("#lineBody .line-row").forEach((tr) => {
      const qty = Number(tr.querySelector(".l-qty").value) || 0;
      const rate = Number(tr.querySelector(".l-rate").value) || 0;
      tr.querySelector(".l-amt").textContent = money(qty * rate);
    });

    el("sumSubtotal").textContent = money(s.subtotal);
    el("sumFee").textContent = money(s.serviceFee);
    el("sumDiscount").textContent = s.discount ? "− " + money(s.discount) : money(0);
    el("sumCgst").textContent = money(s.cgst);
    el("sumSgst").textContent = money(s.sgst);
    el("sumIgst").textContent = money(s.igst);
    el("sumTotal").textContent = money(s.total);
    el("sumWords").textContent = s.words;
    el("sumPaid").textContent = money(s.paid);
    el("sumBalance").textContent = money(s.balance);

    const showCgst = s.taxMode === "cgst";
    ["labCgst", "sumCgst", "labSgst", "sumSgst"].forEach((id) => { el(id).hidden = !showCgst; });
    ["labIgst", "sumIgst"].forEach((id) => { el(id).hidden = showCgst; });

    // Live preview sheet
    const prev = el("invoiceSheet");
    if (!prev) return;

    const bizGst = s.biz.gstin
      ? `GSTIN: ${escapeHtml(s.biz.gstin)}`
      : `GSTIN: <em class="pending">GSTIN (pending)</em>`;

    const lineRows = s.lines.length
      ? s.lines
          .map(
            (l, i) => `<tr>
          <td>${i + 1}</td>
          <td>${escapeHtml(l.desc || "—")}${l.pnr ? `<div class="muted tiny">PNR/Ref: ${escapeHtml(l.pnr)}</div>` : ""}</td>
          <td class="amt">${l.qty}</td>
          <td class="amt">${money(l.rate)}</td>
          <td class="amt">${l.gst}%</td>
          <td class="amt">${money(l.base)}</td>
        </tr>`
          )
          .join("")
      : `<tr><td colspan="6" class="muted">Add line items</td></tr>`;

    const taxBlock =
      s.taxMode === "cgst"
        ? `<div class="tot-row"><span>CGST</span><span>${money(s.cgst)}</span></div>
           <div class="tot-row"><span>SGST</span><span>${money(s.sgst)}</span></div>`
        : `<div class="tot-row"><span>IGST</span><span>${money(s.igst)}</span></div>`;

    prev.innerHTML = `
      <div class="sheet-head">
        <div class="sheet-brand">
          <img src="../assets/img/logo-emblem.png" alt="" width="64" height="64" />
          <div>
            <strong>${escapeHtml(s.invoiceName)}</strong>
            <div class="muted tiny">Udyam: UDYAM-TN-34-0125107</div>
            <div class="muted tiny">${s.biz.address ? escapeHtml(s.biz.address) : "Address on request"}</div>
            <div class="muted tiny">${[s.biz.phone, s.biz.email].filter(Boolean).map(escapeHtml).join(" · ")}</div>
            <div class="muted tiny">${bizGst}</div>
          </div>
        </div>
        <div class="sheet-meta">
          <div class="inv-label">TAX INVOICE</div>
          <div><span class="k">No.</span> <strong>${escapeHtml(s.no)}</strong></div>
          <div><span class="k">Date</span> ${escapeHtml(formatDateIN(s.date))}</div>
          ${s.due ? `<div><span class="k">Due</span> ${escapeHtml(formatDateIN(s.due))}</div>` : ""}
          <div><span class="k">Service</span> ${escapeHtml(s.serviceType)}</div>
        </div>
      </div>
      <div class="sheet-bill">
        <div class="k">Bill To</div>
        <div class="cust-name">${escapeHtml(s.custName || "—")}</div>
        ${s.custAddr ? `<div class="muted">${escapeHtml(s.custAddr)}</div>` : ""}
        <div class="muted">${[s.custPhone, s.custGstin ? "GSTIN: " + s.custGstin : ""].filter(Boolean).map(escapeHtml).join(" · ")}</div>
      </div>
      <table class="sheet-table">
        <thead>
          <tr><th>#</th><th>Description</th><th class="amt">Qty</th><th class="amt">Rate</th><th class="amt">GST</th><th class="amt">Amount</th></tr>
        </thead>
        <tbody>${lineRows}</tbody>
      </table>
      <div class="sheet-totals">
        <div class="words-box">
          <div class="k">Amount in words</div>
          <div>${escapeHtml(s.words)}</div>
        </div>
        <div class="tot-box">
          <div class="tot-row"><span>Subtotal</span><span>${money(s.subtotal)}</span></div>
          ${s.serviceFee ? `<div class="tot-row"><span>Service fee</span><span>${money(s.serviceFee)}</span></div>` : ""}
          ${s.discount ? `<div class="tot-row"><span>Discount</span><span>− ${money(s.discount)}</span></div>` : ""}
          ${taxBlock}
          <div class="tot-row grand"><span>Total</span><span>${money(s.total)}</span></div>
          <div class="tot-row"><span>Paid</span><span>${money(s.paid)}</span></div>
          <div class="tot-row"><span>Balance</span><span>${money(s.balance)}</span></div>
        </div>
      </div>
      <div class="sheet-foot">
        <div><span class="k">Payment</span> ${escapeHtml(s.payMode)}</div>
        ${s.notes ? `<div><span class="k">Notes</span> ${escapeHtml(s.notes)}</div>` : ""}
        ${s.terms ? `<div><span class="k">Terms</span> ${escapeHtml(s.terms)}</div>` : ""}
        <p class="disclaimer">This is a computer-generated invoice from ${escapeHtml(s.invoiceName)}. Subject to Terms and Conditions.</p>
        <div class="sheet-tnc-footer">
          ${isEnterpriseService(s.serviceType)
            ? `<p><strong>SarvadharaSai Enterprises.</strong> <strong>Udyam: UDYAM-TN-34-0125107.</strong> <strong>SARVADHARASAI ENTERPRISES IS ONLY AN AGENT. WE WILL ONLY PROVIDE SUPPORT.</strong> Full Terms apply. Governed by Indian law; Chennai jurisdiction. Write to SarvadharaSai Enterprises at ${escapeHtml(s.biz.email || ENTERPRISE_EMAIL)} and we will respond to you shortly.</p>`
            : `<p><strong>Sarvadhara Travels.</strong> <strong>Udyam: UDYAM-TN-34-0125107.</strong> <strong>SARVADHARA TRAVELS IS ONLY AN AGENT. WE WILL ONLY PROVIDE SUPPORT.</strong> <strong>Sarvadhara Travels acts only as a booking agent and provides support/assistance only. Being only an agent, we shall not be held liable for any cost, loss, claim or compensation of any kind arising from the travel or the airline's services.</strong> Tickets are governed by airline fare rules and conditions of carriage; any compensation is payable by the airline alone under applicable law (DGCA CAR, Montreal Convention, EU261/UK261, US DOT, Canada APPR and others). Refunds only after the airline refunds, to the original payer. Passengers must check ticket details and are responsible for passports, visas and health documents. Full Terms apply. Governed by Indian law; Chennai jurisdiction. Write to Sarvadhara Travels at ${escapeHtml(s.biz.email || TRAVEL_EMAIL)} and we will respond to you shortly.</p>`}
        </div>
      </div>
    `;
  }

  function collectPayload() {
    return state();
  }

  function applyPayload(p) {
    if (!p) return;
    el("invNo").value = p.no || peekNextInvoiceNo();
    el("invDate").value = p.date || todayISO();
    el("invDue").value = p.due || "";
    const sel = el("serviceType");
    const typ = p.serviceType || SERVICE_TYPES[0];
    if (sel && typ && ![...sel.options].some((o) => o.value === typ)) {
      const opt = document.createElement("option");
      opt.value = typ;
      opt.textContent = typ;
      sel.appendChild(opt);
    }
    if (sel) sel.value = typ;
    applyIssuerFromService();
    el("custName").value = p.custName || "";
    el("custAddr").value = p.custAddr || "";
    el("custPhone").value = p.custPhone || "";
    el("custGstin").value = p.custGstin || "";
    el("serviceFee").value = p.serviceFee != null ? p.serviceFee : 0;
    el("discount").value = p.discount != null ? p.discount : 0;
    el("amtPaid").value = p.paid != null ? p.paid : 0;
    el("payMode").value = p.payMode || "UPI";
    el("invNotes").value = p.notes || "";
    el("invTerms").value = p.terms || "";
    const mode = p.taxMode === "igst" ? "igst" : "cgst";
    const radio = $(`input[name="taxMode"][value="${mode}"]`);
    if (radio) radio.checked = true;
    if (p.biz) {
      el("bizGstin").value = p.biz.gstin || "";
      el("bizAddress").value = p.biz.address || "";
      el("bizPhone").value = p.biz.phone || "";
      el("bizEmail").value = p.biz.email || CC_EMAIL;
    }
    el("lineBody").innerHTML = "";
    (p.lines && p.lines.length ? p.lines : [{ desc: "", qty: 1, rate: "", gst: 18 }]).forEach((l) => {
      const airFee = !!(l.airFee || /^Service fee — .+ air ticket$/i.test(l.desc || ""));
      addLine(Object.assign({}, l, { airFee: airFee }));
    });
    syncAirFeeGst();
    render();
  }

  function loadDrafts() {
    try {
      return JSON.parse(localStorage.getItem(LS_DRAFTS) || "[]") || [];
    } catch (e) {
      return [];
    }
  }

  function saveDrafts(list) {
    try {
      localStorage.setItem(LS_DRAFTS, JSON.stringify(list.slice(0, 40)));
    } catch (e) { /* ignore */ }
  }

  function loadHistory() {
    try {
      return JSON.parse(localStorage.getItem(LS_HISTORY) || "[]") || [];
    } catch (e) {
      return [];
    }
  }

  function saveHistory(list) {
    try {
      localStorage.setItem(LS_HISTORY, JSON.stringify(list.slice(0, 60)));
    } catch (e) { /* ignore */ }
  }

  function refreshLists() {
    const drafts = loadDrafts();
    const hist = loadHistory();
    const dSel = el("draftList");
    const hSel = el("historyList");
    dSel.innerHTML = '<option value="">— Saved drafts —</option>' +
      drafts.map((d, i) => `<option value="${i}">${escapeHtml(d.no)} · ${escapeHtml(d.custName || "Draft")} · ${escapeHtml(formatDateIN(d.date))}</option>`).join("");
    hSel.innerHTML = '<option value="">— Invoice history —</option>' +
      hist.map((d, i) => `<option value="${i}">${escapeHtml(d.no)} · ${escapeHtml(d.custName || "—")} · ${money(d.total)}</option>`).join("");
  }

  function saveCurrentDraft() {
    saveBiz();
    const s = collectPayload();
    if (!el("invNo").value.trim()) el("invNo").value = s.no;
    const drafts = loadDrafts().filter((d) => d.no !== s.no);
    drafts.unshift(Object.assign({}, s, { savedAt: new Date().toISOString() }));
    saveDrafts(drafts);
    refreshLists();
    toast("Draft saved locally.");
  }

  function archiveToHistory() {
    saveBiz();
    const s = collectPayload();
    if (!s.lines.length) {
      alert("Add at least one line item before saving to history.");
      return;
    }
    if (!el("invNo").value.trim()) el("invNo").value = s.no;
    commitInvoiceNo(s.no);
    const hist = loadHistory().filter((d) => d.no !== s.no);
    hist.unshift(Object.assign({}, s, { savedAt: new Date().toISOString() }));
    saveHistory(hist);
    // remove matching draft
    saveDrafts(loadDrafts().filter((d) => d.no !== s.no));
    refreshLists();
    toast("Saved to invoice history.");
  }

  function toast(msg) {
    let t = el("toast");
    if (!t) {
      t = document.createElement("div");
      t.id = "toast";
      t.className = "toast";
      document.body.appendChild(t);
    }
    t.textContent = msg;
    t.classList.add("show");
    clearTimeout(toast._tm);
    toast._tm = setTimeout(() => t.classList.remove("show"), 2200);
  }

  function shareWhatsApp() {
    const s = state();
    if (!s.lines.length) {
      alert("Add at least one line item.");
      return;
    }
    const text = [
      `*${s.invoiceName}* — Invoice ${s.no}`,
      `Date: ${formatDateIN(s.date)}${s.due ? " · Due: " + formatDateIN(s.due) : ""}`,
      `Customer: ${s.custName || "—"}`,
      `Service: ${s.serviceType}`,
      ``,
      ...s.lines.map((l) => `• ${l.desc}${l.pnr ? " (" + l.pnr + ")" : ""} × ${l.qty} = ${money(l.base)}`),
      ``,
      `Subtotal: ${money(s.subtotal)}`,
      s.serviceFee ? `Service fee: ${money(s.serviceFee)}` : null,
      s.discount ? `Discount: − ${money(s.discount)}` : null,
      s.taxMode === "cgst" ? `CGST/SGST: ${money(s.lineGst)}` : `IGST: ${money(s.igst)}`,
      `*Total: ${money(s.total)}*`,
      `(${s.words})`,
      `Paid: ${money(s.paid)} · Balance: ${money(s.balance)} · ${s.payMode}`,
      s.notes ? `Note: ${s.notes}` : null,
      ``,
      s.biz.phone ? `Phone: ${s.biz.phone}` : null,
      `Email: ${s.biz.email}`,
    ]
      .filter((x) => x != null)
      .join("\n");

    const phone = (s.custPhone || "").replace(/\D/g, "");
    const e164 = phone.length >= 10 ? (phone.length === 10 ? "91" + phone : phone) : "";
    const url = e164
      ? `https://wa.me/${e164}?text=${encodeURIComponent(text)}`
      : `https://wa.me/?text=${encodeURIComponent(text)}`;
    window.open(url, "_blank", "noopener");
  }

  function newInvoice() {
    el("invNo").value = peekNextInvoiceNo();
    el("invDate").value = todayISO();
    el("invDue").value = addDaysISO(todayISO(), 7);
    el("serviceType").value = SERVICE_TYPES[0];
    applyIssuerFromService();
    el("custName").value = "";
    el("custAddr").value = "";
    el("custPhone").value = "";
    el("custGstin").value = "";
    el("serviceFee").value = "0";
    el("discount").value = "0";
    el("amtPaid").value = "0";
    el("payMode").value = "UPI";
    el("invNotes").value = "";
    el("invTerms").value = "Payment due within 7 days. Cancellation and amendments as per airline/hotel/operator rules.";
    const cgst = $('input[name="taxMode"][value="cgst"]');
    if (cgst) cgst.checked = true;
    el("lineBody").innerHTML = "";
    addLine({ desc: "Flight ticket", qty: 1, rate: "", gst: 5 });
    render();
  }

  function fillSample() {
    // Clearly fictional demo data for screenshots / testing
    el("invNo").value = "SDT-2026-0042";
    el("invDate").value = "2026-10-28";
    el("invDue").value = "2026-11-04";
    el("serviceType").value = "Flight ticket";
    applyIssuerFromService();
    el("custName").value = "Demo Customer (Sample Only)";
    el("custAddr").value = "12 Fiction Lane, Sample Nagar, Chennai 600000";
    el("custPhone").value = "9000000001";
    el("custGstin").value = "";
    el("bizAddress").value = el("bizAddress").value || "Chennai, Tamil Nadu";
    el("bizPhone").value = el("bizPhone").value || "+91 99402 99543";
    el("bizEmail").value = CC_EMAIL;
    el("bizGstin").value = ""; // never invent GSTIN
    el("serviceFee").value = "250";
    el("discount").value = "100";
    el("amtPaid").value = "5000";
    el("payMode").value = "UPI";
    el("invNotes").value = "SAMPLE INVOICE — fictional data for preview only. Not a real booking.";
    el("invTerms").value = "Payment due within 7 days. Cancellation and amendments as per airline/hotel/operator rules.";
    const cgst = $('input[name="taxMode"][value="cgst"]');
    if (cgst) cgst.checked = true;
    el("lineBody").innerHTML = "";
    addLine({ desc: "Chennai (MAA) → Dubai (DXB) — Economy", pnr: "SAMPLE1", qty: 1, rate: 18500, gst: 5 });
    addLine({ desc: "Travel insurance (demo)", pnr: "INS-DEMO", qty: 1, rate: 899, gst: 18 });
    render();
  }

  // Expose for headless test
  window.__invoiceFillSample = fillSample;
  window.__invoiceState = state;
  window.__invoiceApplyAirPreset = applyAirPreset;
  window.__invoiceSyncAirFeeGst = syncAirFeeGst;
  window.__invoiceNew = newInvoice;
  window.__AIR_PRESETS = AIR_PRESETS;

  function bind() {
    applyBizDefaults();
    ["bizGstin", "bizAddress", "bizPhone", "bizEmail"].forEach((id) => {
      el(id).addEventListener("change", saveBiz);
      el(id).addEventListener("input", () => {
        if (id === "bizGstin") syncAirFeeGst();
        render();
      });
      el(id).addEventListener("change", () => {
        if (id === "bizGstin") { syncAirFeeGst(); render(); }
      });
    });

    [
      "invNo", "invDate", "invDue", "serviceType", "custName", "custAddr", "custPhone", "custGstin",
      "serviceFee", "discount", "amtPaid", "payMode", "invNotes", "invTerms",
    ].forEach((id) => {
      const n = el(id);
      if (!n) return;
      n.addEventListener("input", render);
      n.addEventListener("change", render);
    });

    $$('input[name="taxMode"]').forEach((r) => r.addEventListener("change", render));

    if (el("serviceType")) {
      el("serviceType").addEventListener("change", () => {
        applyIssuerFromService();
        render();
      });
    }

    el("addLine").addEventListener("click", () => addLine({ desc: "", qty: 1, rate: "", gst: 18 }));
    $$("[data-air-preset]").forEach((btn) => {
      btn.addEventListener("click", () => applyAirPreset(btn.getAttribute("data-air-preset")));
    });
    el("btnSaveDraft").addEventListener("click", saveCurrentDraft);
    el("btnSaveHistory").addEventListener("click", archiveToHistory);
    el("btnNew").addEventListener("click", () => {
      if (confirm("Start a new invoice? Unsaved changes will be lost unless you saved a draft.")) newInvoice();
    });
    el("btnPrint").addEventListener("click", () => {
      saveBiz();
      const s = state();
      if (!s.lines.length) { alert("Add at least one line item."); return; }
      if (!el("invNo").value.trim()) el("invNo").value = s.no;
      commitInvoiceNo(s.no);
      render();
      window.print();
    });
    el("btnPdf").addEventListener("click", () => {
      // Download PDF = print to PDF via browser
      el("btnPrint").click();
    });
    el("btnWhatsApp").addEventListener("click", shareWhatsApp);

    el("draftList").addEventListener("change", () => {
      const i = el("draftList").value;
      if (i === "") return;
      const drafts = loadDrafts();
      if (drafts[i]) applyPayload(drafts[i]);
      el("draftList").value = "";
    });
    el("historyList").addEventListener("change", () => {
      const i = el("historyList").value;
      if (i === "") return;
      const hist = loadHistory();
      if (hist[i]) applyPayload(hist[i]);
      el("historyList").value = "";
    });
    el("btnDeleteDraft").addEventListener("click", () => {
      const drafts = loadDrafts();
      const no = el("invNo").value.trim();
      if (!no) return;
      saveDrafts(drafts.filter((d) => d.no !== no));
      refreshLists();
      toast("Draft removed.");
    });

    // URL ?sample=1 for headless screenshots
    const params = new URLSearchParams(location.search);
    if (params.get("sample") === "1") {
      fillSample();
    } else {
      newInvoice();
    }
    refreshLists();
    render();

    if (el("year")) el("year").textContent = String(new Date().getFullYear());
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", bind);
  } else {
    bind();
  }
})();
