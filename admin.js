const ADMIN_PASS = "admin123"; // utilisé uniquement en mode local (sans backend)
const BACKEND_URL = "";        // collez l'URL du Web App ici

const gate = document.getElementById("gate");
const app = document.getElementById("app");
const passInput = document.getElementById("passInput");
const gateErr = document.getElementById("gateErr");

let readKey = "";

function money(n) { return `${Number(n).toLocaleString("en-US")} MAD`; }

async function unlock() {
  const val = passInput.value.trim();
  if (!val) { gateErr.textContent = "Entrez la clé."; return; }

  if (!BACKEND_URL) {
    if (val === ADMIN_PASS) { openApp(); render(); }
    else gateErr.textContent = "Code incorrect.";
    return;
  }

  try {
    const r = await fetch(BACKEND_URL, {
      method: "POST",
      mode: "cors",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "read", key: val })
    });
    const d = await r.json();
    if (Array.isArray(d.orders)) {
      readKey = val;
      openApp();
      render();
    } else {
      gateErr.textContent = "Clé incorrecte ou accès refusé.";
    }
  } catch {
    gateErr.textContent = "Erreur de connexion au backend.";
  }
}

function openApp() {
  gate.style.display = "none";
  app.hidden = false;
}

document.getElementById("gateBtn").addEventListener("click", unlock);
passInput.addEventListener("keydown", e => { if (e.key === "Enter") unlock(); });

async function backendRead() {
  if (!BACKEND_URL) return [];
  try {
    const r = await fetch(BACKEND_URL, {
      method: "POST",
      mode: "cors",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "read", key: readKey })
    });
    const d = await r.json();
    return Array.isArray(d.orders) ? d.orders : [];
  } catch {
    return [];
  }
}

function loadLocalOrders() {
  try { return JSON.parse(localStorage.getItem("legends-orders") || "[]"); }
  catch { return []; }
}

async function render() {
  const ordersEl = document.getElementById("orders");
  ordersEl.innerHTML = `<div class="empty">Chargement…</div>`;

  const [local, backend] = await Promise.all([loadLocalOrders(), backendRead()]);
  const byId = new Map();
  [...backend, ...local].forEach(o => { if (o && o.id) byId.set(o.id, o); });
  const orders = [...byId.values()].sort((a, b) => (b.id || 0) - (a.id || 0));

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
            <button class="btn-danger" data-del="${o.id}">Supprimer</button>
          </div>
        </div>
      </div>`;
  }).join("");
}

document.getElementById("orders").addEventListener("click", async e => {
  const del = e.target.closest("[data-del]");
  if (!del) return;
  const id = Number(del.dataset.del);
  if (BACKEND_URL) {
    await fetch(BACKEND_URL, {
      method: "POST",
      mode: "cors",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "delete", key: readKey, id })
    });
  }
  render();
});

document.getElementById("refreshBtn").addEventListener("click", render);

document.getElementById("clearBtn").addEventListener("click", async () => {
  if (!confirm("Supprimer toutes les commandes ?")) return;
  if (BACKEND_URL) {
    await fetch(BACKEND_URL, {
      method: "POST",
      mode: "cors",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "clear", key: readKey })
    });
  }
  render();
});
