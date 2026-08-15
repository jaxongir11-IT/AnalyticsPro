"use strict";

/* =========================================================
   STORAGE KEYS
========================================================= */
const STORAGE = {
  USERS: "analyticspro_users",
  CURRENT_USER: "analyticspro_current_user",
  THEME: "analyticspro_theme"
};

/* =========================================================
   FACTORY / DATA TEMPLATES
========================================================= */
function createEmptyData() {
  return {
    week: { labels: [], revenue: [], users: [], activity: [] },
    month: { labels: [], revenue: [], users: [], activity: [] },
    year: { labels: [], revenue: [], users: [], activity: [] }
  };
}

/* =========================================================
   STATE
========================================================= */
const state = {
  isRegistering: true,
  currentUser: JSON.parse(localStorage.getItem(STORAGE.CURRENT_USER)) || null,
  theme: localStorage.getItem(STORAGE.THEME) || "light",
  period: "month",
  data: createEmptyData()
};

let lineChart = null;
let doughnutChart = null;

/* =========================================================
   DOM ELEMENTS
========================================================= */
const authOverlay = document.getElementById("authOverlay");
const authForm = document.getElementById("authForm");
const authName = document.getElementById("authName");
const authEmail = document.getElementById("authEmail");
const authPassword = document.getElementById("authPassword");
const passwordToggle = document.getElementById("passwordToggle");
const nameGroup = document.getElementById("nameGroup");
const authDescription = document.getElementById("authDescription");
const authSubmit = document.getElementById("authSubmit");
const authSwitchText = document.getElementById("authSwitchText");
const authSwitchButton = document.getElementById("authSwitchButton");
const authError = document.getElementById("authError");

const userName = document.getElementById("userName");
const userAvatar = document.getElementById("userAvatar");
const logoutButton = document.getElementById("logoutButton");

const themeButton = document.getElementById("themeButton");
const themeIcon = document.getElementById("themeIcon");
const themeText = document.getElementById("themeText");

const pageTitle = document.getElementById("pageTitle");

const totalUsers = document.getElementById("totalUsers");
const totalRevenue = document.getElementById("totalRevenue");
const averageActivity = document.getElementById("averageActivity");

const lineChartTitle = document.getElementById("lineChartTitle");
const dataTable = document.getElementById("dataTable");

const addDataButton = document.getElementById("addDataButton");
const clearDataButton = document.getElementById("clearDataButton");

const modalOverlay = document.getElementById("modalOverlay");
const closeModal = document.getElementById("closeModal");
const cancelModal = document.getElementById("cancelModal");
const dataForm = document.getElementById("dataForm");

const dataLabel = document.getElementById("dataLabel");
const dataRevenue = document.getElementById("dataRevenue");
const dataUsers = document.getElementById("dataUsers");
const dataActivity = document.getElementById("dataActivity");

/* =========================================================
   PASSWORD VISIBILITY TOGGLE
========================================================= */
passwordToggle.addEventListener("click", () => {
  const isPassword = authPassword.type === "password";
  authPassword.type = isPassword ? "text" : "password";
  passwordToggle.textContent = isPassword ? "🙈" : "👁️";
  passwordToggle.title = isPassword ? "Parolni yashirish" : "Parolni ko'rsatish";
  passwordToggle.setAttribute("aria-label", passwordToggle.title);
});

/* =========================================================
   LOCAL STORAGE HELPERS
========================================================= */
function getUsers() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE.USERS)) || [];
  } catch {
    return [];
  }
}

function saveUsers(users) {
  localStorage.setItem(STORAGE.USERS, JSON.stringify(users));
}

function getDataKey() {
  return "analyticspro_data_" + (state.currentUser ? state.currentUser.email : "");
}

function loadUserData() {
  if (!state.currentUser) {
    state.data = createEmptyData();
    return;
  }
  try {
    const saved = localStorage.getItem(getDataKey());
    if (saved) {
      state.data = { ...createEmptyData(), ...JSON.parse(saved) };
    } else {
      state.data = createEmptyData();
      saveUserData();
    }
  } catch {
    state.data = createEmptyData();
  }
}

