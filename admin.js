let BACKEND_URL = "https://script.google.com/macros/s/AKfycbzsmQy56-f4-Pc0_zGY-hRSCwMJaZNZLV7jH0iQafZEjYFi5ZXI4t1fKZU8lr700xIo/exec";   // défini via l'écran de login
let readKey = "";

const gate = document.getElementById("gate");
const app = document.getElementById("app");
const passInput = document.getElementById("passInput");
const gateErr = document.getElementById("gateErr");

function api(action, extra={}) {
  return fetch(BACKEND_URL, {
    method: "POST", mode: "cors",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ key: readKey, action, ...extra })
  }).then(r => r.json());
}

async function unlock() {
  const val = passInput.value.trim();
  const url = document.getElementById("urlInput").value.trim();
  if (url) { BACKEND_URL = url; localStorage.setItem("legends-backend-url", url); }
  if (!val) { gateErr.textContent = "Entrez la clé."; return; }
  if (!BACKEND_URL) { gateErr.textContent = "Collez d'abord l'URL du backend (apps-script.js Web App)."; return; }
  try {
    const d = await api("stats", { key: val });
    if (d && typeof d.totalSales !== "undefined") {
      readKey = val;
      gate.style.display = "none";
      app.classList.add("open");
      showTab("overview");
    } else {
      gateErr.textContent = "Clé incorrecte ou accès refusé.";
    }
  } catch { gateErr.textContent = "Erreur de connexion au backend."; }
}
document.getElementById("gateBtn").onclick = unlock;
passInput.addEventListener("keydown", e => { if (e.key === "Enter") unlock(); });
document.getElementById("logoutBtn").onclick = () => { readKey=""; app.classList.remove("open"); gate.style.display="flex"; };

// tabs
document.querySelectorAll(".side button").forEach(b => b.onclick = () => showTab(b.dataset.tab));
function showTab(t){
  document.querySelectorAll(".side button").forEach(b=>b.classList.toggle("active", b.dataset.tab===t));
  document.querySelectorAll(".panel").forEach(p=>p.classList.remove("active"));
  document.getElementById(t).classList.add("active");
  ({overview:renderOverview,orders:renderOrders,products:renderProducts,coupons:renderCoupons,profit:renderProfit,reviews:renderReviews}[t]());
}

const money = n => `${Number(n||0).toLocaleString("en-US")} MAD`;
const pill = s => `<span class="pill ${s}">${s}</span>`;

// ---------- Overview ----------
async function renderOverview(){
  const s = await api("stats");
  const el = document.getElementById("overview");
  el.innerHTML = `
    <div class="cards">
      <div class="card"><b>${money(s.totalSales)}</b><small>Total sales</small></div>
      <div class="card"><b>${money(s.monthlyRevenue)}</b><small>Monthly revenue</small></div>
      <div class="card"><b>${s.todayOrders}</b><small>Orders today</small></div>
      <div class="card"><b>${money(s.profit)}</b><small>Est. profit</small></div>
      <div class="card"><b>${s.pending}</b><small>Pending</small></div>
      <div class="card"><b>${s.shipped}</b><small>Shipped</small></div>
      <div class="card"><b>${s.delivered}</b><small>Delivered</small></div>
      <div class="card"><b>${s.cancelled}</b><small>Cancelled</small></div>
    </div>
    <h3>Best-selling</h3>
    <table><tr><th>Product</th><th>Qty</th></tr>
      ${s.bestSelling.map(b=>`<tr><td>${b.name}</td><td>${b.qty}</td></tr>`).join("") || "<tr><td colspan=2>—</td></tr>"}
    </table>
    <h3 style="margin-top:20px">Low stock (≤5)</h3>
    <table><tr><th>Product</th><th>Stock</th></tr>
      ${s.lowStock.map(p=>`<tr><td>${p.name}</td><td>${p.stock}</td></tr>`).join("") || "<tr><td colspan=2>—</td></tr>"}
    </table>`;
}

