const ADMIN_PASS = "admin123";
const BACKEND_URL = "";
const BACKEND_KEY = "";

const gate = document.getElementById("gate");
const app = document.getElementById("app");
const passInput = document.getElementById("passInput");
const gateErr = document.getElementById("gateErr");

function unlock() {
  const val = passInput.value.trim();
  if (val === ADMIN_PASS) {
    gate.style.display = "none";
    app.hidden = false;
    render();
  } else {
    gateErr.textContent = "Code incorrect.";
    passInput.value = "";
  }
}

document.getElementById("gateBtn").addEventListener("click", unlock);
passInput.addEventListener("keydown", e => { if (e.key === "Enter") unlock(); });

function money(n) { return `${Number(n).toLocaleString("en-US")} MAD`; }

function loadLocalOrders() {
  try { return JSON.parse(localStorage.getItem("legends-orders") || "[]"); }
  catch { return []; }
}

async function loadBackendOrders() {
  if (!BACKEND_URL) return [];
  try {
    const r = await fetch(`${BACKEND_URL}?key=${encodeURIComponent(BACKEND_KEY)}`, { mode: "cors" });
    const d = await r.json();
    return Array.isArray(d.orders) ? d.orders : [];
  } catch {
    return [];
  }
}

function mergeOrders(local, backend) {
  const byId = new Map();
  [...backend, ...local].forEach(o => { if (o && o.id) byId.set(o.id, o); });
  return [...byId.values()].sort((a, b) => (b.id || 0) - (a.id || 0));
}

async function render() {
  const ordersEl = document.getElementById("orders");
  ordersEl.innerHTML = `<div class="empty">Chargement…</div>`;

  const [local, backend] = await Promise.all([loadLocalOrders(), loadBackendOrders()]);
  const orders = mergeOrders(local, backend);

  const revenue = orders.reduce((s, o) => s + (o.total || 0), 0);
  document.getElementById("statCount").textContent = orders.length;
  document.getElementById("statRevenue").textContent = money(revenue);

  if (!orders.length) {
    ordersEl.innerHTML = `<div class="empty">Aucune commande pour l'instant.<br>Les commandes passées sur le site apparaîtront ici.</div>`;
    return;
  }

  ordersEl.innerHTML = orders.map(o => {
    const date = o.date ? new Date(o.date).toLocaleString("fr-FR") : "-";
    const items = (o.items || []).map(i => `
      <div class="item">
        <span>${i.mark ? "[" + i.mark + "] " : ""}${i.name} ×${i.qty}</span>
        <span>${money(i.price * i.qty)}</span>
      </div>`).join("");
    return `
      <div class="order">
        <div class="order-top">
          <div>
            <div class="order-id">#${o.id}</div>
            <span class="badge">NOUVEAU</span>
          </div>
          <div class="order-date">${date}</div>
        </div>
        <div class="cust">
          <div><small>Nom</small>${o.customer?.name || "-"}</div>
          <div><small>Téléphone</small>${o.customer?.phone || "-"}</div>
          <div><small>Adresse</small>${o.customer?.address || "-"}</div>
        </div>
        <div class="items">${items}</div>
        <div class="order-foot">
          <div class="total">${money(o.total)}</div>
          <div style="display:flex;gap:8px;align-items:center">
            <span class="pay">${o.customer?.payment || "-"}</span>
            <button class="btn-danger" data-del="${o.id}">Supprimer (local)</button>
          </div>
        </div>
      </div>`;
  }).join("");
}

document.getElementById("orders").addEventListener("click", e => {
  const del = e.target.closest("[data-del]");
  if (!del) return;
  const id = Number(del.dataset.del);
  const orders = loadLocalOrders().filter(o => o.id !== id);
  localStorage.setItem("legends-orders", JSON.stringify(orders));
  render();
});

document.getElementById("refreshBtn").addEventListener("click", render);

document.getElementById("clearBtn").addEventListener("click", () => {
  if (confirm("Supprimer toutes les commandes locales ? (Le backend n'est pas affecté)")) {
    localStorage.removeItem("legends-orders");
    render();
  }
});
