/**
 * Sarvadhara Travels — Enquiry backend (Google Apps Script)
 * Attach to a Google Sheet owned by sarvadharatravels@gmail.com.
 * Deploy → New deployment → Web app
 *   Execute as: Me (sarvadharatravels@gmail.com)
 *   Who has access: Anyone
 * Then paste the Web App URL into assets/app.js → CONTACT.enquiryWebAppUrl
 *
 * Emails only (Sheet + MailApp). Site thank-you also offers client-side wa.me to two desks. Brand: Sarvadhara Travels. No opening hours.
 */

var OWNER_EMAIL = 'sarvadharatravels@gmail.com';
var BRAND = 'Sarvadhara Travels';
var SHEET_NAME = 'Enquiries';

function doGet() {
  return ContentService
    .createTextOutput(JSON.stringify({
      ok: true,
      service: BRAND + ' enquiry backend',
      hint: 'POST form fields to this URL'
    }))
    .setMimeType(ContentService.MimeType.JSON);
}

function doPost(e) {
  try {
    var data = {};
    if (e && e.parameter) {
      Object.keys(e.parameter).forEach(function (k) {
        data[k] = e.parameter[k];
      });
    }
    if (e && e.postData && e.postData.type === 'application/json' && e.postData.contents) {
      var parsed = JSON.parse(e.postData.contents);
      Object.keys(parsed).forEach(function (k) { data[k] = parsed[k]; });
    }

    // Honeypot
    if (data._honey || data.honey) {
      return json_({ ok: true, skipped: true });
    }

    var ref = sanitizeRef_(data.reference || data.ref || '') || makeRef_();
    var name = String(data.name || '').trim() || 'Guest';
    var email = String(data.email || '').trim();
    var phone = String(data.phone || '').trim();
    var enquiryType = String(data.enquiry_type || data.type || 'Enquiry').trim();
    var source = String(data.source || 'Website form').trim();
    var summary = buildSummary_(data, ref);

    ensureSheet_();
    appendRow_(ref, name, email, phone, enquiryType, source, summary, data);

    // Owner notification
    MailApp.sendEmail({
      to: OWNER_EMAIL,
      replyTo: email || OWNER_EMAIL,
      name: BRAND,
      subject: '[' + ref + '] ' + enquiryType + ' — ' + name,
      body: ownerBody_(ref, name, email, phone, enquiryType, source, summary, data)
    });

    // Customer confirmation (only if they gave an email)
    if (email && email.indexOf('@') !== -1) {
      MailApp.sendEmail({
        to: email,
        replyTo: OWNER_EMAIL,
        name: BRAND,
        subject: 'Enquiry received — ' + ref + ' — ' + BRAND,
        body: customerBody_(ref, name, enquiryType, summary)
      });
    }

    var next = String(data._next || data.next || '').trim();
    if (next) {
      var join = next.indexOf('#') !== -1 ? (next.indexOf('?') === -1 && next.indexOf('#') > 0 ? '' : '') : '';
      // Prefer query param before hash: https://site/?ref=SVT-...#thank-you
      var redirect = next;
      if (next.indexOf('#thank-you') !== -1) {
        var base = next.split('#')[0];
        var sep = base.indexOf('?') === -1 ? '?' : '&';
        redirect = base + sep + 'ref=' + encodeURIComponent(ref) + '#thank-you';
      } else {
        var sep2 = next.indexOf('?') === -1 ? '?' : '&';
        redirect = next + sep2 + 'ref=' + encodeURIComponent(ref);
      }
      return HtmlService.createHtmlOutput(
        '<!doctype html><meta charset="utf-8"><title>Redirecting…</title>' +
        '<p>Enquiry ' + ref + ' received. Redirecting…</p>' +
        '<script>location.replace(' + JSON.stringify(redirect) + ');</script>'
      );
    }

    return json_({ ok: true, reference: ref });
  } catch (err) {
    return json_({ ok: false, error: String(err) });
  }
}

function json_(obj) {
  return ContentService
    .createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}

function makeRef_() {
  var d = new Date();
  var y = String(d.getFullYear()).slice(-2);
  var m = ('0' + (d.getMonth() + 1)).slice(-2);
  var day = ('0' + d.getDate()).slice(-2);
  var chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  var x = '';
  for (var i = 0; i < 4; i++) {
    x += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return 'SVT-' + y + m + day + '-' + x;
}

function sanitizeRef_(r) {
  r = String(r || '').toUpperCase().trim();
  if (/^SVT-\d{6}-[A-Z0-9]{4}$/.test(r)) return r;
  return '';
}

function ensureSheet_() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sh = ss.getSheetByName(SHEET_NAME);
  if (!sh) {
    sh = ss.insertSheet(SHEET_NAME);
    sh.appendRow([
      'Timestamp', 'Reference', 'Name', 'Email', 'Phone',
      'Enquiry type', 'Source', 'Summary', 'Raw JSON'
    ]);
    sh.setFrozenRows(1);
  }
  return sh;
}

function appendRow_(ref, name, email, phone, enquiryType, source, summary, data) {
  var sh = ensureSheet_();
  var clean = {};
  Object.keys(data).forEach(function (k) {
    if (k.charAt(0) === '_') return;
    clean[k] = data[k];
  });
  sh.appendRow([
    new Date(),
    ref,
    name,
    email,
    phone,
    enquiryType,
    source,
    summary,
    JSON.stringify(clean)
  ]);
}

function buildSummary_(data, ref) {
  var lines = [];
  var keys = [
    'enquiry_type', 'trip_type', 'route', 'from', 'to', 'date', 'return_date',
    'passengers', 'cabin_class', 'tour_type', 'tour_destination', 'tour_start', 'tour_end',
    'tour_pax', 'tour_notes', 'doc_service', 'visa_country', 'doc_applicants', 'doc_city',
    'trade_product', 'trade_quantity', 'trade_destination', 'trade_incoterm',
    'product', 'quantity', 'destination_country', 'incoterm', 'notes', 'question'
  ];
  keys.forEach(function (k) {
    if (data[k]) lines.push(label_(k) + ': ' + data[k]);
  });
  return lines.join('\n') || ('Reference ' + ref);
}

function label_(k) {
  return k.replace(/_/g, ' ').replace(/\b\w/g, function (c) { return c.toUpperCase(); });
}

function ownerBody_(ref, name, email, phone, enquiryType, source, summary, data) {
  return [
    BRAND + ' — new enquiry',
    '',
    'Reference: ' + ref,
    'Type: ' + enquiryType,
    'Source: ' + source,
    'Name: ' + name,
    'Email: ' + email,
    'Phone: ' + phone,
    '',
    'Details:',
    summary,
    '',
    'Reply to the customer by email only (sarvadharatravels@gmail.com).',
    '— ' + BRAND
  ].join('\n');
}

function customerBody_(ref, name, enquiryType, summary) {
  return [
    'Dear ' + name + ',',
    '',
    'Thank you for contacting ' + BRAND + '.',
    '',
    'We have received your enquiry.',
    'Your reference number is: ' + ref,
    '',
    'Enquiry type: ' + enquiryType,
    '',
    'Summary of your request:',
    summary,
    '',
    'Please keep this reference for your records. We will reply by email shortly.',
    '',
    'Write to us anytime at sarvadharatravels@gmail.com.',
    '',
    BRAND + ' acts only as a booking agent and will only provide support.',
    '',
    'Warm regards,',
    BRAND,
    'sarvadharatravels@gmail.com',
    'https://sarvadharatravels.in'
  ].join('\n');
}
