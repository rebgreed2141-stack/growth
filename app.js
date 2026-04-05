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

let AVERAGE_GROWTH = [];
let AVERAGE_GROWTH_MAP = new Map();

const el = (id) => document.getElementById(id);

const inputView = el("inputView");
const reportView = el("reportView");
const manageView = el("manageView");
const versionView = el("versionView");

const classSelect = el("classSelect");
const childSelect = el("childSelect");
const dateInput = el("dateInput");
const heightInput = el("heightInput");
const weightInput = el("weightInput");
const modeView = el("modeView");
const statusLine = el("statusLine");
const manageStatus = el("manageStatus");
const versionStatus = el("versionStatus");
const headerNote = el("headerNote");

const saveBtn = el("saveBtn");
const clearBtn = el("clearBtn");
const openReportBtn = el("openReportBtn");
const openManageBtn = el("openManageBtn");
const openVersionBtn = el("openVersionBtn");
const backFromReportBtn = el("backFromReportBtn");
const backFromManageBtn = el("backFromManageBtn");
const backFromVersionBtn = el("backFromVersionBtn");

const backupBtn = el("backupBtn");
const restoreBtn = el("restoreBtn");
const restoreFile = el("restoreFile");
const deleteAllBtn = el("deleteAllBtn");
const currentVersionValue = el("currentVersionValue");
const latestVersionValue = el("latestVersionValue");
const applyUpdateBtn = el("applyUpdateBtn");

const reportTitle = el("reportTitle");
const chartNote = el("chartNote");
const tbody = el("dataTbody");
const chartCanvas = el("chart");
const toast = el("toast");

let CLASSES = [];
let CHILDREN = [];
let RECORDS = {};
let editContext = null;
let swRegistration = null;
let waitingWorker = null;
let currentAppVersion = "";
let latestAppVersion = "";

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

function normalizeAverageGrowthPayload(payload) {
  if (!Array.isArray(payload)) return [];

  return payload
    .map((item) => {
      const month = Number(item.month);
      const boyHeightCm = Number(item.boy_height_cm);
      const boyWeightKg = Number(item.boy_weight_kg);
      const girlHeightCm = Number(item.girl_height_cm);
      const girlWeightKg = Number(item.girl_weight_kg);

      if (
        !Number.isFinite(month) ||
        !Number.isFinite(boyHeightCm) ||
        !Number.isFinite(boyWeightKg) ||
        !Number.isFinite(girlHeightCm) ||
        !Number.isFinite(girlWeightKg)
      ) {
        return null;
      }

      return {
        month,
        boyHeightCm,
        boyWeightKg,
        girlHeightCm,
        girlWeightKg
      };
    })
    .filter(Boolean)
    .sort((a, b) => a.month - b.month);
}

async function loadAverageGrowthMaster() {
  const response = await fetch("./average_growth.json", { cache: "no-store" });
  if (!response.ok) throw new Error("average_growth.json を読み込めませんでした。");
  const payload = await response.json();
  const normalized = normalizeAverageGrowthPayload(payload);
  AVERAGE_GROWTH = normalized;
  AVERAGE_GROWTH_MAP = new Map(AVERAGE_GROWTH.map((item) => [item.month, item]));
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
  versionView.classList.toggle("active", name === "version");
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
  const child = CHILDREN.find((item) => item.id === row.childId);
  if (!child) return;

  classSelect.value = child.classId;
  refreshChildOptions();
  childSelect.value = child.id;
  dateInput.value = slashToInputDate(row.date);
  heightInput.value = Number(row.height).toFixed(1);
  weightInput.value = Number(row.weight).toFixed(1);
  editContext = { childId: row.childId, month: row.month };
  modeView.textContent = `${row.month}月データを編集中`;
  setStatus(`${child.name}の${row.month}月データを読み込みました。`);
  showView("input");
}

function deleteMonthRecord(childId, month) {
  const yes = window.confirm(`${month}月のデータを削除します。よろしいですか？`);
  if (!yes) return;

  const bucket = RECORDS[childId];
  if (bucket && monthKey(month) in bucket) {
    delete bucket[monthKey(month)];
    if (!Object.keys(bucket).length) {
      delete RECORDS[childId];
    }
    saveStorage();
  }

  const selectedChild = getSelectedChild();
  if (selectedChild && selectedChild.id === childId) {
    renderReport(childId);
  }
  resetForm();
  showToast("削除しました");
}

