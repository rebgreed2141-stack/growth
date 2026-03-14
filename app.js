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

function normalizeChildrenPayload(payload) {
  if (Array.isArray(payload)) {
    const children = payload.map((item, index) => {
      const classId = String(item.classId || item.class || item.group || "");
      const name = normalizeText(item.name || item.childName || item.fullName || "");
      return {
        id: normalizeChildId(item),
        classId,
        name,
        no: Number(item.no) || index + 1
      };
    });
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
      no: Number(item.no) || index + 1
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
  chartNote.textContent = "最新のデータが上に表示されます。";

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

  const margin = { top: 28, right: 70, bottom: 56, left: 70 };
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

  drawLine(ctx, heightPoints, "#2e7d32", true);
  drawLine(ctx, weightPoints, "#1565c0", true);

  drawLegend(ctx, width - 170, margin.top + 10);
}

function drawLine(ctx, points, color, drawDots) {
  if (!points.length) return;

  ctx.strokeStyle = color;
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(points[0].x, points[0].y);
  for (let i = 1; i < points.length; i += 1) {
    ctx.lineTo(points[i].x, points[i].y);
  }
  ctx.stroke();

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

function drawLegend(ctx, x, y) {
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(x, y, 150, 54);
  ctx.strokeStyle = "#d9e2ec";
  ctx.strokeRect(x, y, 150, 54);

  ctx.strokeStyle = "#2e7d32";
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(x + 12, y + 18);
  ctx.lineTo(x + 42, y + 18);
  ctx.stroke();
  ctx.fillStyle = "#2e7d32";
  ctx.beginPath();
  ctx.arc(x + 27, y + 18, 4.5, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = "#2f4b5f";
  ctx.font = "12px sans-serif";
  ctx.textAlign = "left";
  ctx.fillText("身長", x + 52, y + 22);

  ctx.strokeStyle = "#1565c0";
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(x + 12, y + 38);
  ctx.lineTo(x + 42, y + 38);
  ctx.stroke();
  ctx.fillStyle = "#1565c0";
  ctx.beginPath();
  ctx.arc(x + 27, y + 38, 4.5, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = "#2f4b5f";
  ctx.fillText("体重", x + 52, y + 42);
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