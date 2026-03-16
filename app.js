const STORAGE_KEY = "growth_records_v4";
const DEFAULT_CLASSES = [
  { id: "momiji", name: "もみじ" },
  { id: "donguri", name: "どんぐり" },
  { id: "koguma", name: "こぐま" },
  { id: "risu", name: "りす" },
  { id: "nousagi", name: "のうさぎ" },
  { id: "kamoshika", name: "かもしか" }
];
const MONTHS = [4, 5, 6, 7, 8, 9, 10, 11, 12, 1, 2, 3];
const SCALE_GROUPS = {
  infant: { heightMin: 40, heightMax: 100, weightMin: 3, weightMax: 20 },
  middle: { heightMin: 80, heightMax: 120, weightMin: 10, weightMax: 25 },
  senior: { heightMin: 100, heightMax: 150, weightMin: 10, weightMax: 30 }
};
const CLASS_GROUPS = {
  momiji: "infant",
  donguri: "infant",
  koguma: "middle",
  risu: "middle",
  nousagi: "senior",
  kamoshika: "senior"
};
const AVERAGE_GROWTH = [
  { month: 0, boyHeightCm: 50.0, boyWeightKg: 3.3, girlHeightCm: 49.5, girlWeightKg: 3.2 },
  { month: 1, boyHeightCm: 54.0, boyWeightKg: 4.2, girlHeightCm: 53.5, girlWeightKg: 4.0 },
  { month: 2, boyHeightCm: 57.0, boyWeightKg: 5.0, girlHeightCm: 56.5, girlWeightKg: 4.7 },
  { month: 3, boyHeightCm: 59.5, boyWeightKg: 5.7, girlHeightCm: 58.8, girlWeightKg: 5.3 },
  { month: 4, boyHeightCm: 61.5, boyWeightKg: 6.3, girlHeightCm: 60.8, girlWeightKg: 5.8 },
  { month: 5, boyHeightCm: 63.5, boyWeightKg: 6.8, girlHeightCm: 62.5, girlWeightKg: 6.2 },
  { month: 6, boyHeightCm: 65.0, boyWeightKg: 7.3, girlHeightCm: 64.0, girlWeightKg: 6.6 },
  { month: 7, boyHeightCm: 66.5, boyWeightKg: 7.6, girlHeightCm: 65.5, girlWeightKg: 7.0 },
  { month: 8, boyHeightCm: 68.0, boyWeightKg: 7.9, girlHeightCm: 67.0, girlWeightKg: 7.3 },
  { month: 9, boyHeightCm: 69.3, boyWeightKg: 8.2, girlHeightCm: 68.3, girlWeightKg: 7.6 },
  { month: 10, boyHeightCm: 70.5, boyWeightKg: 8.5, girlHeightCm: 69.6, girlWeightKg: 7.9 },
  { month: 11, boyHeightCm: 71.7, boyWeightKg: 8.7, girlHeightCm: 70.8, girlWeightKg: 8.2 },
  { month: 12, boyHeightCm: 73.0, boyWeightKg: 9.0, girlHeightCm: 72.0, girlWeightKg: 8.5 },
  { month: 13, boyHeightCm: 74.0, boyWeightKg: 9.3, girlHeightCm: 73.0, girlWeightKg: 8.8 },
  { month: 14, boyHeightCm: 75.0, boyWeightKg: 9.6, girlHeightCm: 74.0, girlWeightKg: 9.0 },
  { month: 15, boyHeightCm: 76.0, boyWeightKg: 9.9, girlHeightCm: 75.0, girlWeightKg: 9.3 },
  { month: 16, boyHeightCm: 77.0, boyWeightKg: 10.2, girlHeightCm: 76.0, girlWeightKg: 9.6 },
  { month: 17, boyHeightCm: 78.0, boyWeightKg: 10.5, girlHeightCm: 77.0, girlWeightKg: 9.8 },
  { month: 18, boyHeightCm: 79.0, boyWeightKg: 10.8, girlHeightCm: 78.0, girlWeightKg: 10.1 },
  { month: 19, boyHeightCm: 80.0, boyWeightKg: 11.0, girlHeightCm: 79.0, girlWeightKg: 10.4 },
  { month: 20, boyHeightCm: 81.0, boyWeightKg: 11.3, girlHeightCm: 80.0, girlWeightKg: 10.6 },
  { month: 21, boyHeightCm: 82.0, boyWeightKg: 11.6, girlHeightCm: 81.0, girlWeightKg: 10.9 },
  { month: 22, boyHeightCm: 83.0, boyWeightKg: 11.9, girlHeightCm: 82.0, girlWeightKg: 11.1 },
  { month: 23, boyHeightCm: 84.0, boyWeightKg: 12.2, girlHeightCm: 83.0, girlWeightKg: 11.4 },
  { month: 24, boyHeightCm: 85.0, boyWeightKg: 12.5, girlHeightCm: 84.0, girlWeightKg: 11.7 },
  { month: 25, boyHeightCm: 86.0, boyWeightKg: 12.8, girlHeightCm: 85.0, girlWeightKg: 12.0 },
  { month: 26, boyHeightCm: 87.0, boyWeightKg: 13.1, girlHeightCm: 86.0, girlWeightKg: 12.3 },
  { month: 27, boyHeightCm: 88.0, boyWeightKg: 13.4, girlHeightCm: 87.0, girlWeightKg: 12.6 },
  { month: 28, boyHeightCm: 89.0, boyWeightKg: 13.7, girlHeightCm: 88.0, girlWeightKg: 12.9 },
  { month: 29, boyHeightCm: 90.0, boyWeightKg: 14.0, girlHeightCm: 89.0, girlWeightKg: 13.2 },
  { month: 30, boyHeightCm: 91.0, boyWeightKg: 14.3, girlHeightCm: 90.0, girlWeightKg: 13.5 },
  { month: 31, boyHeightCm: 92.0, boyWeightKg: 14.6, girlHeightCm: 91.0, girlWeightKg: 13.8 },
  { month: 32, boyHeightCm: 93.0, boyWeightKg: 14.9, girlHeightCm: 92.0, girlWeightKg: 14.1 },
  { month: 33, boyHeightCm: 94.0, boyWeightKg: 15.2, girlHeightCm: 93.0, girlWeightKg: 14.4 },
  { month: 34, boyHeightCm: 95.0, boyWeightKg: 15.5, girlHeightCm: 94.0, girlWeightKg: 14.7 },
  { month: 35, boyHeightCm: 96.0, boyWeightKg: 15.8, girlHeightCm: 95.0, girlWeightKg: 15.0 },
  { month: 36, boyHeightCm: 97.0, boyWeightKg: 16.1, girlHeightCm: 96.0, girlWeightKg: 15.3 },
  { month: 37, boyHeightCm: 98.0, boyWeightKg: 16.3, girlHeightCm: 97.0, girlWeightKg: 15.5 },
  { month: 38, boyHeightCm: 99.0, boyWeightKg: 16.5, girlHeightCm: 98.0, girlWeightKg: 15.7 },
  { month: 39, boyHeightCm: 100.0, boyWeightKg: 16.7, girlHeightCm: 99.0, girlWeightKg: 15.9 },
  { month: 40, boyHeightCm: 101.0, boyWeightKg: 16.9, girlHeightCm: 100.0, girlWeightKg: 16.1 },
  { month: 41, boyHeightCm: 102.0, boyWeightKg: 17.1, girlHeightCm: 101.0, girlWeightKg: 16.3 },
  { month: 42, boyHeightCm: 103.0, boyWeightKg: 17.3, girlHeightCm: 102.0, girlWeightKg: 16.5 },
  { month: 43, boyHeightCm: 104.0, boyWeightKg: 17.5, girlHeightCm: 103.0, girlWeightKg: 16.7 },
  { month: 44, boyHeightCm: 105.0, boyWeightKg: 17.7, girlHeightCm: 104.0, girlWeightKg: 16.9 },
  { month: 45, boyHeightCm: 106.0, boyWeightKg: 17.9, girlHeightCm: 105.0, girlWeightKg: 17.1 },
  { month: 46, boyHeightCm: 107.0, boyWeightKg: 18.1, girlHeightCm: 106.0, girlWeightKg: 17.3 },
  { month: 47, boyHeightCm: 108.0, boyWeightKg: 18.3, girlHeightCm: 107.0, girlWeightKg: 17.5 },
  { month: 48, boyHeightCm: 109.0, boyWeightKg: 18.5, girlHeightCm: 108.0, girlWeightKg: 17.7 },
  { month: 49, boyHeightCm: 110.0, boyWeightKg: 18.7, girlHeightCm: 109.0, girlWeightKg: 17.9 },
  { month: 50, boyHeightCm: 111.0, boyWeightKg: 18.9, girlHeightCm: 110.0, girlWeightKg: 18.1 },
  { month: 51, boyHeightCm: 112.0, boyWeightKg: 19.1, girlHeightCm: 111.0, girlWeightKg: 18.3 },
  { month: 52, boyHeightCm: 113.0, boyWeightKg: 19.3, girlHeightCm: 112.0, girlWeightKg: 18.5 },
  { month: 53, boyHeightCm: 114.0, boyWeightKg: 19.5, girlHeightCm: 113.0, girlWeightKg: 18.7 },
  { month: 54, boyHeightCm: 115.0, boyWeightKg: 19.7, girlHeightCm: 114.0, girlWeightKg: 18.9 },
  { month: 55, boyHeightCm: 116.0, boyWeightKg: 19.9, girlHeightCm: 115.0, girlWeightKg: 19.1 },
  { month: 56, boyHeightCm: 117.0, boyWeightKg: 20.1, girlHeightCm: 116.0, girlWeightKg: 19.3 },
  { month: 57, boyHeightCm: 118.0, boyWeightKg: 20.3, girlHeightCm: 117.0, girlWeightKg: 19.5 },
  { month: 58, boyHeightCm: 119.0, boyWeightKg: 20.5, girlHeightCm: 118.0, girlWeightKg: 19.7 },
  { month: 59, boyHeightCm: 120.0, boyWeightKg: 20.7, girlHeightCm: 119.0, girlWeightKg: 19.9 },
  { month: 60, boyHeightCm: 121.0, boyWeightKg: 21.0, girlHeightCm: 120.0, girlWeightKg: 20.2 },
  { month: 61, boyHeightCm: 122.0, boyWeightKg: 21.2, girlHeightCm: 121.0, girlWeightKg: 20.4 },
  { month: 62, boyHeightCm: 123.0, boyWeightKg: 21.4, girlHeightCm: 122.0, girlWeightKg: 20.6 },
  { month: 63, boyHeightCm: 124.0, boyWeightKg: 21.6, girlHeightCm: 123.0, girlWeightKg: 20.8 },
  { month: 64, boyHeightCm: 125.0, boyWeightKg: 21.8, girlHeightCm: 124.0, girlWeightKg: 21.0 },
  { month: 65, boyHeightCm: 126.0, boyWeightKg: 22.0, girlHeightCm: 125.0, girlWeightKg: 21.2 },
  { month: 66, boyHeightCm: 127.0, boyWeightKg: 22.2, girlHeightCm: 126.0, girlWeightKg: 21.4 },
  { month: 67, boyHeightCm: 128.0, boyWeightKg: 22.4, girlHeightCm: 127.0, girlWeightKg: 21.6 },
  { month: 68, boyHeightCm: 129.0, boyWeightKg: 22.6, girlHeightCm: 128.0, girlWeightKg: 21.8 },
  { month: 69, boyHeightCm: 130.0, boyWeightKg: 22.8, girlHeightCm: 129.0, girlWeightKg: 22.0 },
  { month: 70, boyHeightCm: 131.0, boyWeightKg: 23.0, girlHeightCm: 130.0, girlWeightKg: 22.2 },
  { month: 71, boyHeightCm: 132.0, boyWeightKg: 23.2, girlHeightCm: 131.0, girlWeightKg: 22.4 },
  { month: 72, boyHeightCm: 133.0, boyWeightKg: 23.5, girlHeightCm: 132.0, girlWeightKg: 22.7 },
  { month: 73, boyHeightCm: 134.0, boyWeightKg: 23.7, girlHeightCm: 133.0, girlWeightKg: 22.9 },
  { month: 74, boyHeightCm: 135.0, boyWeightKg: 23.9, girlHeightCm: 134.0, girlWeightKg: 23.1 },
  { month: 75, boyHeightCm: 136.0, boyWeightKg: 24.1, girlHeightCm: 135.0, girlWeightKg: 23.3 },
  { month: 76, boyHeightCm: 137.0, boyWeightKg: 24.3, girlHeightCm: 136.0, girlWeightKg: 23.5 },
  { month: 77, boyHeightCm: 138.0, boyWeightKg: 24.5, girlHeightCm: 137.0, girlWeightKg: 23.7 },
  { month: 78, boyHeightCm: 139.0, boyWeightKg: 24.7, girlHeightCm: 138.0, girlWeightKg: 23.9 },
  { month: 79, boyHeightCm: 140.0, boyWeightKg: 24.9, girlHeightCm: 139.0, girlWeightKg: 24.1 },
  { month: 80, boyHeightCm: 141.0, boyWeightKg: 25.1, girlHeightCm: 140.0, girlWeightKg: 24.3 },
  { month: 81, boyHeightCm: 142.0, boyWeightKg: 25.3, girlHeightCm: 141.0, girlWeightKg: 24.5 },
  { month: 82, boyHeightCm: 143.0, boyWeightKg: 25.5, girlHeightCm: 142.0, girlWeightKg: 24.7 },
  { month: 83, boyHeightCm: 144.0, boyWeightKg: 25.7, girlHeightCm: 143.0, girlWeightKg: 24.9 }
];
const AVERAGE_GROWTH_MAP = new Map(AVERAGE_GROWTH.map((item) => [item.month, item]));

