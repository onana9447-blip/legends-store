// ============================================================
//  LEGENDS — Backend (Google Apps Script)
//  Collez ce code dans https://script.google.com puis :
//  Déployer > Nouvelle deployment > Type : Application web
//  - Execute as : Moi
//  - Who has access : Anyone
//  Copiez l'URL obtenue dans BACKEND_URL (script.js + admin.js)
//  et mettez la même valeur que SECRET dans BACKEND_KEY.
// ============================================================

const SHEET_NAME = "Orders";
const SECRET = "CHANGE_ME"; // -> même valeur que BACKEND_KEY

function doGet(e) {
  if (e.parameter.key !== SECRET) return json({ error: "unauthorized" });
  const sheet = getSheet();
  const rows = sheet.getDataRange().getValues();
  const orders = [];
  for (let i = 1; i < rows.length; i++) {
    try { orders.push(JSON.parse(rows[i][0])); } catch (err) {}
  }
  return json({ orders });
}

function doPost(e) {
  let data;
  try { data = JSON.parse(e.postData.contents); } catch (err) { return json({ error: "bad json" }); }
  if (data.key !== SECRET) return json({ error: "unauthorized" });
  const order = data.order || {};
  if (!order.id) order.id = Date.now();
  if (!order.date) order.date = new Date().toISOString();
  getSheet().appendRow([JSON.stringify(order), new Date()]);
  return json({ ok: true });
}

function getSheet() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sheet = ss.getSheetByName(SHEET_NAME);
  if (!sheet) {
    sheet = ss.insertSheet(SHEET_NAME);
    sheet.appendRow(["order", "created"]);
  }
  return sheet;
}

function json(obj) {
  return ContentService
    .createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}