function getScaleByClassId(classId) {
  const group = CLASS_GROUPS[classId] || "middle";
  return SCALE_GROUPS[group];
}

function monthAgeFromBirthDate(birthDate, measureDate) {
  const b = normalizeDateString(birthDate);
  const d = normalizeDateString(measureDate);
  if (!b || !d) return null;

  const [by, bm, bd] = b.split("/").map(Number);
  const [dy, dm, dd] = d.split("/").map(Number);

  let months = (dy - by) * 12 + (dm - bm);
  if (dd < bd) months -= 1;
  return months >= 0 ? months : null;
}

function getAverageByMonthAge(child, measureDate) {
  if (!child?.birthDate || !child?.gender) return null;

  const monthAge = monthAgeFromBirthDate(child.birthDate, measureDate);
  if (monthAge === null) return null;

  const avg = AVERAGE_GROWTH_MAP.get(monthAge);
  if (!avg) return null;

  if (child.gender === "m") {
    return {
      monthAge,
      height: avg.boyHeightCm,
      weight: avg.boyWeightKg
    };
  }

  if (child.gender === "f") {
    return {
      monthAge,
      height: avg.girlHeightCm,
      weight: avg.girlWeightKg
    };
  }

  return null;
}

function buildChartPoints(child, rows) {
  const actual = rows
    .slice()
    .sort((a, b) => dateSortValue(a.date).localeCompare(dateSortValue(b.date)))
    .map((row) => ({
      label: `${row.month}月`,
      month: row.month,
      date: row.date,
      height: Number(row.height),
      weight: Number(row.weight),
      average: getAverageByMonthAge(child, row.date)
    }));

  const labels = actual.map((item) => item.label);
  const heightData = actual.map((item) => item.height);
  const weightData = actual.map((item) => item.weight);
  const avgHeightData = actual.map((item) => item.average ? item.average.height : null);
  const avgWeightData = actual.map((item) => item.average ? item.average.weight : null);

  return { labels, actual, heightData, weightData, avgHeightData, avgWeightData };
}

function drawChartGrid(ctx, chartArea, labels, heightScale, weightScale) {
  const { left, right, top, bottom } = chartArea;
  const width = right - left;
  const height = bottom - top;

  ctx.save();
  ctx.strokeStyle = "#dbe4ec";
  ctx.fillStyle = "#5c7287";
  ctx.lineWidth = 1;
  ctx.font = '12px -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif';

  const hStep = 5;
  for (let value = heightScale.min; value <= heightScale.max; value += hStep) {
    const y = top + height - ((value - heightScale.min) / (heightScale.max - heightScale.min)) * height;
    ctx.beginPath();
    ctx.moveTo(left, y);
    ctx.lineTo(right, y);
    ctx.stroke();
    ctx.fillText(`${value}cm`, left - 46, y + 4);
  }

  const wStep = 1;
  for (let value = weightScale.min; value <= weightScale.max; value += wStep) {
    const y = top + height - ((value - weightScale.min) / (weightScale.max - weightScale.min)) * height;
    ctx.fillText(`${value}kg`, right + 8, y + 4);
  }

  const stepX = labels.length > 1 ? width / (labels.length - 1) : 0;
  labels.forEach((label, index) => {
    const x = labels.length > 1 ? left + stepX * index : left + width / 2;
    ctx.beginPath();
    ctx.moveTo(x, top);
    ctx.lineTo(x, bottom);
    ctx.stroke();
    ctx.fillText(label, x - 14, bottom + 20);
  });

  ctx.strokeStyle = "#8aa0b6";
  ctx.lineWidth = 1.2;
  ctx.beginPath();
  ctx.moveTo(left, top);
  ctx.lineTo(left, bottom);
  ctx.lineTo(right, bottom);
  ctx.stroke();

  ctx.restore();
}

