(function () {
  const CC = "sarvadharatravels@gmail.com";
  const LS_SEQ = "svt_invoice_seq_v1";
  const SERVICES = [
    "Flight",
    "Bus",
    "Train",
    "Tour package",
    "Hotel",
    "Passport assistance",
    "Visa assistance",
    "FTI-TTP registration",
    "Cargo-Domestic",
    "Cargo-International",
    "Pet transport",
    "Other",
  ];

  const el = (id) => document.getElementById(id);
  const linesWrap = el("invLines");
  const preview = el("invPreview");
  if (!linesWrap || !preview) return;

  function todayISO() {
    const d = new Date();
    const z = (n) => String(n).padStart(2, "0");
    return `${d.getFullYear()}-${z(d.getMonth() + 1)}-${z(d.getDate())}`;
  }

  function nextInvoiceNo() {
    const d = new Date();
    const y = d.getFullYear();
    let seq = 1;
    try {
      const raw = localStorage.getItem(LS_SEQ);
      const obj = raw ? JSON.parse(raw) : {};
      if (obj.year === y && Number(obj.seq) > 0) seq = Number(obj.seq) + 1;
      localStorage.setItem(LS_SEQ, JSON.stringify({ year: y, seq }));
    } catch (e) {
      seq = Number(String(Date.now()).slice(-4));
    }
    return `SVT/${y}/${String(seq).padStart(4, "0")}`;
  }

  function money(n) {
    const v = Number(n) || 0;
    return "₹" + v.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
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
    out = (out.trim() ? out.trim() + " Rupees" : "");
    if (paise) out += (out ? " and " : "") + two(paise) + " Paise";
    return (out || "Zero Rupees") + " Only";
  }

  function escapeHtml(str) {
    return String(str)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  function addLine(desc, qty, rate) {
    const row = document.createElement("div");
    row.className = "inv-line";
    const sel = document.createElement("select");
    sel.className = "inv-desc";
    SERVICES.forEach((s) => {
      const o = document.createElement("option");
      o.value = s;
      o.textContent = s;
      if (s === (desc || "Flight")) o.selected = true;
      sel.appendChild(o);
    });
    const custom = document.createElement("input");
    custom.type = "text";
    custom.className = "inv-custom";
    custom.placeholder = "Describe Other…";
    custom.hidden = true;
    custom.style.gridColumn = "1 / -1";
    const qtyIn = document.createElement("input");
    qtyIn.type = "number";
    qtyIn.min = "0";
    qtyIn.step = "1";
    qtyIn.value = qty != null ? qty : 1;
    qtyIn.title = "Qty";
    const rateIn = document.createElement("input");
    rateIn.type = "number";
    rateIn.min = "0";
    rateIn.step = "0.01";
    rateIn.value = rate != null ? rate : "";
    rateIn.placeholder = "Rate ₹";
    rateIn.title = "Rate";
    const rm = document.createElement("button");
    rm.type = "button";
    rm.className = "btn btn-sm btn-ghost-dark";
    rm.textContent = "×";
    rm.setAttribute("aria-label", "Remove line");
    rm.addEventListener("click", () => { row.remove(); render(); });
    sel.addEventListener("change", () => {
      custom.hidden = sel.value !== "Other";
      render();
    });
    [sel, custom, qtyIn, rateIn].forEach((n) => n.addEventListener("input", render));
    row.appendChild(sel);
    row.appendChild(qtyIn);
    row.appendChild(rateIn);
    row.appendChild(rm);
    row.appendChild(custom);
    linesWrap.appendChild(row);
    if (desc === "Other") { custom.hidden = false; }
    render();
  }

  function readLines() {
    return Array.from(linesWrap.querySelectorAll(".inv-line")).map((row) => {
      const sel = row.querySelector(".inv-desc");
      const custom = row.querySelector(".inv-custom");
      const nums = row.querySelectorAll("input[type=number]");
      const qty = Number(nums[0].value) || 0;
      const rate = Number(nums[1].value) || 0;
      let desc = sel.value;
      if (desc === "Other") desc = (custom.value || "").trim() || "Other";
      return { desc, qty, rate, amount: qty * rate };
    }).filter((l) => l.desc);
  }

  function state() {
    const lines = readLines();
    const linesSub = lines.reduce((s, l) => s + l.amount, 0);
    const svcCharge = Number(el("invSvcCharge").value) || 0;
    const discount = Number(el("invDiscount").value) || 0;
    const gstOn = el("invGstOn").value === "yes";
    const taxPct = gstOn ? (Number(el("invTax").value) || 0) : 0;
    const taxable = Math.max(0, linesSub + svcCharge - discount);
    const tax = taxable * (taxPct / 100);
    const total = taxable + tax;
    const paid = Number(el("amtPaid").value) || 0;
    const balance = Math.max(0, total - paid);
    return {
      no: el("invNo").value.trim() || nextInvoiceNo(),
      date: el("invDate").value || todayISO(),
      name: el("custName").value.trim(),
      email: el("custEmail").value.trim(),
      phone: el("custPhone").value.trim(),
      addr: el("custAddr") ? el("custAddr").value.trim() : "",
      notes: el("invNotes").value.trim(),
      lines,
      linesSub,
      svcCharge,
      discount,
      gstOn,
      taxPct,
      tax,
      gstin: el("invGstin").value.trim(),
      total,
      paid,
      balance,
      payMode: el("payMode").value,
      words: amountInWordsIndian(total),
    };
  }

  function render() {
    const s = state();
    const rows = s.lines.map((l) =>
      `<tr><td>${escapeHtml(l.desc)}</td><td class="amt">${l.qty}</td><td class="amt">${money(l.rate)}</td><td class="amt">${money(l.amount)}</td></tr>`
    ).join("") || `<tr><td colspan="4" style="color:var(--muted)">Add at least one line item</td></tr>`;
    preview.innerHTML = `
      <div class="inv-preview-head">
        <div>
          <strong>SARVADHARA TRAVELS</strong>
          <div style="font-size:0.78rem;color:var(--muted);margin-top:0.25rem">Chennai · <br/>+91 99402 99543 · ${CC}${s.gstin ? "<br/>GSTIN: " + escapeHtml(s.gstin) : ""}</div>
        </div>
        <div class="inv-preview-meta">
          <div>Invoice <strong style="color:var(--sky-deep)">${escapeHtml(s.no)}</strong></div>
          <div>Date ${escapeHtml(s.date)}</div>
        </div>
      </div>
      <div style="font-size:0.88rem;margin-bottom:0.5rem">
        <div style="font-size:0.7rem;letter-spacing:0.08em;text-transform:uppercase;color:var(--sky-deep);font-weight:700">Bill to</div>
        <div>${escapeHtml(s.name || "—")}</div>
        <div style="color:var(--muted)">${escapeHtml([s.email, s.phone].filter(Boolean).join(" · "))}</div>
        ${s.addr ? `<div style="color:var(--muted)">${escapeHtml(s.addr)}</div>` : ""}
      </div>
      <table>
        <thead><tr><th>Service</th><th class="amt">Qty</th><th class="amt">Rate</th><th class="amt">Amount</th></tr></thead>
        <tbody>${rows}</tbody>
      </table>
      <div style="font-size:0.88rem;color:var(--muted)">
        <div style="display:flex;justify-content:space-between"><span>Subtotal</span><span>${money(s.linesSub)}</span></div>
        ${s.svcCharge ? `<div style="display:flex;justify-content:space-between"><span>Service charge</span><span>${money(s.svcCharge)}</span></div>` : ""}
        ${s.discount ? `<div style="display:flex;justify-content:space-between"><span>Discount</span><span>− ${money(s.discount)}</span></div>` : ""}
        ${s.gstOn ? `<div style="display:flex;justify-content:space-between"><span>GST (${s.taxPct}%)</span><span>${money(s.tax)}</span></div>` : ""}
      </div>
      <div class="inv-total"><span>Total</span><span>${money(s.total)}</span></div>
      <p class="inv-words">${escapeHtml(s.words)}</p>
      <p class="inv-pay">Payment mode: <strong>${escapeHtml(s.payMode)}</strong> · Paid: <strong>${money(s.paid)}</strong> · Balance: <strong>${money(s.balance)}</strong></p>
      ${s.notes ? `<p style="margin:0.7rem 0 0;font-size:0.82rem;color:var(--muted)">${escapeHtml(s.notes)}</p>` : ""}
      <p class="inv-disclaimer">Subject to our <a href="terms.html">Conditions of Service</a>. We assist and arrange — we are not a government office, embassy or carrier.</p>
    `;
  }

  function buildPdf(s) {
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF({ unit: "pt", format: "a4" });
    const L = 48;
    let y = 56;
    doc.setFont("helvetica", "bold");
    doc.setFontSize(16);
    doc.setTextColor(122, 31, 61);
    doc.text("SARVADHARA TRAVELS", L, y);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    doc.setTextColor(90, 90, 90);
    y += 14;
    doc.text("Chennai ·  · +91 99402 99543 · " + CC, L, y);
    if (s.gstin) { y += 12; doc.text("GSTIN: " + s.gstin, L, y); }
    y += 8;
    doc.setDrawColor(201, 162, 77);
    doc.setLineWidth(1.2);
    doc.line(L, y + 6, 547, y + 6);
    y += 28;
    doc.setFont("helvetica", "bold");
    doc.setFontSize(12);
    doc.setTextColor(122, 31, 61);
    doc.text("INVOICE " + s.no, L, y);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    doc.text("Date: " + s.date, 400, y);
    y += 22;
    doc.setFont("helvetica", "bold");
    doc.setFontSize(9);
    doc.setTextColor(122, 31, 61);
    doc.text("BILL TO", L, y);
    y += 14;
    doc.setFont("helvetica", "normal");
    doc.setTextColor(122, 31, 61);
    doc.setFontSize(10);
    doc.text(s.name || "—", L, y); y += 13;
    doc.setTextColor(90, 90, 90);
    const contact = [s.email, s.phone].filter(Boolean).join(" · ");
    if (contact) { doc.text(contact, L, y); y += 13; }
    if (s.addr) {
      const addrLines = doc.splitTextToSize(s.addr, 480);
      doc.text(addrLines, L, y);
      y += addrLines.length * 12;
    }
    y += 10;
    doc.setFont("helvetica", "bold");
    doc.setFontSize(9);
    doc.setTextColor(122, 31, 61);
    doc.text("Service", L, y);
    doc.text("Qty", 320, y);
    doc.text("Rate", 380, y);
    doc.text("Amount", 480, y);
    y += 6;
    doc.setDrawColor(220, 220, 220);
    doc.line(L, y, 547, y);
    y += 14;
    doc.setFont("helvetica", "normal");
    doc.setTextColor(40, 40, 40);
    doc.setFontSize(10);
    s.lines.forEach((l) => {
      if (y > 700) { doc.addPage(); y = 56; }
      doc.text(String(l.desc).slice(0, 48), L, y);
      doc.text(String(l.qty), 320, y);
      doc.text(money(l.rate), 380, y);
      doc.text(money(l.amount), 480, y);
      y += 16;
    });
    y += 8;
    doc.setDrawColor(201, 162, 77);
    doc.line(L, y, 547, y);
    y += 18;
    doc.setFontSize(10);
    doc.setTextColor(60, 60, 60);
    const rows = [
      ["Subtotal", money(s.linesSub)],
      s.svcCharge ? ["Service charge", money(s.svcCharge)] : null,
      s.discount ? ["Discount", "− " + money(s.discount)] : null,
      s.gstOn ? ["GST (" + s.taxPct + "%)", money(s.tax)] : null,
    ].filter(Boolean);
    rows.forEach(([a, b]) => { doc.text(a, 360, y); doc.text(b, 480, y); y += 14; });
    doc.setFont("helvetica", "bold");
    doc.setFontSize(12);
    doc.setTextColor(122, 31, 61);
    doc.text("Total", 360, y);
    doc.setTextColor(122, 31, 61);
    doc.text(money(s.total), 480, y);
    y += 18;
    doc.setFont("helvetica", "italic");
    doc.setFontSize(9);
    doc.setTextColor(70, 70, 70);
    const words = doc.splitTextToSize(s.words, 500);
    doc.text(words, L, y);
    y += words.length * 12 + 8;
    doc.setFont("helvetica", "normal");
    doc.text(`Payment: ${s.payMode} · Paid: ${money(s.paid)} · Balance: ${money(s.balance)}`, L, y);
    y += 16;
    if (s.notes) {
      const notes = doc.splitTextToSize("Notes: " + s.notes, 500);
      doc.text(notes, L, y);
      y += notes.length * 12 + 8;
    }
    doc.setFontSize(8);
    doc.setTextColor(120, 120, 120);
    const foot = doc.splitTextToSize(
      "Subject to SARVADHARA TRAVELS Conditions of Service (sarisaitravels.netlify.app/terms.html). We assist and arrange bookings — we are not a government office, embassy or carrier.",
      500
    );
    doc.text(foot, L, Math.min(y, 780));
    return doc;
  }

  function downloadPdf() {
    const s = state();
    if (!s.lines.length) { alert("Add at least one line item."); return null; }
    if (!window.jspdf) { alert("PDF library still loading — try again in a second."); return null; }
    if (!el("invNo").value.trim()) el("invNo").value = s.no;
    const doc = buildPdf(s);
    const filename = `SARVADHARA_TRAVELS_Invoice_${s.no.replace(/[^\w.-]+/g, "_")}.pdf`;
    doc.save(filename);
    return { s, filename };
  }

  function emailBody(s) {
    const services = s.lines.map((l) => `• ${l.desc} × ${l.qty} = ${money(l.amount)}`).join("\n");
    return [
      `Dear ${s.name || "Customer"},`,
      ``,
      `Please find your invoice from SARVADHARA TRAVELS.`,
      ``,
      `Invoice: ${s.no}`,
      `Date: ${s.date}`,
      `Amount due: ${money(s.total)} (${s.words})`,
      `Paid: ${money(s.paid)} · Balance: ${money(s.balance)} · Mode: ${s.payMode}`,
      ``,
      `Services:`,
      services || "—",
      s.notes ? `\nNote: ${s.notes}` : "",
      ``,
      `Please find the invoice PDF attached to this email.`,
      ``,
      `Thank you for choosing SARVADHARA TRAVELS.`,
      `Phone / WhatsApp: +91 99402 99543`,
      `Email: ${CC}`,
      ``,
    ].filter((line, i, arr) => !(line === "" && arr[i - 1] === "")).join("\n");
  }

  function subject(s) { return `Invoice ${s.no} - SARVADHARA TRAVELS`; }

  function openMailto(s) {
    if (!s.email) { alert("Enter the customer email first."); return; }
    const url = "mailto:" + encodeURIComponent(s.email) +
      "?cc=" + encodeURIComponent(CC) +
      "&subject=" + encodeURIComponent(subject(s)) +
      "&body=" + encodeURIComponent(emailBody(s));
    window.location.href = url;
  }

  function openGmail(s) {
    if (!s.email) { alert("Enter the customer email first."); return; }
    const url = "https://mail.google.com/mail/?view=cm&fs=1" +
      "&to=" + encodeURIComponent(s.email) +
      "&cc=" + encodeURIComponent(CC) +
      "&su=" + encodeURIComponent(subject(s)) +
      "&body=" + encodeURIComponent(emailBody(s));
    window.open(url, "_blank", "noopener");
  }

  function shareWhatsApp(s) {
    const text = [
      `SARVADHARA TRAVELS — Invoice ${s.no}`,
      `Date: ${s.date}`,
      `Customer: ${s.name || "—"}`,
      `Total: ${money(s.total)}`,
      `Paid: ${money(s.paid)} · Balance: ${money(s.balance)}`,
      `Mode: ${s.payMode}`,
      ``,
      ...s.lines.map((l) => `• ${l.desc} × ${l.qty} = ${money(l.amount)}`),
      ``,
      `Phone: +91 99402 99543`,
    ].join("\n");
    const phone = (s.phone || "").replace(/\D/g, "");
    const e164 = phone.length >= 10 ? (phone.length === 10 ? "91" + phone : phone) : "";
    const url = e164
      ? `https://wa.me/${e164}?text=${encodeURIComponent(text)}`
      : `https://wa.me/?text=${encodeURIComponent(text)}`;
    window.open(url, "_blank", "noopener");
  }

  function newInvoice() {
    el("invNo").value = nextInvoiceNo();
    el("invDate").value = todayISO();
    ["custName", "custEmail", "custPhone", "invNotes"].forEach((id) => { el(id).value = ""; });
    if (el("custAddr")) el("custAddr").value = "";
    el("invSvcCharge").value = "0";
    el("invDiscount").value = "0";
    el("invGstOn").value = "no";
    el("invTax").value = "18";
    el("invGstin").value = "";
    el("amtPaid").value = "0";
    el("payMode").value = "Cash";
    linesWrap.innerHTML = "";
    addLine("Flight", 1, "");
    render();
  }

  // init
  el("invDate").value = todayISO();
  el("invNo").value = nextInvoiceNo();
  if (el("year")) el("year").textContent = String(new Date().getFullYear());
  addLine("Flight", 1, "");
  [
    "invNo", "invDate", "custName", "custEmail", "custPhone", "invNotes",
    "invSvcCharge", "invDiscount", "invTax", "invGstOn", "invGstin", "amtPaid", "payMode",
  ].forEach((id) => {
    const n = el(id);
    if (n) n.addEventListener("input", render);
    if (n) n.addEventListener("change", render);
  });
  if (el("custAddr")) el("custAddr").addEventListener("input", render);
  el("addLine").addEventListener("click", () => addLine());
  el("btnDownloadPdf").addEventListener("click", () => downloadPdf());
  el("btnPrint").addEventListener("click", () => { render(); window.print(); });
  el("btnWhatsApp").addEventListener("click", () => {
    const s = state();
    if (!s.lines.length) { alert("Add at least one line item."); return; }
    shareWhatsApp(s);
  });
  el("btnEmailInvoice").addEventListener("click", () => {
    const out = downloadPdf();
    if (!out) return;
    setTimeout(() => openMailto(out.s), 400);
  });
  el("btnGmailCompose").addEventListener("click", () => {
    const out = downloadPdf();
    if (!out) return;
    setTimeout(() => openGmail(out.s), 400);
  });
  el("btnNewInvoice").addEventListener("click", () => newInvoice());
  render();
})();