const el = (id) => document.getElementById(id);

const inputView = el("inputView");
const reportView = el("reportView");
const manageView = el("manageView");

const classSelect = el("classSelect");
const childSelect = el("childSelect");
const dateInput = el("dateInput");
const heightInput = el("heightInput");
const weightInput = el("weightInput");
const modeView = el("modeView");
const statusLine = el("statusLine");
const manageStatus = el("manageStatus");
const headerNote = el("headerNote");

const saveBtn = el("saveBtn");
const clearBtn = el("clearBtn");
const openReportBtn = el("openReportBtn");
const openManageBtn = el("openManageBtn");
const backFromReportBtn = el("backFromReportBtn");
const backFromManageBtn = el("backFromManageBtn");

const backupBtn = el("backupBtn");
const restoreBtn = el("restoreBtn");
const restoreFile = el("restoreFile");
const deleteAllBtn = el("deleteAllBtn");

const reportTitle = el("reportTitle");
const chartNote = el("chartNote");
const tbody = el("dataTbody");
const chartCanvas = el("chart");
const toast = el("toast");

let CLASSES = [];
let CHILDREN = [];
let RECORDS = {};
let editContext = null;

function loadStorage() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === "object" ? parsed : {};
  } catch {
    return {};
  }
}

function saveStorage() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(RECORDS));
}