function drawLine(ctx, chartArea, values, scale, color, dashed = false) {
  const { left, right, top, bottom } = chartArea;
  const width = right - left;
  const height = bottom - top;
  const validPoints = values
    .map((value, index) => ({ value, index }))
    .filter((item) => typeof item.value === "number" && Number.isFinite(item.value));

  if (!validPoints.length) return;

  ctx.save();
  ctx.strokeStyle = color;
  ctx.fillStyle = color;
  ctx.lineWidth = 3;
  ctx.setLineDash(dashed ? [8, 6] : []);

  ctx.beginPath();
  validPoints.forEach((point, idx) => {
    const x = values.length > 1 ? left + (width / (values.length - 1)) * point.index : left + width / 2;
    const y = top + height - ((point.value - scale.min) / (scale.max - scale.min)) * height;
    if (idx === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  });
  ctx.stroke();

  ctx.setLineDash([]);
  validPoints.forEach((point) => {
    const x = values.length > 1 ? left + (width / (values.length - 1)) * point.index : left + width / 2;
    const y = top + height - ((point.value - scale.min) / (scale.max - scale.min)) * height;
    ctx.beginPath();
    ctx.arc(x, y, dashed ? 4 : 5, 0, Math.PI * 2);
    ctx.fill();
  });

  ctx.restore();
}

function drawLegend(ctx, items, startX, startY) {
  ctx.save();
  ctx.font = '12px -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif';
  ctx.fillStyle = "#314a5f";
  ctx.textBaseline = "middle";

  let x = startX;
  for (const item of items) {
    ctx.strokeStyle = item.color;
    ctx.lineWidth = 3;
    ctx.setLineDash(item.dashed ? [8, 6] : []);
    ctx.beginPath();
    ctx.moveTo(x, startY);
    ctx.lineTo(x + 24, startY);
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.fillStyle = "#314a5f";
    ctx.fillText(item.label, x + 30, startY);
    x += ctx.measureText(item.label).width + 70;
  }

  ctx.restore();
}

function renderChart(child, rows) {
  const scale = getScaleByClassId(child?.classId || classSelect.value);
  const chartData = buildChartPoints(child, rows);

  const width = Math.max(920, chartData.labels.length * 110 + 180);
  const height = 520;
  chartCanvas.width = width;
  chartCanvas.height = height;

  const ctx = chartCanvas.getContext("2d");
  ctx.clearRect(0, 0, width, height);

  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, width, height);

  if (!chartData.labels.length) {
    ctx.fillStyle = "#60758a";
    ctx.font = '16px -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif';
    ctx.fillText("表示するデータがありません。", 32, 60);
    return;
  }

  const chartArea = {
    left: 70,
    right: width - 70,
    top: 70,
    bottom: height - 70
  };

  drawChartGrid(
    ctx,
    chartArea,
    chartData.labels,
    { min: scale.heightMin, max: scale.heightMax },
    { min: scale.weightMin, max: scale.weightMax }
  );

  drawLine(ctx, chartArea, chartData.avgHeightData, { min: scale.heightMin, max: scale.heightMax }, "#7fb3ff", true);
  drawLine(ctx, chartArea, chartData.avgWeightData, { min: scale.weightMin, max: scale.weightMax }, "#f5b24e", true);
  drawLine(ctx, chartArea, chartData.heightData, { min: scale.heightMin, max: scale.heightMax }, "#2563eb", false);
  drawLine(ctx, chartArea, chartData.weightData, { min: scale.weightMin, max: scale.weightMax }, "#f97316", false);

  ctx.fillStyle = "#17324d";
  ctx.font = 'bold 18px -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif';
  ctx.fillText("身長・体重の推移", 24, 34);

  drawLegend(ctx, [
    { label: "身長", color: "#2563eb", dashed: false },
    { label: "体重", color: "#f97316", dashed: false },
    { label: "平均身長", color: "#7fb3ff", dashed: true },
    { label: "平均体重", color: "#f5b24e", dashed: true }
  ], 24, 52);
}

