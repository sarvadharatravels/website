# Sarvadhara Travels — Enquiry backend setup

One-time setup under **sarvadharatravels@gmail.com** (not a personal Gmail).

## Why this
Manual Netlify zip uploads do **not** build Netlify Functions. This Google Apps Script web app:
1. Emails you the full enquiry at sarvadharatravels@gmail.com
2. Emails the customer a confirmation with reference `SVT-YYMMDD-XXXX`
3. Appends a row to a Google Sheet you can open anytime
4. Redirects the browser to the site thank-you screen with the reference

Until this is activated, the website still uses FormSubmit.co for owner + customer emails (with the same reference on the thank-you screen). Sheet logging starts only after this web app URL is pasted into the site.

## Steps (browser, signed in as sarvadharatravels@gmail.com)

1. Open **https://sheets.google.com** → Blank spreadsheet  
   Name it: `Sarvadhara Travels Enquiries`

2. **Extensions → Apps Script**. Delete any stub code. Paste the full contents of `Code.gs` from this folder. Save (Ctrl/Cmd+S).  
   Project name: `Sarvadhara Travels Enquiries`

3. **Deploy → New deployment**  
   - Type: **Web app**  
   - Description: `enquiry v1`  
   - Execute as: **Me** (sarvadharatravels@gmail.com)  
   - Who has access: **Anyone**  
   Click **Deploy**. Approve the Google permission screens (MailApp + Spreadsheet).

4. Copy the **Web app URL** (ends with `/exec`).

5. In the website file `assets/app.js`, set:
   ```js
   enquiryWebAppUrl: "https://script.google.com/macros/s/PASTE_ID/exec",
   ```
   Rebuild/upload the site zip (or ask the agent to put the URL in and rebuild).

6. Send a **test enquiry using only sarvadharatravels@gmail.com** as the customer email. Check:
   - Sheet tab **Enquiries** has a new row
   - Inbox has the owner notification and the customer confirmation (same mailbox for the test)

## Sheet columns
Timestamp · Reference · Name · Email · Phone · Enquiry type · Source · Summary · Raw JSON

## Brand rules in emails
- Name: Sarvadhara Travels only  
- No 24×7 / opening hours  
- Auto-replies are by email. Customers are also prompted on the thank-you screen to send the same enquiry on WhatsApp via wa.me/919940299543.
- Fully automatic server-sent WhatsApp needs the WhatsApp Business API (Meta + a provider) — optional later step; not configured in this zip.

## WhatsApp (client-side)
Enquiries also route through WhatsApp using `https://wa.me/919940299543` (no Business API in this build):
- Thank-you screen: **WhatsApp us** with prefilled reference + details
- Sarathi: **WhatsApp us** next to Email us
- Floating site-wide button opens WhatsApp directly (no chooser)
- Optional later: WhatsApp Business API — not set up here