// ---------- Orders ----------
async function renderOrders(filter="All"){
  const { orders } = await api("getOrders");
  const el = document.getElementById("orders");
  const statuses = ["Pending","Confirmed","Preparing","Shipped","Delivered","Cancelled"];
  const list = orders.sort((a,b)=>b.id-a.id).filter(o => filter==="All" || o.status===filter);
  const filters = ["All",...statuses].map(s=>`<button class="of-btn ${s===filter?"active":""}" data-f="${s}">${s}</button>`).join("");
  el.innerHTML = `
    <div class="bar"><h2 class="sec-title">NEW ORDERS</h2><button class="btn-ghost" onclick="renderOrders()">↻ Refresh</button></div>
    <div class="order-filters">${filters}</div>
    <div class="order-list">
      ${list.map(o=>{
        const items=(()=>{try{return JSON.parse(o.items||"[]")}catch(e){return[]}})();
        const lines = items.map(i=>{
          let l = i.name;
          if(i.size) l += ` — Size: ${i.size}`;
          if(i.player && i.player!=="No name" && i.player!=="") l += ` — ${i.player}`;
          if(i.qty>1) l += ` ×${i.qty}`;
          return `<div class="oc-item">${l}</div>`;
        }).join("") || "<div class='oc-item'>-</div>";
        return `<div class="order-card">
          <div class="oc-head">
            <div class="oc-id">#${o.id}</div>
            <select class="oc-status" data-st="${o.id}">${statuses.map(s=>`<option ${s===o.status?"selected":""}>${s}</option>`).join("")}</select>
          </div>
          <div class="oc-grid">
            <div><span>Customer</span>${o.name||"-"}</div>
            <div><span>Phone</span>${o.phone||"-"}</div>
            <div><span>City</span>${o.city||"-"}</div>
            <div><span>Address</span>${o.address||"-"}</div>
            <div><span>Payment</span>${o.payment||"-"}</div>
            ${o.coupon?`<div><span>Coupon</span>${o.coupon}</div>`:""}
          </div>
          <div class="oc-items">${lines}</div>
          <div class="oc-foot">
            <div class="oc-total">Total: ${money(o.total)}</div>
            <button class="btn-danger" data-del="${o.id}">Delete</button>
          </div>
        </div>`;
      }).join("") || "<p class='form-note'>No orders yet.</p>"}
    </div>`;
  el.querySelectorAll("[data-st]").forEach(sel=>sel.onchange=async()=>{
    await api("updateOrder",{id:Number(sel.dataset.st),status:sel.value});
    renderOrders(filter);
  });
  el.querySelectorAll("[data-del]").forEach(b=>b.onclick=async()=>{
    if(confirm("Delete this order?")){ await api("deleteOrder",{id:Number(b.dataset.del)}); renderOrders(filter); }
  });
  el.querySelectorAll(".of-btn").forEach(b=>b.onclick=()=>renderOrders(b.dataset.f));
}

