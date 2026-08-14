// ============================================================
//  LEGENDS — Backend (Google Apps Script)
//  Collez ce code dans https://script.google.com puis :
//  Déployer > Nouvelle deployment > Type : Application web
//  - Execute as : Moi
//  - Who has access : Anyone
//  Copiez l'URL obtenue dans BACKEND_URL (script.js + admin.js)
//
//  SÉCURITÉ :
//  - SECRET  = clé de LECTURE (privée). Jamais dans le site. L'admin la tape.
//  - WRITE_KEY = clé d'ÉCRITURE (publique, va dans script.js). Un attaquant
//    ne peut qu'AJOUTER des lignes (spam), jamais LIRE les commandes.
// ============================================================

const SHEET_NAME = "Orders";
const SECRET = "LgAdmin$9q2Xz!2026";        // <- clé privée (lecture / suppression) — admin la tape
const WRITE_KEY = "legendsWritePub2026";    // <- clé publique (écriture seule) — va dans script.js

function doGet(e) {
  if (e.parameter.key === SECRET) return json({ orders: readOrders() });
  return json({ error: "unauthorized" });
}

function doPost(e) {
  let data;
  try { data = JSON.parse(e.postData.contents); } catch (err) { return json({ error: "bad json" }); }

  // --- LECTURE (admin) : secrète ---
  if (data.action === "read") {
    if (data.key !== SECRET) return json({ error: "unauthorized" });
    return json({ orders: readOrders() });
  }

  // --- SUPPRESSION (admin) : secrète ---
  if (data.action === "delete") {
    if (data.key !== SECRET) return json({ error: "unauthorized" });
    deleteOrder(data.id);
    return json({ ok: true });
  }

  // --- VIDER TOUT (admin) : secrète ---
  if (data.action === "clear") {
    if (data.key !== SECRET) return json({ error: "unauthorized" });
    clearOrders();
    return json({ ok: true });
  }

  // --- ÉCRITURE (site client) : clé publique write-only ---
  if (data.key !== WRITE_KEY) return json({ error: "unauthorized" });
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

function readOrders() {
  const sheet = getSheet();
  const rows = sheet.getDataRange().getValues();
  const out = [];
  for (let i = 1; i < rows.length; i++) {
    try { out.push(JSON.parse(rows[i][0])); } catch (err) {}
  }
  return out;
}

function deleteOrder(id) {
  const sheet = getSheet();
  const rows = sheet.getDataRange().getValues();
  for (let i = rows.length - 1; i >= 1; i--) {
    try {
      const o = JSON.parse(rows[i][0]);
      if (o.id === id) sheet.deleteRow(i + 1);
    } catch (err) {}
  }
}

function clearOrders() {
  const sheet = getSheet();
  const last = sheet.getLastRow();
  if (last > 1) sheet.getRange(2, 1, last - 1, sheet.getLastColumn()).clearContent();
}

function json(obj) {
  return ContentService
    .createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}