function saveUserData() {
  if (!state.currentUser) return;
  try {
    localStorage.setItem(getDataKey(), JSON.stringify(state.data));
  } catch (error) {
    console.error("Saqlashda xatolik:", error);
  }
}

/* =========================================================
   AUTHENTICATION LOGIC
========================================================= */
function setAuthMode(registering) {
  state.isRegistering = registering;
  authError.textContent = "";
  authForm.reset();
  authPassword.type = "password";
  passwordToggle.textContent = "👁️";

  if (registering) {
    nameGroup.style.display = "flex";
    authName.required = true;
    authDescription.textContent = "Shaxsiy akkauntingizni yarating";
    authSubmit.textContent = "Ro'yxatdan o'tish";
    authSwitchText.textContent = "Akkauntingiz bormi?";
    authSwitchButton.textContent = "Kirish";
  } else {
    nameGroup.style.display = "none";
    authName.required = false;
    authDescription.textContent = "Akkauntingizga kiring";
    authSubmit.textContent = "Kirish";
    authSwitchText.textContent = "Akkauntingiz yo'qmi?";
    authSwitchButton.textContent = "Ro'yxatdan o'tish";
  }
}

authSwitchButton.addEventListener("click", () => {
  setAuthMode(!state.isRegistering);
});

authForm.addEventListener("submit", (event) => {
  event.preventDefault();
  authError.textContent = "";

  const name = authName.value.trim();
  const email = authEmail.value.trim().toLowerCase();
  const password = authPassword.value;

  if (state.isRegistering) {
    if (name.length < 2) {
      authError.textContent = "Ismingizni to'g'ri kiriting.";
      return;
    }
    if (password.length < 6) {
      authError.textContent = "Parol kamida 6 ta belgidan iborat bo'lishi kerak.";
      return;
    }

    const users = getUsers();
    if (users.find((u) => u.email === email)) {
      authError.textContent = "Bu email bilan akkaunt allaqachon mavjud.";
      return;
    }

    const newUser = { id: Date.now().toString(), name, email, password };
    users.push(newUser);
    saveUsers(users);

    state.currentUser = { id: newUser.id, name: newUser.name, email: newUser.email };
    localStorage.setItem(STORAGE.CURRENT_USER, JSON.stringify(state.currentUser));

    loadUserData();
    showDashboard();
    return;
  }

  /* LOGIN */
  const users = getUsers();
  const user = users.find((u) => u.email === email && u.password === password);

  if (!user) {
    authError.textContent = "Email yoki parol noto'g'ri.";
    return;
  }

  state.currentUser = { id: user.id, name: user.name, email: user.email };
  localStorage.setItem(STORAGE.CURRENT_USER, JSON.stringify(state.currentUser));

  loadUserData();
  showDashboard();
});

function showDashboard() {
  authOverlay.classList.remove("open");
  updateProfile();
  renderDashboard();
}

function showAuth() {
  authOverlay.classList.add("open");
  setAuthMode(true);
}

function updateProfile() {
  if (!state.currentUser) return;
  userName.textContent = state.currentUser.name;
  userAvatar.textContent = state.currentUser.name.charAt(0).toUpperCase();
}

logoutButton.addEventListener("click", () => {
  localStorage.removeItem(STORAGE.CURRENT_USER);
  state.currentUser = null;
  state.data = createEmptyData();
  closeDataModal();
  showAuth();
});

/* =========================================================
   THEME SWITCHING
========================================================= */
function applyTheme(theme) {
  state.theme = theme;
  document.documentElement.setAttribute("data-theme", theme);
  localStorage.setItem(STORAGE.THEME, theme);

  if (theme === "dark") {
    themeIcon.textContent = "☀️";
    themeText.textContent = "Light";
  } else {
    themeIcon.textContent = "🌙";
    themeText.textContent = "Dark";
  }
  updateChartTheme();
}

themeButton.addEventListener("click", () => {
  applyTheme(state.theme === "light" ? "dark" : "light");
});

