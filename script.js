const products = [
  {id:1,name:"The GOAT — 10",meta:"Player Edition · Black",price:299,category:"player",visual:"visual-dark",mark:"10"},
  {id:2,name:"The King — 7",meta:"Player Edition · White",price:299,category:"player",visual:"visual-white",mark:"7"},
  {id:3,name:"90s Classic",meta:"Classic Collection · Grey",price:279,category:"classic",visual:"visual-gray",mark:"90"},
  {id:4,name:"Black & White",meta:"LEGENDS Essential",price:249,category:"classic",visual:"visual-stripe",mark:"L"},
  {id:5,name:"Red Era",meta:"Club Collection",price:289,category:"club",visual:"visual-red",mark:"7"},
  {id:6,name:"Midnight Classic",meta:"Classic Collection",price:279,category:"classic",visual:"visual-dark",mark:"01"},
  {id:7,name:"The Captain",meta:"Player Edition · White",price:299,category:"player",visual:"visual-white",mark:"C"},
  {id:8,name:"Heritage Club",meta:"Club Collection · Black",price:289,category:"club",visual:"visual-stripe",mark:"FC"}
];

// Current football-shirt collection.
products.length = 0;
products.push(
  {id:1,name:"Paris Saint-Germain Home 2025/26",meta:"Club Collection",price:199,oldPrice:249,rating:5,stock:7,category:"club",sizes:["S","M","L","XL"],delivery:"2–4 days",bestseller:true,image:"image/psg-black-jersey.jpeg"},
  {id:2,name:"AS Roma Home 2025/26",meta:"Club Collection",price:199,rating:5,category:"club",sizes:["S","M","L","XL"],delivery:"2–4 days",bestseller:true,image:"image/roma-jersey.jpeg"},
  {id:3,name:"Manchester United Home 2025/26",meta:"Club Collection",price:199,rating:5,category:"club",sizes:["S","M","L","XL"],delivery:"2–4 days",bestseller:true,image:"image/man-utd-jersey.jpeg"},
  {id:4,name:"FC Barcelona 1899 Anniversary",meta:"Classic Collection · 1899–1999",price:199,rating:5,stock:5,category:"classic",sizes:["S","M","L","XL"],delivery:"3–5 days",limited:true,image:"image/barcelona-1899-jersey.jpeg"},
  {id:5,name:"FC Barcelona Pink 2025/26",meta:"Club Collection",price:199,rating:5,category:"club",sizes:["S","M","L","XL"],delivery:"2–4 days",bestseller:true,limited:true,image:"image/barcelona-pink-jersey.jpeg"},
  {id:6,name:"Real Madrid Home 2025/26",meta:"Club Collection",price:199,rating:5,category:"club",sizes:["S","M","L","XL"],delivery:"2–4 days",bestseller:true,image:"image/real-madrid-jersey.jpeg"}
);

let cart = JSON.parse(localStorage.getItem("legends-cart") || "[]");

// ===== BACKEND (optionnel) =====
// Pour recevoir les commandes depuis n'importe quel PC client :
// 1) Copiez le contenu de "apps-script.js" dans https://script.google.com, déployez en Web App.
// 2) Collez l'URL déployée dans BACKEND_URL et la clé WRITE_KEY (publique) dans BACKEND_WRITE_KEY.
//    La clé SECRET (lecture) reste côté admin et n'est JAMAIS écrite ici.
const BACKEND_URL = localStorage.getItem("legends-backend-url") || "";
const BACKEND_WRITE_KEY = "legendsWritePub2026";

// ===== LIVRAISON WHATSAPP =====
// Numéro du store au format international SANS "+" ni espaces (ex: 212702938680).
// Au "Confirmer", WhatsApp s'ouvre avec la commande pré-remplie ; le client envoie.
const WHATSAPP_NUMBER = "212702938680"; // 07 02 93 86 80

function buildWhatsAppMessage(o) {
  const lines = [
    "🛒 *NOUVELLE COMMANDE — LEGENDS*",
    "Nom : " + (o.customer.name || "-"),
    "Tél : " + (o.customer.phone || "-"),
    "Adresse : " + (o.customer.address || "-"),
    "Paiement : " + (o.customer.payment || "-"),
    "---------------------------"
  ];
  (o.items || []).forEach(i => lines.push("• " + i.name + " ×" + i.qty + "  (" + i.price + " MAD)"));
  lines.push("👉 Total : " + o.total + " MAD");
  return lines.join("\n");
}

const grid = document.getElementById("productGrid");
const cartCount = document.getElementById("cartCount");
const cartItems = document.getElementById("cartItems");
const cartTotal = document.getElementById("cartTotal");
const checkoutTotal = document.getElementById("checkoutTotal");

function money(n){ return `${n.toLocaleString("en-US")} MAD`; }

function stars(n){ n = n || 5; return "★".repeat(n) + "☆".repeat(5 - n); }

