// ============================================================
//  LEGENDS — Backend (Google Apps Script)
//  Déployez en Web App (Execute as: Moi / Access: Anyone).
//  Collez l'URL dans BACKEND_URL (script.js + admin.js).
//  SECRET  = clé admin privée (jamais dans le site) -> admin tape ça.
//  WRITE_KEY = clé publique (écriture commandes) -> dans script.js.
// ============================================================

const SECRET = "LgAdmin$9q2Xz!2026";
const WRITE_KEY = "legendsWritePub2026";
const PACKAGING_COST = 5;

const SHEETS = {
  Orders:   ["id","date","name","phone","city","address","payment","status","total","coupon","items"],
  Products: ["id","name","meta","price","oldPrice","rating","stock","sizes","category","image","cost","deliveryCost","adsCost","season","club","featured","limited","description","material","sizeStock"],
  Coupons:  ["id","code","type","value","active"],
  Reviews:  ["id","orderId","name","rating","comment","photo","verified"],
  Messages: ["id","date","name","email","message"]
};

function doGet(e){ return json({ ok:true, msg:"LEGENDS API" }); }

function doPost(e){
  let data;
  try { data = JSON.parse(e.postData.contents); } catch(err){ return json({ error:"bad json" }); }
  const k = data.key;
  switch(data.action){
    case "createOrder":  return createOrder(data, k);
    case "getOrders":    return guard(k, ()=> json({ orders: readSheet("Orders") }));
    case "updateOrder":  return guard(k, ()=>{ updateOrder(data.id, data.status); return json({ ok:true }); });
    case "deleteOrder":  return guard(k, ()=>{ deleteObj("Orders", data.id); return json({ ok:true }); });
    case "trackOrder":   return trackOrder(data.id, data.phone);
    case "getProducts":  return json({ products: readSheet("Products") });
    case "saveProduct":  return guard(k, ()=>{ saveProduct(data.product); return json({ ok:true }); });
    case "deleteProduct":return guard(k, ()=>{ deleteObj("Products", data.id); return json({ ok:true }); });
    case "getCoupons":   return json({ coupons: readSheet("Coupons") });
    case "saveCoupon":   return guard(k, ()=>{ saveCoupon(data.coupon); return json({ ok:true }); });
    case "deleteCoupon": return guard(k, ()=>{ deleteObj("Coupons", data.id); return json({ ok:true }); });
    case "applyCoupon":  return applyCoupon(data.code);
    case "stats":        return guard(k, ()=> json(stats()));
    case "addReview":    return addReview(data.review);
    case "getReviews":   return json({ reviews: readSheet("Reviews") });
    case "addMessage":   return addMessage(data.message);
    default:             return json({ error:"unknown action" });
  }
}

// ---------- helpers ----------
function json(obj){
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON);
}
function guard(k, fn){ if(k !== SECRET) return json({ error:"unauthorized" }); return fn(); }

function getSheet(name){
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let s = ss.getSheetByName(name);
  if(!s){ s = ss.insertSheet(name); s.appendRow(SHEETS[name]); }
  return s;
}
function readSheet(name){
  const s = getSheet(name);
  const vals = s.getDataRange().getValues();
  if(vals.length < 2) return [];
  const headers = vals[0];
  return vals.slice(1).map(r => {
    const o = {};
    headers.forEach((h,i)=> o[h] = r[i]);
    return o;
  });
}
function nextId(name){
  const rows = readSheet(name);
  let max = 0;
  rows.forEach(r => { const n = Number(r.id)||0; if(n>max) max=n; });
  return max + 1;
}
function appendObj(name, obj){
  const s = getSheet(name);
  const headers = SHEETS[name];
  if(!obj.id) obj.id = nextId(name);
  const row = headers.map(h => obj[h]);
  s.appendRow(row);
  return obj.id;
}
function updateObj(name, obj){
  const s = getSheet(name);
  const vals = s.getDataRange().getValues();
  const headers = vals[0];
  for(let i=1;i<vals.length;i++){
    if(String(vals[i][0]) === String(obj.id)){
      headers.forEach((h,idx)=>{ if(h in obj) s.getRange(i+1, idx+1).setValue(obj[h]); });
      return;
    }
  }
}
function deleteObj(name, id){
  const s = getSheet(name);
  const vals = s.getDataRange().getValues();
  for(let i=1;i<vals.length;i++){
    if(String(vals[i][0]) === String(id)){ s.deleteRow(i+1); return; }
  }
}

