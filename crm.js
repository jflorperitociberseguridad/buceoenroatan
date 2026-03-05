const STORAGE_KEY = "crmClientData";

const defaultClients = [
  {
    id: crypto.randomUUID(),
    nombre: "María López",
    email: "maria@correo.com",
    telefono: "+504 9876-5432",
    interes: "Curso Open Water",
    etapa: "Nuevo",
    fechaContacto: "2026-03-01",
    notas: "Solicita precio para 2 personas."
  },
  {
    id: crypto.randomUUID(),
    nombre: "Carlos Rivera",
    email: "carlos@correo.com",
    telefono: "+504 9999-1111",
    interes: "Tour de snorkel",
    etapa: "Seguimiento",
    fechaContacto: "2026-03-03",
    notas: "Prefiere horario de mañana."
  }
];

let clients = loadClients();

const form = document.getElementById("crmForm");
const tableBody = document.getElementById("crmTableBody");
const searchInput = document.getElementById("searchInput");
const stageFilter = document.getElementById("stageFilter");
const kpiTotal = document.getElementById("kpiTotal");
const kpiNew = document.getElementById("kpiNew");
const kpiFollowUp = document.getElementById("kpiFollowUp");
const kpiClosed = document.getElementById("kpiClosed");

form.addEventListener("submit", (event) => {
  event.preventDefault();
  const formData = new FormData(form);

  const newClient = {
    id: crypto.randomUUID(),
    nombre: formData.get("nombre").trim(),
    email: formData.get("email").trim(),
    telefono: formData.get("telefono").trim(),
    interes: formData.get("interes").trim(),
    etapa: formData.get("etapa"),
    fechaContacto: formData.get("fechaContacto"),
    notas: formData.get("notas").trim()
  };

  clients.unshift(newClient);
  persistClients();
  form.reset();
  renderClients();
});

searchInput.addEventListener("input", renderClients);
stageFilter.addEventListener("change", renderClients);

tableBody.addEventListener("click", (event) => {
  const button = event.target.closest("button[data-action]");
  if (!button) return;

  const { action, id } = button.dataset;
  const client = clients.find((item) => item.id === id);
  if (!client) return;

  if (action === "delete") {
    clients = clients.filter((item) => item.id !== id);
  }

  if (action === "advance") {
    client.etapa = nextStage(client.etapa);
  }

  persistClients();
  renderClients();
});

function loadClients() {
  try {
    const rawData = localStorage.getItem(STORAGE_KEY);
    if (!rawData) return defaultClients;
    const parsed = JSON.parse(rawData);
    return Array.isArray(parsed) ? parsed : defaultClients;
  } catch {
    return defaultClients;
  }
}

function persistClients() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(clients));
}

function renderClients() {
  const searchTerm = searchInput.value.toLowerCase();
  const selectedStage = stageFilter.value;

  const filtered = clients.filter((client) => {
    const matchesSearch = [client.nombre, client.email, client.telefono, client.interes]
      .join(" ")
      .toLowerCase()
      .includes(searchTerm);

    const matchesStage = selectedStage === "Todos" || client.etapa === selectedStage;

    return matchesSearch && matchesStage;
  });

  tableBody.innerHTML = "";

  if (filtered.length === 0) {
    tableBody.innerHTML = `<tr><td colspan="8" class="empty">No hay clientes con esos filtros.</td></tr>`;
  }

  filtered.forEach((client) => {
    const row = document.createElement("tr");
    row.innerHTML = `
      <td>${client.nombre}</td>
      <td>${client.email}</td>
      <td>${client.telefono}</td>
      <td>${client.interes}</td>
      <td><span class="badge ${stageClass(client.etapa)}">${client.etapa}</span></td>
      <td>${formatDate(client.fechaContacto)}</td>
      <td>${client.notas || "-"}</td>
      <td class="actions-cell">
        <button type="button" data-action="advance" data-id="${client.id}" class="btn-small">Avanzar</button>
        <button type="button" data-action="delete" data-id="${client.id}" class="btn-small danger">Eliminar</button>
      </td>
    `;
    tableBody.appendChild(row);
  });

  updateKpis();
}

function updateKpis() {
  kpiTotal.textContent = clients.length;
  kpiNew.textContent = clients.filter((c) => c.etapa === "Nuevo").length;
  kpiFollowUp.textContent = clients.filter((c) => c.etapa === "Seguimiento").length;
  kpiClosed.textContent = clients.filter((c) => c.etapa === "Cerrado").length;
}

function nextStage(currentStage) {
  if (currentStage === "Nuevo") return "Seguimiento";
  if (currentStage === "Seguimiento") return "Cerrado";
  return "Cerrado";
}

function stageClass(stage) {
  if (stage === "Nuevo") return "badge-new";
  if (stage === "Seguimiento") return "badge-follow";
  return "badge-closed";
}

function formatDate(value) {
  if (!value) return "-";
  const date = new Date(value + "T00:00:00");
  return Number.isNaN(date.getTime()) ? value : date.toLocaleDateString("es-HN");
}

renderClients();