function buildCard(p){
  const sizes = (p.sizes || ["S","M","L","XL"]).map((s,i)=>`<button class="size${i===1?" active":""}" data-size="${s}">${s}</button>`).join("");
  return `
  <article class="product-card" data-id="${p.id}">
    ${p.stock ? `<div class="stock-badge">🔥 Only ${p.stock} pieces left</div>` : ""}
    <div class="product-visual"><img src="${p.image}" alt="${p.name}" loading="lazy"></div>
    <div class="product-body">
      <div class="product-top">
        <h3 class="product-name">${p.name}</h3>
        <div class="stars" title="${p.rating||5}/5">${stars(p.rating)}</div>
      </div>
      <div class="product-price">
        <span class="price-now">${money(p.price)}</span>
        ${p.oldPrice ? `<span class="price-old">${money(p.oldPrice)}</span>` : ""}
      </div>
      <div class="opt">
        <div class="opt-label">Sizes</div>
        <div class="sizes">${sizes}</div>
      </div>
      <div class="meta-lines">
        <span>🚚 Delivery: ${p.delivery||"2–4 days"}</span>
        <span>💳 Payment: Cash on Delivery</span>
      </div>
      <div class="card-actions">
        <button class="add-cart" data-add="${p.id}">Add to cart +</button>
        <button class="buy-now" data-buy="${p.id}">BUY NOW</button>
      </div>
    </div>
  </article>`;
}

function renderGrid(el, list){ if(el) el.innerHTML = list.map(buildCard).join(""); }

function renderProducts(filter="all"){
  renderGrid(grid, products.filter(p => filter==="all" || p.category===filter));
}

function saveCart(){ localStorage.setItem("legends-cart", JSON.stringify(cart)); renderCart(); }

function renderCart(){
  const count = cart.reduce((s,i)=>s+i.qty,0);
  const total = cart.reduce((s,i)=>s+i.price*i.qty,0);
  cartCount.textContent = count;
  cartTotal.textContent = money(total);
  checkoutTotal.textContent = money(total);

  if(!cart.length){
    cartItems.innerHTML = `<div class="empty-cart">Your cart is empty.<br><a href="#collection">Explore the collection →</a></div>`;
    return;
  }
  cartItems.innerHTML = cart.map(i => `
    <div class="cart-row">
      <div class="cart-thumb"><img src="${i.image}" alt=""></div>
      <div><h4>${i.name}</h4><p>${money(i.price)} · ${i.size||""}${i.player && i.player!=="No name" ? " · "+i.player : ""}</p>
        <div class="qty">
          <button data-minus="${i.id}" data-size="${i.size||""}" data-player="${i.player||""}">−</button><span>${i.qty}</span><button data-plus="${i.id}" data-size="${i.size||""}" data-player="${i.player||""}">+</button>
        </div>
      </div>
      <button class="remove" data-remove="${i.id}" data-size="${i.size||""}" data-player="${i.player||""}">Remove</button>
    </div>
  `).join("");
}

document.addEventListener("click", e => {
  const sizeBtn = e.target.closest(".size");
  if(sizeBtn){
    const card = sizeBtn.closest(".product-card");
    card.querySelectorAll(".size").forEach(b=>b.classList.remove("active"));
    sizeBtn.classList.add("active");
    return;
  }
  const add = e.target.closest("[data-add]");
  const buy = e.target.closest("[data-buy]");
  if(add || buy){
    const card = (add || buy).closest(".product-card");
    const id = Number((add || buy).dataset.add || (add || buy).dataset.buy);
    const p = products.find(x=>x.id===id);
    const sizeEl = card.querySelector(".size.active") || card.querySelector(".size");
    const size = sizeEl ? sizeEl.dataset.size : "";
    const player = "";
    const existing = cart.find(x=>x.id===p.id && x.size===size && x.player===player);
    if(existing) existing.qty++; else cart.push({...p, qty:1, size, player});
    saveCart(); openCart();
    if(buy){ modal.classList.add("open"); modal.setAttribute("aria-hidden","false"); }
    return;
  }
  const plus = e.target.closest("[data-plus]");
  const minus = e.target.closest("[data-minus]");
  const remove = e.target.closest("[data-remove]");
  const match = el => cart.find(x=>x.id===Number(el.dataset.plus||el.dataset.minus||el.dataset.remove) && x.size===(el.dataset.size||"") && x.player===(el.dataset.player||""));
  if(plus){ match(plus).qty++; saveCart(); }
  if(minus){
    const item=match(minus);
    item.qty--; if(item.qty<=0) cart=cart.filter(x=>!(x.id===item.id && x.size===item.size && x.player===item.player)); saveCart();
  }
  if(remove){ const item=match(remove); cart=cart.filter(x=>!(x.id===item.id && x.size===item.size && x.player===item.player)); saveCart(); }
});

document.querySelectorAll(".filter").forEach(btn => btn.addEventListener("click",()=>{
  document.querySelectorAll(".filter").forEach(b=>b.classList.remove("active"));
  btn.classList.add("active"); renderProducts(btn.dataset.filter);
}));