// ---------- orders ----------
function createOrder(data, k){
  if(k !== WRITE_KEY) return json({ error:"unauthorized" });
  const o = data.order || {};
  if(!o.id) o.id = Date.now();
  o.date = new Date().toISOString();
  o.status = "Pending";
  appendObj("Orders", o);
  return json({ ok:true, id:o.id });
}
function updateOrder(id, status){
  const rows = readSheet("Orders");
  const o = rows.find(r => String(r.id) === String(id));
  if(o) updateObj("Orders", { id:o.id, status:status });
}
function trackOrder(id, phone){
  const rows = readSheet("Orders");
  const o = rows.find(r => String(r.id) === String(id));
  if(!o) return json({ error:"not found" });
  if(String(o.phone).replace(/\s/g,"") !== String(phone).replace(/\s/g,"")) return json({ error:"phone mismatch" });
  return json({ order:{ id:o.id, status:o.status, total:o.total, date:o.date, name:o.name } });
}

// ---------- products ----------
function saveProduct(p){
  p.price = Number(p.price)||0;
  p.oldPrice = p.oldPrice ? Number(p.oldPrice) : "";
  p.rating = Number(p.rating)||5;
  p.cost = Number(p.cost)||0;
  p.deliveryCost = Number(p.deliveryCost)||0;
  p.adsCost = Number(p.adsCost)||0;
  p.featured = p.featured ? true : false;
  p.limited = p.limited ? true : false;
  if(typeof p.sizes === "string") p.sizes = p.sizes.split(",").map(s=>s.trim()).filter(Boolean);
  if(!Array.isArray(p.sizes)) p.sizes = [];
  let ss = p.sizeStock;
  if(typeof ss === "string"){ try{ ss = JSON.parse(ss); }catch(e){ ss = {}; } }
  if(!ss || typeof ss !== "object") ss = {};
  p.sizeStock = JSON.stringify(ss);
  let total = 0; Object.keys(ss).forEach(k=> total += Number(ss[k])||0);
  p.stock = total || (Number(p.stock)||0);
  if(p.id){ updateObj("Products", p); } else { appendObj("Products", p); }
}
function deleteProduct(id){ deleteObj("Products", id); }

// ---------- coupons ----------
function saveCoupon(c){
  c.type = c.type || "percent";
  c.value = Number(c.value)||0;
  c.active = c.active ? true : false;
  if(c.id){ updateObj("Coupons", c); } else { appendObj("Coupons", c); }
}
function applyCoupon(code){
  const cs = readSheet("Coupons");
  const c = cs.find(x => String(x.code).toLowerCase() === String(code).toLowerCase() && x.active);
  if(!c) return json({ error:"invalid" });
  return json({ ok:true, type:c.type, value:Number(c.value) });
}

// ---------- reviews / messages ----------
function addReview(r){
  r.id = Date.now();
  r.verified = r.verified ? true : false;
  appendObj("Reviews", r);
  return json({ ok:true });
}
function addMessage(m){
  m.id = Date.now();
  m.date = new Date().toISOString();
  appendObj("Messages", m);
  return json({ ok:true });
}

// ---------- stats / profit ----------
function stats(){
  const orders = readSheet("Orders");
  const products = readSheet("Products");
  const live = orders.filter(o => o.status !== "Cancelled");
  const today = new Date().toISOString().slice(0,10);
  const month = new Date().toISOString().slice(0,7);

  let totalSales = 0, monthlyRevenue = 0, todayOrders = 0;
  const best = {};
  live.forEach(o => {
    const t = Number(o.total)||0;
    totalSales += t;
    if((o.date||"").slice(0,7) === month) monthlyRevenue += t;
    if((o.date||"").slice(0,10) === today) todayOrders++;
    try {
      JSON.parse(o.items||"[]").forEach(it => { best[it.name] = (best[it.name]||0) + (it.qty||1); });
    } catch(e){}
  });

  const profit = live.reduce((sum,o)=>{
    try {
      JSON.parse(o.items||"[]").forEach(it=>{
        const p = products.find(pr => String(pr.id)===String(it.id)) || {};
        const cost = (Number(p.cost)||0) + PACKAGING_COST + (Number(p.deliveryCost)||0) + (Number(p.adsCost)||0);
        sum += ((Number(it.price)||0) - cost) * (it.qty||1);
      });
    } catch(e){}
    return sum;
  }, 0);

  const bestSelling = Object.entries(best).sort((a,b)=>b[1]-a[1]).slice(0,5).map(([name,qty])=>({name,qty}));
  const lowStock = products.filter(p => Number(p.stock) <= 5).map(p => ({ id:p.id, name:p.name, stock:Number(p.stock) }));
  const count = s => orders.filter(o => o.status === s).length;

  return {
    totalSales, monthlyRevenue, todayOrders, profit: Math.round(profit),
    bestSelling, lowStock,
    pending: count("Pending"), confirmed: count("Confirmed"),
    preparing: count("Preparing"), shipped: count("Shipped"),
    delivered: count("Delivered"), cancelled: count("Cancelled"),
    ordersTotal: orders.length
  };
}