/* =========================================================
   NAVIGATION & PERIODS
========================================================= */
document.querySelectorAll(".nav-item").forEach((button) => {
  button.addEventListener("click", () => {
    document.querySelectorAll(".nav-item").forEach((item) => item.classList.remove("active"));
    button.classList.add("active");

    const page = button.dataset.page;
    const titles = {
      dashboard: "Dashboard",
      users: "Foydalanuvchilar",
      revenue: "Daromad",
      activity: "Faollik"
    };
    pageTitle.textContent = titles[page] || "Dashboard";
  });
});

document.querySelectorAll(".period-button").forEach((button) => {
  button.addEventListener("click", () => {
    document.querySelectorAll(".period-button").forEach((item) => item.classList.remove("active"));
    button.classList.add("active");

    state.period = button.dataset.period;
    renderDashboard();
  });
});

function getCurrentPeriodData() {
  if (!state.data[state.period]) {
    state.data[state.period] = { labels: [], revenue: [], users: [], activity: [] };
  }
  return state.data[state.period];
}

/* =========================================================
   RENDER DASHBOARD DATA
========================================================= */
function renderDashboard() {
  if (!state.currentUser) return;

  const data = getCurrentPeriodData();

  const users = data.users.reduce((sum, val) => sum + Number(val), 0);
  const revenue = data.revenue.reduce((sum, val) => sum + Number(val), 0);
  const activity = data.activity.length
    ? data.activity.reduce((sum, val) => sum + Number(val), 0) / data.activity.length
    : 0;

  totalUsers.textContent = users.toLocaleString();
  totalRevenue.textContent = "$" + revenue.toLocaleString();
  averageActivity.textContent = activity.toFixed(1) + "%";

  const periodNames = { week: "Haftalik", month: "Oylik", year: "Yillik" };
  lineChartTitle.textContent = `${periodNames[state.period]} dinamika`;

  updateLineChart();
  updateDoughnutChart();
  renderTable();
}

/* =========================================================
   TABLE & DATA MANAGEMENT
========================================================= */
function renderTable() {
  const data = getCurrentPeriodData();
  dataTable.innerHTML = "";

  if (data.labels.length === 0) {
    dataTable.innerHTML = `
      <tr>
        <td colspan="6" class="empty-row">Hozircha ma'lumot kiritilmagan</td>
      </tr>
    `;
    return;
  }

  data.labels.forEach((label, index) => {
    const row = document.createElement("tr");
    row.innerHTML = `
      <td>${index + 1}</td>
      <td><strong>${escapeHTML(label)}</strong></td>
      <td>$${Number(data.revenue[index]).toLocaleString()}</td>
      <td>${Number(data.users[index]).toLocaleString()}</td>
      <td>${Number(data.activity[index]).toFixed(1)}%</td>
      <td>
        <button class="delete-button" data-index="${index}">O'chirish</button>
      </td>
    `;

    row.querySelector(".delete-button").addEventListener("click", () => deleteData(index));
    dataTable.appendChild(row);
  });
}