const drawer=document.getElementById("cartDrawer"), backdrop=document.getElementById("backdrop");
function openCart(){drawer.classList.add("open");backdrop.classList.add("show");drawer.setAttribute("aria-hidden","false")}
function closeCart(){drawer.classList.remove("open");backdrop.classList.remove("show");drawer.setAttribute("aria-hidden","true")}
document.getElementById("cartBtn").onclick=openCart;
document.getElementById("closeCart").onclick=closeCart;
backdrop.onclick=closeCart;

const modal=document.getElementById("checkoutModal");
document.getElementById("checkoutBtn").onclick=()=>{
  if(!cart.length){alert("Your cart is empty.");return}
  modal.classList.add("open");modal.setAttribute("aria-hidden","false");
};
document.getElementById("closeModal").onclick=()=>modal.classList.remove("open");
modal.addEventListener("click",e=>{if(e.target===modal)modal.classList.remove("open")});

document.getElementById("checkoutForm").addEventListener("submit",async e=>{
  e.preventDefault();
  const fd=new FormData(e.target);
  let total = cart.reduce((s,i)=>s+i.price*i.qty,0);
  const couponCode = (fd.get("coupon")||"").trim();
  let coupon = "";
  if (couponCode && BACKEND_URL) {
    try {
      const r = await fetch(BACKEND_URL, { method:"POST", mode:"cors", headers:{"Content-Type":"application/json"}, body: JSON.stringify({ action:"applyCoupon", code:couponCode }) });
      const d = await r.json();
      if (d.ok) {
        coupon = couponCode;
        total = d.type==="percent" ? Math.round(total*(1-d.value/100)) : Math.max(0, total - d.value);
      }
    } catch {}
  }
  const order={
    id:Date.now(),
    date:new Date().toISOString(),
    customer:{name:fd.get("name"),phone:fd.get("phone"),city:fd.get("city"),address:fd.get("address"),payment:fd.get("payment")},
    items:cart.map(i=>({id:i.id,name:i.name,price:i.price,qty:i.qty,mark:i.mark})),
    total, coupon
  };
  const local = JSON.parse(localStorage.getItem("legends-orders") || "[]");
  local.unshift(order);
  localStorage.setItem("legends-orders", JSON.stringify(local));

  if (BACKEND_URL) {
    fetch(BACKEND_URL, {
      method: "POST",
      mode: "cors",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ key: BACKEND_WRITE_KEY, action:"createOrder", order })
    }).catch(() => {});
  }

  if (WHATSAPP_NUMBER) {
    const url = "https://wa.me/" + WHATSAPP_NUMBER + "?text=" + encodeURIComponent(buildWhatsAppMessage(order));
    window.open(url, "_blank");
  }

  document.getElementById("checkoutNote").textContent = "Order #" + order.id + " ready — send it on WhatsApp to confirm ✅";
  cart=[]; saveCart();
  setTimeout(()=>{modal.classList.remove("open");closeCart();e.target.reset();document.getElementById("checkoutNote").textContent=""},1800);
});

const ORDER_STEPS = ["Pending","Confirmed","Preparing","Shipped","Delivered"];
document.getElementById("trackBtn").addEventListener("click",async ()=>{
  const id = document.getElementById("trackId").value.trim();
  const phone = document.getElementById("trackPhone").value.trim();
  const res = document.getElementById("trackResult");
  if(!id||!phone){ res.innerHTML = "<p class='form-note'>Enter order # and phone.</p>"; return; }
  if(!BACKEND_URL){ res.innerHTML = "<p class='form-note'>Tracking needs the backend configured.</p>"; return; }
  try {
    const r = await fetch(BACKEND_URL, { method:"POST", mode:"cors", headers:{"Content-Type":"application/json"}, body: JSON.stringify({ action:"trackOrder", id:Number(id), phone }) });
    const d = await r.json();
    if(!d.order){ res.innerHTML = "<p class='form-note'>Order not found or phone mismatch.</p>"; return; }
    const step = ORDER_STEPS.indexOf(d.order.status);
    const line = ORDER_STEPS.map((s,i)=>`<span class="tstep ${i<=step?"done":""}">${i<=step?"🟢":"⚪"} ${s}</span>`).join(" → ");
    res.innerHTML = `<p><b>Order #${d.order.id}</b> · ${d.order.total} MAD</p><div class="track-steps">${line}</div>`;
  } catch { res.innerHTML = "<p class='form-note'>Error contacting server.</p>"; }
});

document.getElementById("contactForm").addEventListener("submit",e=>{
  e.preventDefault();
  document.getElementById("contactNote").textContent="Thanks — your message is ready to be sent.";
  e.target.reset();
});

const menu=document.querySelector(".menu-toggle"), nav=document.querySelector(".nav");
menu.addEventListener("click",()=>{const open=nav.classList.toggle("open");menu.setAttribute("aria-expanded",open)});
nav.querySelectorAll("a").forEach(a=>a.addEventListener("click",()=>nav.classList.remove("open")));

renderProducts();
renderGrid(document.getElementById("bestSellers"), products.filter(p=>p.bestseller));
renderGrid(document.getElementById("newDrop"), products.filter(p=>p.limited));
renderCart();