function escapeCsvCell(value) {
  const text = value == null ? "" : String(value);
  if (/[",\r\n]/.test(text)) {
    return `"${text.replace(/"/g, '""')}"`;
  }
  return text;
}

function makeCsvRowsForClass(classId, fiscalYear) {
  const classChildren = sortChildren(CHILDREN.filter((item) => item.classId === classId));
  const header = [
    "childId",
    "childName",
    ...MONTHS.flatMap((month) => [`${month}月_日付`, `${month}月_身長`, `${month}月_体重`])
  ];

  const rows = [header];

  for (const child of classChildren) {
    const bucket = RECORDS[child.id] || {};
    const row = [child.id, child.name];

    for (const month of MONTHS) {
      const rec = bucket[monthKey(month)];
      if (rec && getFiscalYearFromDate(rec.date) === fiscalYear) {
        row.push(rec.date, Number(rec.height).toFixed(1), Number(rec.weight).toFixed(1));
      } else {
        row.push("", "", "");
      }
    }

    rows.push(row);
  }

  return rows;
}

function rowsToCsvText(rows) {
  return `\uFEFF${rows.map((row) => row.map(escapeCsvCell).join(",")).join("\r\n")}`;
}

async function backupZip() {
  const fiscalYear = getActiveFiscalYear();
  const zip = new JSZip();

  for (const cls of CLASSES) {
    const rows = makeCsvRowsForClass(cls.id, fiscalYear);
    const csvText = rowsToCsvText(rows);
    zip.file(`growth_${cls.id}_${fiscalYear}.csv`, csvText);
  }

  const blob = await zip.generateAsync({ type: "blob" });
  downloadBlob(blob, `growth_backup_${fiscalYear}.zip`);
  setStatus(`バックアップを保存しました。`, manageStatus);
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
  const rows = [];
  let row = [];
  let cell = "";
  let inQuotes = false;

  for (let i = 0; i < text.length; i += 1) {
    const ch = text[i];
    const next = text[i + 1];

    if (inQuotes) {
      if (ch === '"' && next === '"') {
        cell += '"';
        i += 1;
      } else if (ch === '"') {
        inQuotes = false;
      } else {
        cell += ch;
      }
      continue;
    }

    if (ch === '"') {
      inQuotes = true;
      continue;
    }

    if (ch === ",") {
      row.push(cell);
      cell = "";
      continue;
    }

    if (ch === "\r") {
      continue;
    }

    if (ch === "\n") {
      row.push(cell);
      rows.push(row);
      row = [];
      cell = "";
      continue;
    }

    cell += ch;
  }

  row.push(cell);
  rows.push(row);

  return rows
    .map((r) => r.map((c) => String(c || "").replace(/^\uFEFF/, "")))
    .filter((r) => r.some((c) => c !== ""));
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

async function fetchVersionJson(cacheMode = "default") {
  const response = await fetch("./version.json", {
    cache: cacheMode,
    headers: { "cache-control": "no-cache" }
  });
  if (!response.ok) throw new Error("version.json を読み込めませんでした。");
  const payload = await response.json();
  return normalizeText(payload?.version);
}

function postMessageToWorker(worker, message) {
  return new Promise((resolve) => {
    if (!worker) {
      resolve(null);
      return;
    }

    const channel = new MessageChannel();
    channel.port1.onmessage = (event) => {
      resolve(event.data ?? null);
    };

    try {
      worker.postMessage(message, [channel.port2]);
    } catch {
      resolve(null);
    }
  });
}

async function getCurrentVersionFromServiceWorker() {
  try {
    const registration = await navigator.serviceWorker.ready;
    const worker = registration.active || navigator.serviceWorker.controller;
    const response = await postMessageToWorker(worker, { type: "GET_CURRENT_VERSION" });
    const version = normalizeText(response?.version);
    if (version) return version;
  } catch {
  }

  try {
    return await fetchVersionJson("reload");
  } catch {
    return "";
  }
}

function updateVersionButtonState() {
  const hasNewVersion = !!currentAppVersion && !!latestAppVersion && currentAppVersion !== latestAppVersion;
  const canUpdate = !!waitingWorker || hasNewVersion;
  applyUpdateBtn.disabled = !canUpdate;
  latestVersionValue.textContent = hasNewVersion ? latestAppVersion : "最新です";
}

function renderVersionInfo() {
  currentVersionValue.textContent = currentAppVersion || "確認できません";
  updateVersionButtonState();
}

async function refreshVersionInfo() {
  setStatus("", versionStatus);

  try {
    currentAppVersion = await getCurrentVersionFromServiceWorker();
  } catch {
    currentAppVersion = "";
  }

  try {
    latestAppVersion = await fetchVersionJson("no-store");
  } catch {
    latestAppVersion = currentAppVersion;
  }

  renderVersionInfo();
}

function setWaitingWorker(worker) {
  waitingWorker = worker || null;
  updateVersionButtonState();
}

function watchInstallingWorker(worker) {
  if (!worker) return;

  worker.addEventListener("statechange", () => {
    if (worker.state === "installed" && swRegistration?.waiting) {
      setWaitingWorker(swRegistration.waiting);
    }

    if (worker.state === "activated") {
      setWaitingWorker(null);
    }
  });
}

function wireServiceWorkerRegistration(registration) {
  swRegistration = registration || null;
  setWaitingWorker(swRegistration?.waiting || null);

  if (!swRegistration) return;

  if (swRegistration.installing) {
    watchInstallingWorker(swRegistration.installing);
  }

  swRegistration.addEventListener("updatefound", () => {
    watchInstallingWorker(swRegistration.installing);
  });
}

function waitForInstalledWorker(registration) {
  return new Promise((resolve) => {
    let timer = null;

    const finish = (worker) => {
      if (timer) {
        clearTimeout(timer);
        timer = null;
      }
      resolve(worker || null);
    };

    const watch = (worker) => {
      if (!worker) return false;
      if (worker.state === "installed") {
        finish(registration.waiting || worker);
        return true;
      }
      worker.addEventListener("statechange", () => {
        if (worker.state === "installed") {
          finish(registration.waiting || worker);
        }
      }, { once: true });
      return true;
    };

    if (registration.waiting) {
      finish(registration.waiting);
      return;
    }

    if (watch(registration.installing)) return;

    const onUpdateFound = () => {
      registration.removeEventListener("updatefound", onUpdateFound);
      if (!watch(registration.installing)) finish(null);
    };

    registration.addEventListener("updatefound", onUpdateFound, { once: true });
    timer = setTimeout(() => {
      registration.removeEventListener("updatefound", onUpdateFound);
      finish(registration.waiting || null);
    }, 8000);
  });
}

function activateWorkerAndReload(worker) {
  return new Promise((resolve) => {
    let done = false;
    const finish = () => {
      if (done) return;
      done = true;
      resolve();
    };

    const timer = setTimeout(finish, 4000);
    const onControllerChange = () => {
      clearTimeout(timer);
      navigator.serviceWorker.removeEventListener("controllerchange", onControllerChange);
      finish();
    };

    navigator.serviceWorker.addEventListener("controllerchange", onControllerChange);

    try {
      worker.postMessage({ type: "SKIP_WAITING" });
    } catch {
      clearTimeout(timer);
      navigator.serviceWorker.removeEventListener("controllerchange", onControllerChange);
      finish();
    }
  }).then(() => {
    window.location.reload();
  });
}

async function applyWaitingUpdate() {
  if (!swRegistration) return;

  applyUpdateBtn.disabled = true;
  setStatus("更新しています...", versionStatus);

  try {
    let targetWorker = swRegistration.waiting || waitingWorker || null;

    if (!targetWorker) {
      const installedWorkerPromise = waitForInstalledWorker(swRegistration);
      await swRegistration.update();
      targetWorker = await installedWorkerPromise;
    }

    if (targetWorker) {
      setWaitingWorker(swRegistration.waiting || targetWorker);
      await activateWorkerAndReload(swRegistration.waiting || targetWorker);
      return;
    }

    await refreshVersionInfo();
    setStatus("最新です。", versionStatus);
  } catch {
    await refreshVersionInfo();
    setStatus("更新に失敗しました。", versionStatus);
  }
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
  openVersionBtn.addEventListener("click", async () => {
    showView("version");
    await refreshVersionInfo();
  });
  backFromReportBtn.addEventListener("click", () => {
    showView("input");
  });
  backFromManageBtn.addEventListener("click", () => {
    showView("input");
  });
  backFromVersionBtn.addEventListener("click", () => {
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

  applyUpdateBtn.addEventListener("click", applyWaitingUpdate);

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
  if (!("serviceWorker" in navigator)) return null;
  try {
    let registration = await navigator.serviceWorker.getRegistration();
    if (!registration) {
      registration = await navigator.serviceWorker.register("./sw.js");
    }
    wireServiceWorkerRegistration(registration);
    return registration;
  } catch {
    return null;
  }
}

async function init() {
  try {
    await loadChildrenMaster();
    await loadAverageGrowthMaster();
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
  } catch (error) {
    setStatus("初期化に失敗しました。child.json または average_growth.json を確認してください。");
  }
}

init();