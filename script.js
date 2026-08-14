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
  {id:1,name:"Paris Saint-Germain Black Kit",meta:"Club Collection · 2025/26",price:199,category:"club",mark:"PSG",image:"image/psg-black-jersey.jpeg"},
  {id:2,name:"AS Roma Home Kit",meta:"Club Collection · 2025/26",price:199,category:"club",mark:"ROMA",image:"image/roma-jersey.jpeg"},
  {id:3,name:"Manchester United Home Kit",meta:"Club Collection · 2025/26",price:199,category:"club",mark:"MUFC",image:"image/man-utd-jersey.jpeg"},
  {id:4,name:"FC Barcelona 1899 Anniversary Kit",meta:"Classic Collection · 1899–1999",price:199,category:"classic",mark:"FCB",image:"image/barcelona-1899-jersey.jpeg"},
  {id:5,name:"FC Barcelona Pink Kit",meta:"Club Collection · 2025/26",price:199,category:"club",mark:"FCB",image:"image/barcelona-pink-jersey.jpeg"},
  {id:6,name:"Real Madrid Home Kit",meta:"Club Collection · 2025/26",price:199,category:"club",mark:"RMA",image:"image/real-madrid-jersey.jpeg"}
);

let cart = JSON.parse(localStorage.getItem("legends-cart") || "[]");

// ===== BACKEND (optionnel) =====
// Pour recevoir les commandes depuis n'importe quel PC client :
// 1) Copiez le contenu de "apps-script.js" dans https://script.google.com, déployez en Web App.
// 2) Collez l'URL déployée dans BACKEND_URL et la même clé dans BACKEND_KEY.
const BACKEND_URL = "";
const BACKEND_KEY = "";

const grid = document.getElementById("productGrid");
const cartCount = document.getElementById("cartCount");
const cartItems = document.getElementById("cartItems");
const cartTotal = document.getElementById("cartTotal");
const checkoutTotal = document.getElementById("checkoutTotal");

function money(n){ return `${n.toLocaleString("en-US")} MAD`; }

function renderProducts(filter="all"){
  grid.innerHTML = products.filter(p => filter==="all" || p.category===filter).map(p => `
    <article class="product-card">
      <div class="product-visual"><img src="${p.image}" alt="${p.name}"></div>
      <div class="product-info">
        <div><div class="product-name">${p.name}</div><div class="product-meta">${p.meta}</div></div>
        <div class="product-price">${money(p.price)}</div>
      </div>
      <button class="add-cart" data-add="${p.id}">Add to cart +</button>
    </article>
  `).join("");
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
      <div><h4>${i.name}</h4><p>${money(i.price)}</p>
        <div class="qty">
          <button data-minus="${i.id}">−</button><span>${i.qty}</span><button data-plus="${i.id}">+</button>
        </div>
      </div>
      <button class="remove" data-remove="${i.id}">Remove</button>
    </div>
  `).join("");
}

document.addEventListener("click", e => {
  const add = e.target.closest("[data-add]");
  if(add){
    const p = products.find(x=>x.id===Number(add.dataset.add));
    const existing = cart.find(x=>x.id===p.id);
    existing ? existing.qty++ : cart.push({...p,qty:1});
    saveCart(); openCart();
  }
  const plus = e.target.closest("[data-plus]");
  const minus = e.target.closest("[data-minus]");
  const remove = e.target.closest("[data-remove]");
  if(plus){ cart.find(x=>x.id===Number(plus.dataset.plus)).qty++; saveCart(); }
  if(minus){
    const item=cart.find(x=>x.id===Number(minus.dataset.minus));
    item.qty--; if(item.qty<=0) cart=cart.filter(x=>x.id!==item.id); saveCart();
  }
  if(remove){ cart=cart.filter(x=>x.id!==Number(remove.dataset.remove)); saveCart(); }
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

document.getElementById("checkoutForm").addEventListener("submit",e=>{
  e.preventDefault();
  const fd=new FormData(e.target);
  const order={
    id:Date.now(),
    date:new Date().toISOString(),
    customer:{name:fd.get("name"),phone:fd.get("phone"),address:fd.get("address"),payment:fd.get("payment")},
    items:cart.map(i=>({name:i.name,price:i.price,qty:i.qty,mark:i.mark})),
    total:cart.reduce((s,i)=>s+i.price*i.qty,0)
  };
  const orders=JSON.parse(localStorage.getItem("legends-orders")||"[]");
  orders.unshift(order);
  localStorage.setItem("legends-orders",JSON.stringify(orders));

  if (BACKEND_URL) {
    fetch(BACKEND_URL, {
      method: "POST",
      mode: "cors",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ key: BACKEND_KEY, order })
    }).catch(() => {});
  }

  document.getElementById("checkoutNote").textContent="Order received! We will contact you to confirm delivery and payment.";
  cart=[]; saveCart();
  setTimeout(()=>{modal.classList.remove("open");closeCart();e.target.reset();document.getElementById("checkoutNote").textContent=""},1800);
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
renderCart();