// ---------- Products ----------
async function renderProducts(){
  const { products } = await api("getProducts");
  const el = document.getElementById("products");
  el.innerHTML = `
    <div class="bar">
      <button class="btn-dark" id="addProd">+ Add product</button>
      <button class="btn-ghost" onclick="renderProducts()">↻ Refresh</button>
    </div>
    <table>
      <tr><th>ID</th><th>Name</th><th>Price</th><th>Stock</th><th>Cost</th><th></th></tr>
      ${products.map(p=>`<tr>
        <td>${p.id}</td><td>${p.name}</td><td>${money(p.price)}</td>
        <td>${p.stock}</td><td>${money(p.cost)}</td>
        <td><button class="btn-ghost" data-edit="${p.id}">Edit</button>
            <button class="btn-danger" data-pdel="${p.id}">Del</button></td>
      </tr>`).join("") || "<tr><td colspan=6>—</td></tr>"}
    </table>`;
  el.querySelector("#addProd").onclick = () => openProd({});
  el.querySelectorAll("[data-edit]").forEach(b=>b.onclick=async()=>{
    const { products } = await api("getProducts");
    openProd(products.find(p=>String(p.id)===b.dataset.edit));
  });
  el.querySelectorAll("[data-pdel]").forEach(b=>b.onclick=async()=>{
    if(confirm("Supprimer le produit ?")){ await api("deleteProduct",{id:Number(b.dataset.pdel)}); renderProducts(); }
  });
}
function openProd(p){
  p = p || {};
  const f = document.getElementById("prodForm");
  f.reset();
  f.id.value = p.id||"";
  f.name.value = p.name||"";
  f.meta.value = p.meta||"";
  f.category.value = p.category||"";
  f.price.value = p.price||"";
  f.oldPrice.value = p.oldPrice||"";
  f.stock.value = p.stock||"";
  f.rating.value = p.rating||5;
  f.sizes.value = Array.isArray(p.sizes)?p.sizes.join(","):(p.sizes||"");
  f.club.value = p.club||"";
  f.season.value = p.season||"";
  f.image.value = p.image||"";
  f.cost.value = p.cost||"";
  f.deliveryCost.value = p.deliveryCost||"";
  f.adsCost.value = p.adsCost||"";
  f.description.value = p.description||"";
  f.material.value = p.material||"";
  f.featured.checked = !!p.featured;
  f.limited.checked = !!p.limited;
  document.getElementById("prodModal").classList.add("open");
}
document.getElementById("prodClose").onclick = () => document.getElementById("prodModal").classList.remove("open");
document.getElementById("prodForm").onsubmit = async e => {
  e.preventDefault();
  const f = e.target;
  const product = {
    id: f.id.value ? Number(f.id.value) : "",
    name:f.name.value, meta:f.meta.value, category:f.category.value,
    price:Number(f.price.value), oldPrice:f.oldPrice.value?Number(f.oldPrice.value):"",
    rating:Number(f.rating.value)||5, stock:Number(f.stock.value)||0,
    sizes:f.sizes.value.split(",").map(s=>s.trim()).filter(Boolean),
    club:f.club.value, season:f.season.value, image:f.image.value,
    cost:Number(f.cost.value)||0, deliveryCost:Number(f.deliveryCost.value)||0, adsCost:Number(f.adsCost.value)||0,
    description:f.description.value, material:f.material.value,
    featured:f.featured.checked, limited:f.limited.checked
  };
  await api("saveProduct",{product});
  document.getElementById("prodModal").classList.remove("open");
  renderProducts();
};

// ---------- Coupons ----------
async function renderCoupons(){
  const { coupons } = await api("getCoupons");
  const el = document.getElementById("coupons");
  el.innerHTML = `
    <div class="bar"><button class="btn-dark" id="addC">+ Add coupon</button></div>
    <table><tr><th>Code</th><th>Type</th><th>Value</th><th>Active</th><th></th></tr>
    ${coupons.map(c=>`<tr><td>${c.code}</td><td>${c.type}</td><td>${c.value}${c.type==="percent"?"%":" MAD"}</td>
      <td>${c.active?"✓":"✗"}</td><td><button class="btn-danger" data-cdel="${c.id}">Del</button></td></tr>`).join("")||"<tr><td colspan=5>—</td></tr>"}
    </table>`;
  el.querySelector("#addC").onclick = async () => {
    const code = prompt("Code (ex: WELCOME10)?"); if(!code) return;
    const type = prompt("Type: percent ou fixed", "percent"); if(!type) return;
    const value = prompt("Valeur (ex: 10)?"); if(value===null) return;
    await api("saveCoupon",{coupon:{code,type,value:Number(value),active:true}});
    renderCoupons();
  };
  el.querySelectorAll("[data-cdel]").forEach(b=>b.onclick=async()=>{
    await api("deleteCoupon",{id:Number(b.dataset.cdel)}); renderCoupons();
  });
}

// ---------- Profit ----------
async function renderProfit(){
  const s = await api("stats");
  document.getElementById("profit").innerHTML = `
    <div class="cards">
      <div class="card"><b>${money(s.totalSales)}</b><small>Revenue</small></div>
      <div class="card"><b>${money(s.profit)}</b><small>Est. profit</small></div>
      <div class="card"><b>${s.ordersTotal}</b><small>Total orders</small></div>
    </div>
    <p style="color:var(--muted)">Profit = (prix − coût fournisseur − emballage 5 MAD − livraison − pub) × quantité, hors commandes annulées.</p>`;
}

// ---------- Reviews ----------
async function renderReviews(){
  const { reviews } = await api("getReviews");
  document.getElementById("reviews").innerHTML = `
    <table><tr><th>Name</th><th>★</th><th>Comment</th><th>Verified</th></tr>
    ${reviews.map(r=>`<tr><td>${r.name}</td><td>${r.rating}</td><td>${r.comment||""}</td><td>${r.verified?"✓":"✗"}</td></tr>`).join("")||"<tr><td colspan=4>—</td></tr>"}
    </table>`;
}