function escapeHTML(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function deleteData(index) {
  const data = getCurrentPeriodData();
  data.labels.splice(index, 1);
  data.revenue.splice(index, 1);
  data.users.splice(index, 1);
  data.activity.splice(index, 1);

  saveUserData();
  renderDashboard();
}

clearDataButton.addEventListener("click", () => {
  const data = getCurrentPeriodData();
  if (data.labels.length === 0) return;

  if (confirm("Ushbu davrdagi barcha ma'lumotlarni o'chirmoqchimisiz?")) {
    state.data[state.period] = { labels: [], revenue: [], users: [], activity: [] };
    saveUserData();
    renderDashboard();
  }
});

/* =========================================================
   MODALS
========================================================= */
function openDataModal() {
  modalOverlay.classList.add("open");
  setTimeout(() => dataLabel.focus(), 100);
}

function closeDataModal() {
  modalOverlay.classList.remove("open");
  dataForm.reset();
}

addDataButton.addEventListener("click", openDataModal);
closeModal.addEventListener("click", closeDataModal);
cancelModal.addEventListener("click", closeDataModal);

modalOverlay.addEventListener("click", (e) => {
  if (e.target === modalOverlay) closeDataModal();
});

document.addEventListener("keydown", (e) => {
  if (e.key === "Escape" && modalOverlay.classList.contains("open")) {
    closeDataModal();
  }
});

dataForm.addEventListener("submit", (event) => {
  event.preventDefault();

  const label = dataLabel.value.trim();
  const revenue = Number(dataRevenue.value);
  const users = Number(dataUsers.value);
  const activity = Number(dataActivity.value);

  if (!label) return;

  if (revenue < 0 || users < 0 || activity < 0 || activity > 100) {
    alert("Ma'lumotlarni to'g'ri kiriting.");
    return;
  }

  const data = getCurrentPeriodData();
  data.labels.push(label);
  data.revenue.push(revenue);
  data.users.push(users);
  data.activity.push(activity);

  saveUserData();
  renderDashboard();
  closeDataModal();
});

/* =========================================================
   CHARTS (CHART.JS)
========================================================= */
function initCharts() {
  const lineCanvas = document.getElementById("lineChart");
  const doughnutCanvas = document.getElementById("doughnutChart");

  lineChart = new Chart(lineCanvas, {
    type: "line",
    data: {
      labels: [],
      datasets: [
        {
          label: "Daromad ($)",
          data: [],
          borderColor: "#2563eb",
          backgroundColor: "rgba(37, 99, 235, 0.10)",
          fill: true,
          tension: 0.35,
          borderWidth: 2,
          pointRadius: 3
        },
        {
          label: "Foydalanuvchilar",
          data: [],
          borderColor: "#16a34a",
          backgroundColor: "rgba(22, 163, 74, 0.08)",
          fill: true,
          tension: 0.35,
          borderWidth: 2,
          pointRadius: 3
        }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: { legend: { position: "bottom" } },
      scales: {
        x: { grid: { display: false } },
        y: { beginAtZero: true }
      }
    }
  });

  doughnutChart = new Chart(doughnutCanvas, {
    type: "doughnut",
    data: {
      labels: ["Ma'lumot yo'q"],
      datasets: [{ data: [1], backgroundColor: ["#2563eb"], borderWidth: 0 }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      cutout: "68%",
      plugins: { legend: { position: "bottom" } }
    }
  });

  updateChartTheme();
}

function updateLineChart() {
  if (!lineChart) return;
  const data = getCurrentPeriodData();
  lineChart.data.labels = data.labels;
  lineChart.data.datasets[0].data = data.revenue;
  lineChart.data.datasets[1].data = data.users;
  lineChart.update();
}

function updateDoughnutChart() {
  if (!doughnutChart) return;
  const data = getCurrentPeriodData();
  const users = data.users.reduce((sum, val) => sum + Number(val), 0);

  if (users === 0) {
    doughnutChart.data.labels = ["Ma'lumot yo'q"];
    doughnutChart.data.datasets[0].data = [1];
  } else {
    doughnutChart.data.labels = ["Foydalanuvchilar"];
    doughnutChart.data.datasets[0].data = [users];
  }
  doughnutChart.update();
}

function updateChartTheme() {
  if (!lineChart || !doughnutChart) return;

  const dark = state.theme === "dark";
  const textColor = dark ? "#f8fafc" : "#111827";
  const gridColor = dark ? "#334155" : "#e2e8f0";

  lineChart.options.plugins.legend.labels.color = textColor;
  lineChart.options.scales.x.ticks.color = textColor;
  lineChart.options.scales.y.ticks.color = textColor;
  lineChart.options.scales.x.grid.color = gridColor;
  lineChart.options.scales.y.grid.color = gridColor;

  doughnutChart.options.plugins.legend.labels.color = textColor;

  lineChart.update();
  doughnutChart.update();
}

/* =========================================================
   INITIALIZATION
========================================================= */
function init() {
  applyTheme(state.theme);
  initCharts();

  if (state.currentUser) {
    loadUserData();
    showDashboard();
  } else {
    showAuth();
  }
}

init(); 