function monthKey(month) {
  return String(month);
}

function todayISO() {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, "0");
  const d = String(now.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function parseNumber(value) {
  const num = Number(value);
  return Number.isFinite(num) ? Math.round(num * 10) / 10 : null;
}

function normalizeText(value) {
  if (value == null) return "";
  return String(value).replace(/\r?\n/g, " ").trim();
}

function normalizeDateString(value) {
  if (value == null) return "";
  const text = String(value).trim();
  if (!text) return "";

  const match = text.match(/^(\d{4})[\/\-](\d{1,2})[\/\-](\d{1,2})$/);
  if (match) {
    const y = match[1];
    const m = match[2].padStart(2, "0");
    const d = match[3].padStart(2, "0");
    return `${y}/${m}/${d}`;
  }

  const dt = new Date(text);
  if (!Number.isNaN(dt.getTime())) {
    const y = dt.getFullYear();
    const m = String(dt.getMonth() + 1).padStart(2, "0");
    const d = String(dt.getDate()).padStart(2, "0");
    return `${y}/${m}/${d}`;
  }

  return "";
}

function slashToInputDate(value) {
  const normalized = normalizeDateString(value);
  return normalized ? normalized.replace(/\//g, "-") : "";
}

function inputDateToSlash(value) {
  return normalizeDateString(value);
}

function getMonthFromDate(dateStr) {
  const normalized = normalizeDateString(dateStr);
  if (!normalized) return null;
  const match = normalized.match(/^(\d{4})\/(\d{2})\/(\d{2})$/);
  return match ? Number(match[2]) : null;
}

function getFiscalYearFromDate(dateStr) {
  const normalized = normalizeDateString(dateStr);
  if (!normalized) {
    const now = new Date();
    return now.getMonth() + 1 >= 4 ? now.getFullYear() : now.getFullYear() - 1;
  }
  const match = normalized.match(/^(\d{4})\/(\d{2})\/(\d{2})$/);
  if (!match) {
    const now = new Date();
    return now.getMonth() + 1 >= 4 ? now.getFullYear() : now.getFullYear() - 1;
  }
  const y = Number(match[1]);
  const m = Number(match[2]);
  return m >= 4 ? y : y - 1;
}

function dateSortValue(dateStr) {
  const normalized = normalizeDateString(dateStr);
  return normalized ? normalized.replace(/\//g, "-") : "";
}

function getActiveFiscalYear() {
  const dates = Object.values(RECORDS)
    .flatMap((months) => Object.values(months || {}))
    .map((rec) => rec && rec.date)
    .filter(Boolean);

  if (!dates.length) return getFiscalYearFromDate("");

  const counts = {};
  for (const date of dates) {
    const fy = getFiscalYearFromDate(date);
    counts[fy] = (counts[fy] || 0) + 1;
  }

  return Number(
    Object.entries(counts).sort((a, b) => {
      if (b[1] !== a[1]) return b[1] - a[1];
      return Number(a[0]) - Number(b[0]);
    })[0][0]
  );
}

function showToast(message) {
  toast.textContent = message;
  toast.classList.add("show");
  clearTimeout(showToast._timer);
  showToast._timer = setTimeout(() => toast.classList.remove("show"), 1800);
}

function setStatus(message, target = statusLine) {
  target.textContent = message || "";
}

function normalizeClassName(classId) {
  const found = CLASSES.find((item) => item.id === classId);
  return found ? found.name : classId;
}

function normalizeChildId(rawChild) {
  if (rawChild.id) return String(rawChild.id);
  const classId = String(rawChild.classId || rawChild.class || rawChild.group || "");
  const name = normalizeText(rawChild.name || rawChild.childName || "");
  return `${classId}:${name}`;
}

function normalizeGender(value) {
  const text = normalizeText(value).toLowerCase();
  if (text === "m" || text === "male" || text === "boy" || text === "男") return "m";
  if (text === "f" || text === "female" || text === "girl" || text === "女") return "f";
  return "";
}

function normalizeChildrenPayload(payload) {
  if (Array.isArray(payload)) {
    const children = payload.map((item, index) => ({
      id: normalizeChildId(item),
      classId: String(item.classId || item.class || item.group || ""),
      name: normalizeText(item.name || item.childName || item.fullName || ""),
      no: Number(item.no) || index + 1,
      gender: normalizeGender(item.gender || item.sex),
      birthDate: normalizeDateString(item.birthDate || item.birthday || item.birth)
    }));
    return { classes: DEFAULT_CLASSES.slice(), children };
  }

  if (payload && typeof payload === "object") {
    const classes = Array.isArray(payload.classes)
      ? payload.classes.map((item) => ({
          id: String(item.id),
          name: normalizeText(item.name || item.label || item.id)
        }))
      : DEFAULT_CLASSES.slice();

    const source = Array.isArray(payload.children) ? payload.children : [];
    const children = source.map((item, index) => ({
      id: normalizeChildId(item),
      classId: String(item.classId || item.class || item.group || ""),
      name: normalizeText(item.name || item.childName || item.fullName || ""),
      no: Number(item.no) || index + 1,
      gender: normalizeGender(item.gender || item.sex),
      birthDate: normalizeDateString(item.birthDate || item.birthday || item.birth)
    }));

    return { classes, children };
  }

  return { classes: DEFAULT_CLASSES.slice(), children: [] };
}

async function loadChildrenMaster() {
  const response = await fetch("./child.json", { cache: "no-store" });
  if (!response.ok) throw new Error("child.json を読み込めませんでした。");
  const payload = await response.json();
  const normalized = normalizeChildrenPayload(payload);
  CLASSES = normalized.classes.length ? normalized.classes : DEFAULT_CLASSES.slice();
  CHILDREN = normalized.children;
}

function sortChildren(list) {
  return [...list].sort((a, b) => {
    const classOrder = CLASSES.findIndex((c) => c.id === a.classId) - CLASSES.findIndex((c) => c.id === b.classId);
    if (classOrder !== 0) return classOrder;
    if ((a.no || 0) !== (b.no || 0)) return (a.no || 0) - (b.no || 0);
    return a.name.localeCompare(b.name, "ja");
  });
}

function initSelectors() {
  classSelect.innerHTML = "";
  for (const item of CLASSES) {
    const option = document.createElement("option");
    option.value = item.id;
    option.textContent = item.name;
    classSelect.appendChild(option);
  }

  if (CLASSES.length) {
    classSelect.value = CLASSES[0].id;
  }
  refreshChildOptions();
}

function refreshChildOptions() {
  const classId = classSelect.value;
  const list = sortChildren(CHILDREN.filter((item) => item.classId === classId));
  const currentValue = childSelect.value;
  childSelect.innerHTML = "";

  for (const child of list) {
    const option = document.createElement("option");
    option.value = child.id;
    option.textContent = child.no ? `${child.no}. ${child.name}` : child.name;
    childSelect.appendChild(option);
  }

  if (list.some((item) => item.id === currentValue)) {
    childSelect.value = currentValue;
  } else if (list[0]) {
    childSelect.value = list[0].id;
  } else {
    childSelect.value = "";
  }

  if (!editContext) {
    dateInput.value = todayISO();
  }
}

function showView(name) {
  inputView.classList.toggle("active", name === "input");
  reportView.classList.toggle("active", name === "report");
  manageView.classList.toggle("active", name === "manage");
}

function getSelectedChild() {
  return CHILDREN.find((item) => item.id === childSelect.value) || null;
}

function getChildClassId(childId) {
  const child = CHILDREN.find((item) => item.id === childId);
  return child ? child.classId : "";
}

function ensureChildRecord(childId) {
  if (!RECORDS[childId] || typeof RECORDS[childId] !== "object") {
    RECORDS[childId] = {};
  }
  return RECORDS[childId];
}

function validateInput() {
  const child = getSelectedChild();
  const inputDate = dateInput.value;
  const date = inputDateToSlash(inputDate);
  const height = parseNumber(heightInput.value);
  const weight = parseNumber(weightInput.value);

  if (!child) {
    setStatus("園児を選択してください。");
    return null;
  }
  if (!date) {
    setStatus("日付を入力してください。");
    return null;
  }
  if (height === null || height <= 0) {
    setStatus("身長を正しく入力してください。");
    return null;
  }
  if (weight === null || weight <= 0) {
    setStatus("体重を正しく入力してください。");
    return null;
  }
  if (height < 30 || height > 160) {
    setStatus("身長は30〜160cmで入力してください。");
    return null;
  }
  if (weight < 1 || weight > 40) {
    setStatus("体重は1〜40kgで入力してください。");
    return null;
  }

  return { child, date, height, weight };
}

function resetForm() {
  editContext = null;
  modeView.textContent = "新規登録";
  dateInput.value = todayISO();
  heightInput.value = "";
  weightInput.value = "";
  setStatus("");
}

function saveCurrentRecord() {
  const data = validateInput();
  if (!data) return;

  const month = getMonthFromDate(data.date);
  if (!month) {
    setStatus("日付を正しく入力してください。");
    return;
  }

  const target = ensureChildRecord(data.child.id);
  target[monthKey(month)] = {
    childId: data.child.id,
    childName: normalizeText(data.child.name),
    classId: data.child.classId,
    date: data.date,
    height: data.height,
    weight: data.weight
  };

  saveStorage();
  modeView.textContent = "新規登録";
  editContext = null;
  setStatus(`${month}月のデータを保存しました。`);
  showToast("保存しました");
}

function getChildMonthRecords(childId) {
  const bucket = RECORDS[childId] || {};
  return Object.entries(bucket)
    .map(([month, rec]) => ({
      month: Number(month),
      ...rec,
      date: normalizeDateString(rec?.date)
    }))
    .filter((item) => item && item.date)
    .sort((a, b) => dateSortValue(b.date).localeCompare(dateSortValue(a.date)));
}

function openReport() {
  const child = getSelectedChild();
  if (!child) {
    setStatus("園児を選択してください。");
    return;
  }
  renderReport(child.id);
  showView("report");
}

function renderReport(childId) {
  const child = CHILDREN.find((item) => item.id === childId);
  const rows = getChildMonthRecords(childId);
  const className = normalizeClassName(child ? child.classId : getChildClassId(childId));

  reportTitle.textContent = child ? `${className}組　${child.name}` : childId;
  chartNote.textContent = child?.gender && child?.birthDate
    ? "実線＝実測値、破線＝月齢平均です。平均は性別と誕生日から計算しています。"
    : "最新のデータが上に表示されます。";

  renderChart(child, rows);
  renderTable(rows);
}

function renderTable(rows) {
  tbody.innerHTML = "";

  if (!rows.length) {
    const tr = document.createElement("tr");
    tr.innerHTML = `<td colspan="5" class="empty-cell">データがありません。</td>`;
    tbody.appendChild(tr);
    return;
  }

  for (const row of rows) {
    const tr = document.createElement("tr");

    const editButton = document.createElement("button");
    editButton.type = "button";
    editButton.className = "mini-btn";
    editButton.textContent = "編集";
    editButton.addEventListener("click", () => {
      loadRecordToForm(row);
    });

    const deleteButton = document.createElement("button");
    deleteButton.type = "button";
    deleteButton.className = "mini-btn danger";
    deleteButton.textContent = "削除";
    deleteButton.addEventListener("click", () => {
      deleteMonthRecord(row.childId, row.month);
    });

    const actionCell = document.createElement("td");
    actionCell.className = "action-cell";
    actionCell.append(editButton, deleteButton);

    tr.innerHTML = `
      <td>${row.month}月</td>
      <td>${row.date}</td>
      <td>${Number(row.height).toFixed(1)}</td>
      <td>${Number(row.weight).toFixed(1)}</td>
    `;
    tr.appendChild(actionCell);
    tbody.appendChild(tr);
  }
}

function loadRecordToForm(row) {
  showView("input");
  classSelect.value = row.classId || getChildClassId(row.childId);
  refreshChildOptions();
  childSelect.value = row.childId;
  dateInput.value = slashToInputDate(row.date);
  heightInput.value = row.height;
  weightInput.value = row.weight;
  editContext = { childId: row.childId, month: row.month };
  modeView.textContent = `${row.month}月データを編集中`;
  setStatus(`${row.month}月データを編集中です。`);
}

function deleteMonthRecord(childId, month) {
  const childRows = RECORDS[childId];
  if (!childRows || !childRows[monthKey(month)]) return;

  const yes = window.confirm(`${month}月のデータを削除します。よろしいですか？`);
  if (!yes) return;

  delete childRows[monthKey(month)];
  if (!Object.keys(childRows).length) {
    delete RECORDS[childId];
  }
  saveStorage();

  if (editContext && editContext.childId === childId && editContext.month === month) {
    resetForm();
  }

  if (reportView.classList.contains("active")) {
    renderReport(childId);
  }

  setStatus(`${month}月のデータを削除しました。`);
  showToast("削除しました");
}

function getScaleForClass(classId) {
  const group = CLASS_GROUPS[classId] || "middle";
  return SCALE_GROUPS[group];
}

function getMonthLabel(month) {
  return `${month}月`;
}

function parseSlashDateToDate(value) {
  const normalized = normalizeDateString(value);
  if (!normalized) return null;
  const match = normalized.match(/^(\d{4})\/(\d{2})\/(\d{2})$/);
  if (!match) return null;
  return new Date(Number(match[1]), Number(match[2]) - 1, Number(match[3]));
}

function getMonthAgeAtDate(birthDate, targetDate) {
  const birth = parseSlashDateToDate(birthDate);
  const target = parseSlashDateToDate(targetDate);
  if (!birth || !target) return null;
  if (target < birth) return null;

  let months = (target.getFullYear() - birth.getFullYear()) * 12 + (target.getMonth() - birth.getMonth());
  if (target.getDate() < birth.getDate()) {
    months -= 1;
  }
  return months >= 0 ? months : null;
}

function getAverageForMonthAge(gender, monthAge) {
  const row = AVERAGE_GROWTH_MAP.get(monthAge);
  if (!row) return null;
  if (gender === "m") {
    return { height: row.boyHeightCm, weight: row.boyWeightKg };
  }
  if (gender === "f") {
    return { height: row.girlHeightCm, weight: row.girlWeightKg };
  }
  return null;
}

function buildAveragePoints(child, rows, xOf, yOf, scale) {
  if (!child?.gender || !child?.birthDate) {
    return { height: [], weight: [] };
  }

  const ordered = [...rows].sort((a, b) => MONTHS.indexOf(a.month) - MONTHS.indexOf(b.month));
  const heightPoints = [];
  const weightPoints = [];

  for (const row of ordered) {
    const monthAge = getMonthAgeAtDate(child.birthDate, row.date);
    if (monthAge === null) continue;
    const avg = getAverageForMonthAge(child.gender, monthAge);
    if (!avg) continue;

    const x = xOf(row.month);
    heightPoints.push({ x, y: yOf(avg.height, scale.heightMin, scale.heightMax) });
    weightPoints.push({ x, y: yOf(avg.weight, scale.weightMin, scale.weightMax) });
  }

  return { height: heightPoints, weight: weightPoints };
}

function renderChart(child, rows) {
  const ctx = chartCanvas.getContext("2d");
  const cssWidth = chartCanvas.clientWidth || 900;
  const cssHeight = 520;
  const dpr = window.devicePixelRatio || 1;

  chartCanvas.width = cssWidth * dpr;
  chartCanvas.height = cssHeight * dpr;
  chartCanvas.style.height = `${cssHeight}px`;
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

  const width = cssWidth;
  const height = cssHeight;

  ctx.clearRect(0, 0, width, height);

  const margin = { top: 28, right: 90, bottom: 56, left: 70 };
  const plotW = width - margin.left - margin.right;
  const plotH = height - margin.top - margin.bottom;

  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, width, height);

  ctx.strokeStyle = "#d9e2ec";
  ctx.lineWidth = 1;
  ctx.strokeRect(margin.left, margin.top, plotW, plotH);

  if (!child || !rows.length) {
    ctx.fillStyle = "#445";
    ctx.font = "18px sans-serif";
    ctx.textAlign = "center";
    ctx.fillText("データがありません", width / 2, height / 2);
    return;
  }

  const scale = getScaleForClass(child.classId);
  const ordered = [...rows].sort((a, b) => MONTHS.indexOf(a.month) - MONTHS.indexOf(b.month));
  const xStep = MONTHS.length > 1 ? plotW / (MONTHS.length - 1) : plotW;
  const monthIndexMap = new Map(MONTHS.map((m, i) => [m, i]));

  function xOf(month) {
    return margin.left + xStep * monthIndexMap.get(month);
  }

  function yOf(value, min, max) {
    return margin.top + plotH - ((value - min) / (max - min)) * plotH;
  }

  for (let i = 0; i <= 6; i += 1) {
    const y = margin.top + (plotH / 6) * i;
    ctx.strokeStyle = "#eef3f7";
    ctx.beginPath();
    ctx.moveTo(margin.left, y);
    ctx.lineTo(margin.left + plotW, y);
    ctx.stroke();

    const hValue = scale.heightMax - ((scale.heightMax - scale.heightMin) / 6) * i;
    const wValue = scale.weightMax - ((scale.weightMax - scale.weightMin) / 6) * i;

    ctx.fillStyle = "#2f4b5f";
    ctx.font = "12px sans-serif";
    ctx.textAlign = "right";
    ctx.fillText(String(Math.round(hValue)), margin.left - 8, y + 4);

    ctx.textAlign = "left";
    ctx.fillText(String(Math.round(wValue)), margin.left + plotW + 8, y + 4);
  }

  MONTHS.forEach((month, i) => {
    const x = margin.left + xStep * i;
    ctx.strokeStyle = "#eef3f7";
    ctx.beginPath();
    ctx.moveTo(x, margin.top);
    ctx.lineTo(x, margin.top + plotH);
    ctx.stroke();

    ctx.fillStyle = "#2f4b5f";
    ctx.font = "12px sans-serif";
    ctx.textAlign = "center";
    ctx.fillText(getMonthLabel(month), x, margin.top + plotH + 24);
  });

  ctx.fillStyle = "#2f4b5f";
  ctx.font = "12px sans-serif";
  ctx.textAlign = "left";
  ctx.fillText("身長(cm)", margin.left, 18);
  ctx.textAlign = "right";
  ctx.fillText("体重(kg)", width - 16, 18);

  const heightPoints = ordered.map((row) => ({
    x: xOf(row.month),
    y: yOf(row.height, scale.heightMin, scale.heightMax)
  }));

  const weightPoints = ordered.map((row) => ({
    x: xOf(row.month),
    y: yOf(row.weight, scale.weightMin, scale.weightMax)
  }));

  const averagePoints = buildAveragePoints(child, ordered, xOf, yOf, scale);

  drawLine(ctx, averagePoints.height, "#8bc34a", false, true);
  drawLine(ctx, averagePoints.weight, "#64b5f6", false, true);
  drawLine(ctx, heightPoints, "#2e7d32", true, false);
  drawLine(ctx, weightPoints, "#1565c0", true, false);

  drawLegend(ctx, width - 190, margin.top + 10, averagePoints.height.length > 0 || averagePoints.weight.length > 0);
}

function drawLine(ctx, points, color, drawDots, dashed) {
  if (!points.length) return;

  ctx.save();
  ctx.strokeStyle = color;
  ctx.lineWidth = 3;
  ctx.setLineDash(dashed ? [8, 6] : []);
  ctx.beginPath();
  ctx.moveTo(points[0].x, points[0].y);
  for (let i = 1; i < points.length; i += 1) {
    ctx.lineTo(points[i].x, points[i].y);
  }
  ctx.stroke();
  ctx.restore();

  if (!drawDots) return;

  for (const point of points) {
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.arc(point.x, point.y, 4.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = "#ffffff";
    ctx.lineWidth = 2;
    ctx.stroke();
  }
}

function drawLegend(ctx, x, y, hasAverage) {
  const boxHeight = hasAverage ? 90 : 54;
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(x, y, 170, boxHeight);
  ctx.strokeStyle = "#d9e2ec";
  ctx.strokeRect(x, y, 170, boxHeight);

  drawLegendItem(ctx, x, y + 18, "#2e7d32", "身長", false);
  drawLegendItem(ctx, x, y + 38, "#1565c0", "体重", false);

  if (hasAverage) {
    drawLegendItem(ctx, x, y + 58, "#8bc34a", "平均身長", true);
    drawLegendItem(ctx, x, y + 78, "#64b5f6", "平均体重", true);
  }
}

function drawLegendItem(ctx, x, y, color, label, dashed) {
  ctx.save();
  ctx.strokeStyle = color;
  ctx.lineWidth = 3;
  ctx.setLineDash(dashed ? [8, 6] : []);
  ctx.beginPath();
  ctx.moveTo(x + 12, y);
  ctx.lineTo(x + 42, y);
  ctx.stroke();
  ctx.restore();

  if (!dashed) {
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.arc(x + 27, y, 4.5, 0, Math.PI * 2);
    ctx.fill();
  }

  ctx.fillStyle = "#2f4b5f";
  ctx.font = "12px sans-serif";
  ctx.textAlign = "left";
  ctx.fillText(label, x + 52, y + 4);
}

function toCsvCell(value) {
  const text = normalizeText(value);
  if (/[",\n]/.test(text)) {
    return `"${text.replace(/"/g, '""')}"`;
  }
  return text;
}

function toCsvRow(values) {
  return values.map(toCsvCell).join(",");
}

function buildClassCsv(classId) {
  const childrenInClass = sortChildren(CHILDREN.filter((child) => child.classId === classId));
  const recordIds = Object.keys(RECORDS).filter((childId) => {
    const bucket = RECORDS[childId] || {};
    const sample = Object.values(bucket)[0];
    return sample && sample.classId === classId;
  });

  const allChildMap = new Map();
  childrenInClass.forEach((child) => {
    allChildMap.set(child.id, {
      id: child.id,
      name: normalizeText(child.name),
      classId: child.classId,
      no: child.no
    });
  });

  recordIds.forEach((childId) => {
    if (!allChildMap.has(childId)) {
      const bucket = RECORDS[childId] || {};
      const sample = Object.values(bucket)[0];
      allChildMap.set(childId, {
        id: childId,
        name: normalizeText(sample?.childName || childId),
        classId: sample?.classId || classId,
        no: 9999
      });
    }
  });

  const allChildren = sortChildren([...allChildMap.values()]);
  const hasAnyData = allChildren.some((child) => {
    const bucket = RECORDS[child.id] || {};
    return Object.keys(bucket).length > 0;
  });

  if (!hasAnyData) return null;

  const header = ["childId", "childName"];
  MONTHS.forEach((month) => {
    header.push(`${month}d`, `${month}h`, `${month}w`);
  });

  const lines = [toCsvRow(header)];

  allChildren.forEach((child) => {
    const bucket = RECORDS[child.id] || {};
    const row = [child.id, child.name];
    MONTHS.forEach((month) => {
      const rec = bucket[monthKey(month)];
      row.push(normalizeDateString(rec?.date || ""), rec?.height ?? "", rec?.weight ?? "");
    });
    lines.push(toCsvRow(row));
  });

  return "\uFEFF" + lines.join("\r\n");
}

async function backupZip() {
  const zip = new JSZip();
  const fiscalYear = getActiveFiscalYear();
  let added = 0;

  for (const cls of CLASSES) {
    const csv = buildClassCsv(cls.id);
    if (!csv) continue;
    zip.file(`growth_${cls.id}_${fiscalYear}.csv`, csv);
    added += 1;
  }

  if (!added) {
    setStatus("バックアップ対象のデータがありません。", manageStatus);
    showToast("データがありません");
    return;
  }

  const blob = await zip.generateAsync({ type: "blob" });
  downloadBlob(blob, `growth_backup_${fiscalYear}.zip`);
  setStatus(`${added}件のクラスCSVをZipにしました。`, manageStatus);
  showToast("バックアップしました");
}

function downloadBlob(blob, fileName) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = fileName;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 500);
}

function parseCsv(text) {
  const normalized = String(text || "").replace(/^\uFEFF/, "");
  const rows = [];
  let row = [];
  let cell = "";
  let i = 0;
  let inQuotes = false;

  while (i < normalized.length) {
    const ch = normalized[i];

    if (inQuotes) {
      if (ch === '"') {
        if (normalized[i + 1] === '"') {
          cell += '"';
          i += 2;
          continue;
        }
        inQuotes = false;
        i += 1;
        continue;
      }
      cell += ch;
      i += 1;
      continue;
    }

    if (ch === '"') {
      inQuotes = true;
      i += 1;
      continue;
    }

    if (ch === ",") {
      row.push(cell);
      cell = "";
      i += 1;
      continue;
    }

    if (ch === "\n") {
      row.push(cell);
      rows.push(row);
      row = [];
      cell = "";
      i += 1;
      continue;
    }

    if (ch === "\r") {
      i += 1;
      continue;
    }

    cell += ch;
    i += 1;
  }

  row.push(cell);
  if (row.length > 1 || row[0] !== "") {
    rows.push(row);
  }

  return rows;
}

function normalizeRestoredRecord(childId, childName, classId, date, height, weight) {
  const normalizedDate = normalizeDateString(date);
  const month = getMonthFromDate(normalizedDate);
  if (!month) return null;
  const h = parseNumber(height);
  const w = parseNumber(weight);
  if (!normalizedDate || h === null || w === null) return null;

  return {
    month,
    record: {
      childId,
      childName: normalizeText(childName),
      classId,
      date: normalizedDate,
      height: h,
      weight: w
    }
  };
}

async function restoreZip(file) {
  const yes = window.confirm("現在のデータを置き換えて復元します。よろしいですか？");
  if (!yes) return;

  const zip = await JSZip.loadAsync(file);
  const nextRecords = {};
  const names = Object.keys(zip.files).filter((name) => /^growth_[a-z]+_\d{4}\.csv$/i.test(name));

  for (const fileName of names) {
    const matched = fileName.match(/^growth_([a-z]+)_(\d{4})\.csv$/i);
    if (!matched) continue;

    const classId = matched[1];
    const fileObj = zip.files[fileName];
    const text = await fileObj.async("string");
    const rows = parseCsv(text);
    if (!rows.length) continue;

    for (let r = 1; r < rows.length; r += 1) {
      const row = rows[r];
      if (!row || !row.length) continue;

      const childId = String(row[0] || "").trim();
      const childName = normalizeText(String(row[1] || "").trim());
      if (!childId) continue;

      if (!nextRecords[childId]) nextRecords[childId] = {};

      for (let i = 0; i < MONTHS.length; i += 1) {
        const base = 2 + i * 3;
        const date = String(row[base] || "").trim();
        const height = String(row[base + 1] || "").trim();
        const weight = String(row[base + 2] || "").trim();

        const normalizedRecord = normalizeRestoredRecord(childId, childName, classId, date, height, weight);
        if (!normalizedRecord) continue;

        nextRecords[childId][monthKey(normalizedRecord.month)] = normalizedRecord.record;
      }
    }
  }

  RECORDS = nextRecords;
  saveStorage();
  resetForm();
  setStatus("データを復元しました。", manageStatus);
  setStatus("");
  showToast("復元しました");

  if (reportView.classList.contains("active")) {
    const child = getSelectedChild();
    if (child) renderReport(child.id);
  }
}

function deleteAllData() {
  const yes = window.confirm("全データを削除します。元に戻せません。よろしいですか？");
  if (!yes) return;

  RECORDS = {};
  saveStorage();
  resetForm();
  tbody.innerHTML = "";
  const ctx = chartCanvas.getContext("2d");
  ctx.clearRect(0, 0, chartCanvas.width, chartCanvas.height);
  setStatus("全データを削除しました。", manageStatus);
  showToast("全データを削除しました");
}

function bindEvents() {
  classSelect.addEventListener("change", () => {
    refreshChildOptions();
    setStatus("");
  });

  saveBtn.addEventListener("click", saveCurrentRecord);
  clearBtn.addEventListener("click", resetForm);
  openReportBtn.addEventListener("click", openReport);
  openManageBtn.addEventListener("click", () => {
    showView("manage");
    setStatus("");
  });
  backFromReportBtn.addEventListener("click", () => {
    showView("input");
  });
  backFromManageBtn.addEventListener("click", () => {
    showView("input");
  });

  backupBtn.addEventListener("click", async () => {
    try {
      await backupZip();
    } catch {
      setStatus("バックアップに失敗しました。", manageStatus);
      showToast("バックアップ失敗");
    }
  });

  restoreBtn.addEventListener("click", () => {
    restoreFile.value = "";
    restoreFile.click();
  });

  restoreFile.addEventListener("change", async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    try {
      await restoreZip(file);
    } catch {
      setStatus("復元に失敗しました。Zipファイルを確認してください。", manageStatus);
      showToast("復元失敗");
    }
  });

  deleteAllBtn.addEventListener("click", deleteAllData);

  childSelect.addEventListener("change", () => {
    if (reportView.classList.contains("active")) {
      const child = getSelectedChild();
      if (child) renderReport(child.id);
    }
  });

  window.addEventListener("resize", () => {
    if (reportView.classList.contains("active")) {
      const child = getSelectedChild();
      if (child) renderReport(child.id);
    }
  });
}

async function registerServiceWorker() {
  if (!("serviceWorker" in navigator)) return;
  try {
    await navigator.serviceWorker.register("./sw.js");
  } catch {
  }
}

async function init() {
  try {
    await loadChildrenMaster();
    RECORDS = loadStorage();

    Object.keys(RECORDS).forEach((childId) => {
      const bucket = RECORDS[childId] || {};
      Object.keys(bucket).forEach((month) => {
        if (bucket[month]) {
          bucket[month].date = normalizeDateString(bucket[month].date);
          bucket[month].childName = normalizeText(bucket[month].childName);
        }
      });
    });
    saveStorage();

    initSelectors();
    bindEvents();
    resetForm();
    headerNote.textContent = "入力すると同じ月の古いデータは自動で置き換わります。";
    await registerServiceWorker();
  } catch {
    setStatus("初期化に失敗しました。child.json を確認してください。");
  }
}

init();
