const state = {
  type: "all",
  query: "",
  favorites: JSON.parse(localStorage.getItem("astroscope-favorites") || "[]"),
  theme: localStorage.getItem("astroscope-theme") || "dark",
  selectedId: null
};

const $ = (selector) => document.querySelector(selector);
const $$ = (selector) => [...document.querySelectorAll(selector)];

const objectGrid = $("#objectGrid");
const favoritesGrid = $("#favoritesGrid");
const emptyState = $("#emptyState");
const noFavorites = $("#noFavorites");
const searchInput = $("#searchInput");
const objectCount = $("#objectCount");
const favoriteCount = $("#favoriteCount");

function saveState() {
  localStorage.setItem("astroscope-favorites", JSON.stringify(state.favorites));
  localStorage.setItem("astroscope-theme", state.theme);
}

function setTheme() {
  document.documentElement.dataset.theme = state.theme;
  $("#themeToggle").textContent = state.theme === "dark" ? "☀" : "☾";
}

function filteredObjects() {
  return celestialObjects.filter((object) => {
    const matchesType = state.type === "all" || object.type === state.type;
    const text = `${object.name} ${object.type} ${object.description}`.toLowerCase();
    const matchesQuery = text.includes(state.query.toLowerCase().trim());
    return matchesType && matchesQuery;
  });
}

function isFavorite(id) {
  return state.favorites.includes(id);
}

function objectCard(object, compact = false) {
  const favorite = isFavorite(object.id);
  return `
    <article class="object-card ${compact ? "compact" : ""}" data-id="${object.id}">
      <button class="favorite-button ${favorite ? "is-favorite" : ""}" data-favorite="${object.id}"
        aria-label="${favorite ? "Remove from favorites" : "Add to favorites"}">
        ${favorite ? "♥" : "♡"}
      </button>
      <button class="card-main" data-open="${object.id}">
        <div class="object-visual ${object.color}">
          <span>${object.icon}</span>
          <div class="visual-ring"></div>
        </div>
        <div class="card-info">
          <span class="object-type">${object.type}</span>
          <h3>${object.name}</h3>
          <p>${object.description}</p>
        </div>
        <span class="card-arrow">↗</span>
      </button>
    </article>
  `;
}

function renderObjects() {
  const objects = filteredObjects();
  objectGrid.innerHTML = objects.map((object) => objectCard(object)).join("");
  emptyState.classList.toggle("hidden", objects.length !== 0);
  objectCount.textContent = celestialObjects.length;
  favoriteCount.textContent = state.favorites.length;
}

function renderFavorites() {
  const favorites = celestialObjects.filter((object) => isFavorite(object.id));
  favoritesGrid.innerHTML = favorites.map((object) => objectCard(object, true)).join("");
  noFavorites.classList.toggle("hidden", favorites.length !== 0);
}

function render() {
  renderObjects();
  renderFavorites();
}

function openModal(id) {
  const object = celestialObjects.find((item) => item.id === id);
  if (!object) return;

  state.selectedId = id;
  $("#modalType").textContent = object.type;
  $("#modalTitle").textContent = object.name;
  $("#modalDescription").textContent = object.description;
  $("#modalVisual").className = `modal-visual ${object.color}`;
  $("#modalVisual").innerHTML = `<span>${object.icon}</span><div class="visual-ring"></div>`;

  $("#modalFacts").innerHTML = object.facts
    .map(([label, value]) => `<div class="fact"><span>${label}</span><strong>${value}</strong></div>`)
    .join("");

  updateModalFavorite();
  $("#modal").classList.remove("hidden");
  document.body.classList.add("modal-open");
}

function closeModal() {
  $("#modal").classList.add("hidden");
  document.body.classList.remove("modal-open");
  state.selectedId = null;
}

function updateModalFavorite() {
  const button = $("#modalFavorite");
  const favorite = isFavorite(state.selectedId);
  button.textContent = favorite ? "♥ Remove from favorites" : "♡ Add to favorites";
  button.classList.toggle("is-favorite", favorite);
}

function toggleFavorite(id) {
  if (isFavorite(id)) {
    state.favorites = state.favorites.filter((favoriteId) => favoriteId !== id);
  } else {
    state.favorites.push(id);
  }
  saveState();
  render();
  if (state.selectedId === id) updateModalFavorite();
}

searchInput.addEventListener("input", (event) => {
  state.query = event.target.value;
  renderObjects();
});

$("#filters").addEventListener("click", (event) => {
  const button = event.target.closest(".filter");
  if (!button) return;

  $$(".filter").forEach((item) => item.classList.remove("active"));
  button.classList.add("active");
  state.type = button.dataset.type;
  renderObjects();
});

document.addEventListener("click", (event) => {
  const favoriteButton = event.target.closest("[data-favorite]");
  if (favoriteButton) {
    event.stopPropagation();
    toggleFavorite(favoriteButton.dataset.favorite);
    return;
  }

  const openButton = event.target.closest("[data-open]");
  if (openButton) {
    openModal(openButton.dataset.open);
  }
});

$("#modalClose").addEventListener("click", closeModal);
$("#modalBackdrop").addEventListener("click", closeModal);

$("#modalFavorite").addEventListener("click", () => {
  if (state.selectedId) toggleFavorite(state.selectedId);
});

document.addEventListener("keydown", (event) => {
  if (event.key === "Escape") closeModal();
});

$("#themeToggle").addEventListener("click", () => {
  state.theme = state.theme === "dark" ? "light" : "dark";
  saveState();
  setTheme();
});

setTheme();
render();
