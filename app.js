let CLASSES = [];
let CHILDREN = [];

const STORAGE_KEY = "growth_records_v3";

const el = (id) => document.getElementById(id);

const inputView = el("inputView");
const reportView = el("reportView");

const classSelect = el("classSelect");
const childSelect = el("childSelect");
const dateInput = el("dateInput");
const heightInput = el("heightInput");
const weightInput = el("weightInput");
const modeView = el("modeView");
const statusLine = el("statusLine");

const reportTitle = el("reportTitle");
const tbody = el("dataTbody");
const chartCanvas = el("chart");
const chartNote = el("chartNote");
const toast = el("toast");

const backupBtn = el("backupBtn");
const restoreBtn = el("restoreBtn");
const restoreFile = el("restoreFile");

let editContext = null;

function loadAll() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

function saveAll(obj) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(obj));
}

function todayISO() {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const da = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${da}`;
}

function ymOf(dateStr) {
  return String(dateStr).slice(0, 7);
}

function parseNum(v) {
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
}

function round1(n) {
  return Math.round(n * 10) / 10;
}

function getClassById(id) {
  return CLASSES.find((c) => c.id === id) || null;
}

function getChildById(id) {
  return CHILDREN.find((c) => c.id === id) || null;
}

function showToast(msg) {
  toast.textContent = msg;
  toast.classList.add("show");
  setTimeout(() => toast.classList.remove("show"), 1800);
}

function showView(which) {
  if (which === "input") {
    inputView.classList.add("active");
    reportView.classList.remove("active");
  } else {
    inputView.classList.remove("active");
    reportView.classList.add("active");
  }
}

function initSelectors() {
  classSelect.innerHTML = "";

  for (const c of CLASSES) {
    const opt = document.createElement("option");
    opt.value = c.id;
    opt.textContent = c.name;
    classSelect.appendChild(opt);
  }

  classSelect.value = CLASSES[0]?.id ?? "";
  refreshChildOptions();
}

function refreshChildOptions() {
  const clsId = classSelect.value;

  const list = CHILDREN
    .filter((ch) => ch.classId === clsId)
    .sort((a, b) => a.no - b.no);

  childSelect.innerHTML = "";

  if (list.length) {
    for (const ch of list) {
      const opt = document.createElement("option");
      opt.value = ch.id;
      opt.textContent = `${ch.no}. ${ch.name}`;
      childSelect.appendChild(opt);
    }
    childSelect.value = list[0].id;
  } else {
    const opt = document.createElement("option");
    opt.value = "";
    opt.textContent = "（園児未登録）";
    childSelect.appendChild(opt);
    childSelect.value = "";
  }

  refreshStatus();
}

function setModeNew() {
  editContext = null;
  modeView.value = "新規登録";
  dateInput.value = todayISO();
  heightInput.value = "";
  weightInput.value = "";
}

function setModeEdit(childId, dateStr) {
  editContext = { childId, originalDate: dateStr };
  modeView.value = "編集";
}

function currentChildId() {
  return childSelect.value;
}

function refreshStatus() {
  const cls = getClassById(classSelect.value);
  const ch = getChildById(currentChildId());
  statusLine.textContent = `選択中：${cls?.name ?? "-"} / ${ch?.name ?? "-"}`;
}

function validateInputs() {
  const childId = currentChildId();
  if (!childId) return { ok: false, msg: "園児未選択" };

  const d = dateInput.value;
  const h = parseNum(heightInput.value);
  const w = parseNum(weightInput.value);

  if (!d) return { ok: false, msg: "日付を入力" };
  if (h === null || w === null) return { ok: false, msg: "数値入力" };
  if (h < 30 || h > 140) return { ok: false, msg: "身長異常値" };
  if (w < 2 || w > 60) return { ok: false, msg: "体重異常値" };

  return {
    ok: true,
    childId,
    date: d,
    height: round1(h),
    weight: round1(w)
  };
}

function upsertRecord(childId, dateStr, height, weight, updatedAt = Date.now()) {
  const all = loadAll();
  if (!all[childId]) all[childId] = {};

  all[childId][dateStr] = {
    date: dateStr,
    height,
    weight,
    updatedAt
  };

  saveAll(all);
}

function moveIfNeeded(childId, originalDate, newDate) {
  if (originalDate === newDate) return;

  const all = loadAll();
  if (!all[childId]) return;

  if (all[childId][originalDate]) {
    delete all[childId][originalDate];
    saveAll(all);
  }
}

function deleteRecord(childId, dateStr) {
  const all = loadAll();

  if (all[childId] && all[childId][dateStr]) {
    delete all[childId][dateStr];

    if (Object.keys(all[childId]).length === 0) {
      delete all[childId];
    }

    saveAll(all);
    return true;
  }

  return false;
}

function computeLatestByMonthForChild(recs) {
  const monthLatest = {};

  for (const d of Object.keys(recs || {})) {
    const ym = ymOf(d);
    if (!monthLatest[ym] || d > monthLatest[ym]) {
      monthLatest[ym] = d;
    }
  }

  return monthLatest;
}

function openReport() {
  const childId = currentChildId();

  if (!childId) {
    showToast("園児を選択");
    return;
  }

  const ch = getChildById(childId);
  const cls = getClassById(ch?.classId || classSelect.value);

  reportTitle.textContent = `表示対象：${cls?.name ?? "-"} / ${ch?.name ?? "-"}（ID: ${childId}）`;
  showView("report");
  renderChildTable();
  drawChartForSelected();
}

function renderChildTable() {
  const childId = currentChildId();
  const all = loadAll();
  const recs = all?.[childId] || {};
  const latest = computeLatestByMonthForChild(recs);

  tbody.innerHTML = "";

  const rows = Object.keys(recs).sort((a, b) => b.localeCompare(a));

  if (rows.length === 0) {
    const tr = document.createElement("tr");
    tr.innerHTML = `<td colspan="5">データなし</td>`;
    tbody.appendChild(tr);
    return;
  }

  for (const d of rows) {
    const r = recs[d];
    const ym = ymOf(d);
    const valid = latest[ym] === d;

    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>${d}</td>
      <td class="right">${Number(r.height).toFixed(1)}</td>
      <td class="right">${Number(r.weight).toFixed(1)}</td>
      <td>${valid ? "有効" : "旧"}</td>
      <td>
        <button data-edit="${d}">編集</button>
        <button class="danger" data-del="${d}">削除</button>
      </td>
    `;

    tr.addEventListener("click", (ev) => {
      const editDate = ev.target?.dataset?.edit;
      const delDate = ev.target?.dataset?.del;

      if (editDate) {
        loadRowToForm(childId, editDate);
        return;
      }

      if (delDate) {
        if (confirm(`削除しますか？\n${delDate}`)) {
          const ok = deleteRecord(childId, delDate);
          if (ok) {
            if (editContext && editContext.childId === childId && editContext.originalDate === delDate) {
              setModeNew();
            }
            renderChildTable();
            drawChartForSelected();
            showToast("削除");
          }
        }
      }
    });

    tbody.appendChild(tr);
  }
}

function loadRowToForm(childId, dateStr) {
  const all = loadAll();
  const rec = all?.[childId]?.[dateStr];
  if (!rec) return;

  const ch = getChildById(childId);
  if (ch?.classId) {
    classSelect.value = ch.classId;
    refreshChildOptions();
    childSelect.value = childId;
  }

  dateInput.value = dateStr;
  heightInput.value = rec.height;
  weightInput.value = rec.weight;
  setModeEdit(childId, dateStr);

  showView("input");
  refreshStatus();
  showToast("編集モード");
}

function drawChartForSelected() {
  const childId = currentChildId();
  const all = loadAll();
  const recs = all?.[childId] || {};
  const latest = computeLatestByMonthForChild(recs);
  const months = Object.keys(latest).sort();
  const points = months.map((m) => recs[latest[m]]);
  const ctx = chartCanvas.getContext("2d");

  ctx.clearRect(0, 0, chartCanvas.width, chartCanvas.height);

  if (points.length === 0) {
    ctx.fillText("データなし", 40, 40);
    chartNote.textContent = "—";
    return;
  }

  const ch = getChildById(childId);
  const cls = getClassById(ch?.classId || "");
  chartNote.textContent = `表示中：${cls?.name ?? "-"} / ${ch?.name ?? "-"}`;

  const pad = 50;
  const W = chartCanvas.width - pad * 2;
  const H = chartCanvas.height - pad * 2;
  const max = 140;

  const x = (i) => pad + (W * (i / (points.length - 1 || 1)));
  const y = (v) => pad + H * (1 - v / max);

  ctx.strokeStyle = "#2563eb";
  ctx.beginPath();
  points.forEach((p, i) => {
    const xx = x(i);
    const yy = y(p.height);
    if (i === 0) ctx.moveTo(xx, yy);
    else ctx.lineTo(xx, yy);
  });
  ctx.stroke();

  ctx.strokeStyle = "#ef4444";
  ctx.beginPath();
  points.forEach((p, i) => {
    const xx = x(i);
    const yy = y(p.weight);
    if (i === 0) ctx.moveTo(xx, yy);
    else ctx.lineTo(xx, yy);
  });
  ctx.stroke();
}

function csvEscape(s) {
  const str = String(s ?? "");
  if (str.includes(",") || str.includes('"') || str.includes("\n")) {
    return `"${str.replaceAll('"', '""')}"`;
  }
  return str;
}

function downloadCSV(text, filename) {
  const bom = "\uFEFF";
  const blob = new Blob([bom + text], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

function buildAllRowsForCSV() {
  const all = loadAll();
  const rows = [];

  for (const childId of Object.keys(all)) {
    const ch = getChildById(childId);
    const cls = getClassById(ch?.classId || "");
    const recs = all[childId] || {};

    for (const dateStr of Object.keys(recs)) {
      const r = recs[dateStr];
      rows.push({
        className: cls?.name || "",
        childName: ch?.name || "",
        childId,
        date: dateStr,
        ym: ymOf(dateStr),
        height: Number(r.height).toFixed(1),
        weight: Number(r.weight).toFixed(1),
        updatedAt: String(r.updatedAt ?? "")
      });
    }
  }

  rows.sort((a, b) => (a.date + a.childId).localeCompare(b.date + b.childId));
  return rows;
}

function exportCSVAll() {
  const lines = [];
  lines.push([
    "className",
    "childName",
    "childId",
    "date",
    "yearMonth",
    "height_cm",
    "weight_kg"
  ].join(","));

  const rows = buildAllRowsForCSV();

  for (const r of rows) {
    lines.push([
      csvEscape(r.className),
      csvEscape(r.childName),
      csvEscape(r.childId),
      csvEscape(r.date),
      csvEscape(r.ym),
      r.height,
      r.weight
    ].join(","));
  }

  downloadCSV(lines.join("\n"), `growth_all_${todayISO().replaceAll("-", "")}.csv`);
  showToast("CSV全園児");
}

function exportCSVBackup() {
  const lines = [];
  lines.push([
    "className",
    "childName",
    "childId",
    "date",
    "yearMonth",
    "height_cm",
    "weight_kg",
    "updatedAt"
  ].join(","));

  const rows = buildAllRowsForCSV();

  for (const r of rows) {
    lines.push([
      csvEscape(r.className),
      csvEscape(r.childName),
      csvEscape(r.childId),
      csvEscape(r.date),
      csvEscape(r.ym),
      r.height,
      r.weight,
      csvEscape(r.updatedAt)
    ].join(","));
  }

  downloadCSV(lines.join("\n"), `growth_backup_${todayISO().replaceAll("-", "")}.csv`);
  showToast("CSVバックアップ");
}

function exportCSVSelectedChild() {
  const childId = currentChildId();

  if (!childId) {
    showToast("園児を選択");
    return;
  }

  const all = loadAll();
  const recs = all?.[childId] || {};
  const ch = getChildById(childId);
  const cls = getClassById(ch?.classId || "");

  const lines = [];
  lines.push(["className", "childName", "childId", "date", "yearMonth", "height_cm", "weight_kg"].join(","));

  const rows = Object.keys(recs).sort().map((dateStr) => {
    const r = recs[dateStr];
    return {
      className: cls?.name || "",
      childName: ch?.name || "",
      childId,
      date: dateStr,
      ym: ymOf(dateStr),
      height: Number(r.height).toFixed(1),
      weight: Number(r.weight).toFixed(1)
    };
  });

  for (const r of rows) {
    lines.push([
      csvEscape(r.className),
      csvEscape(r.childName),
      csvEscape(r.childId),
      csvEscape(r.date),
      csvEscape(r.ym),
      r.height,
      r.weight
    ].join(","));
  }

  downloadCSV(lines.join("\n"), `growth_${(cls?.name || "")}_${(ch?.name || "")}_${todayISO().replaceAll("-", "")}.csv`);
  showToast("CSVこの園児");
}

function parseCSV(text) {
  const rows = [];
  let row = [];
  let field = "";
  let inQuotes = false;

  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    const next = text[i + 1];

    if (inQuotes) {
      if (ch === '"' && next === '"') {
        field += '"';
        i++;
      } else if (ch === '"') {
        inQuotes = false;
      } else {
        field += ch;
      }
      continue;
    }

    if (ch === '"') {
      inQuotes = true;
      continue;
    }

    if (ch === ",") {
      row.push(field);
      field = "";
      continue;
    }

    if (ch === "\n") {
      row.push(field);
      rows.push(row);
      row = [];
      field = "";
      continue;
    }

    if (ch === "\r") {
      continue;
    }

    field += ch;
  }

  if (field.length > 0 || row.length > 0) {
    row.push(field);
    rows.push(row);
  }

  return rows;
}

function restoreFromCSV(file) {
  if (!file) return;

  const reader = new FileReader();

  reader.onload = (e) => {
    try {
      const text = String(e.target?.result || "").replace(/^\uFEFF/, "");
      const rows = parseCSV(text);

      if (rows.length < 2) {
        alert("CSVの内容が空です。");
        return;
      }

      const header = rows[0].map((v) => String(v).trim());
      const idxChildId = header.indexOf("childId");
      const idxDate = header.indexOf("date");
      const idxHeight = header.indexOf("height_cm");
      const idxWeight = header.indexOf("weight_kg");
      const idxUpdatedAt = header.indexOf("updatedAt");

      if (idxChildId < 0 || idxDate < 0 || idxHeight < 0 || idxWeight < 0) {
        alert("CSVの形式が違います。");
        return;
      }

      const nextAll = {};

      for (let i = 1; i < rows.length; i++) {
        const cols = rows[i];
        const childId = String(cols[idxChildId] ?? "").trim();
        const dateStr = String(cols[idxDate] ?? "").trim();
        const height = parseNum(cols[idxHeight]);
        const weight = parseNum(cols[idxWeight]);
        const updatedAtRaw = idxUpdatedAt >= 0 ? Number(cols[idxUpdatedAt] ?? "") : Date.now();

        if (!childId || !dateStr) continue;
        if (height === null || weight === null) continue;

        if (!nextAll[childId]) nextAll[childId] = {};

        nextAll[childId][dateStr] = {
          date: dateStr,
          height: round1(height),
          weight: round1(weight),
          updatedAt: Number.isFinite(updatedAtRaw) && updatedAtRaw > 0 ? updatedAtRaw : Date.now()
        };
      }

      saveAll(nextAll);
      setModeNew();
      refreshStatus();
      showView("input");
      tbody.innerHTML = "";
      const ctx = chartCanvas.getContext("2d");
      ctx.clearRect(0, 0, chartCanvas.width, chartCanvas.height);
      chartNote.textContent = "—";
      showToast("CSV復元");
    } catch {
      alert("CSV復元に失敗しました。");
    }
  };

  reader.readAsText(file);
}

function bindEvents() {
  el("saveBtn").addEventListener("click", () => {
    const v = validateInputs();
    if (!v.ok) {
      showToast(v.msg);
      return;
    }

    if (editContext && editContext.childId === v.childId) {
      moveIfNeeded(v.childId, editContext.originalDate, v.date);
    }

    upsertRecord(v.childId, v.date, v.height, v.weight);
    setModeNew();
    refreshStatus();
    showToast("保存");
  });

  el("newBtn").addEventListener("click", () => {
    setModeNew();
    showToast("新規入力");
  });

  el("openReportBtn").addEventListener("click", openReport);

  el("backBtn").addEventListener("click", () => {
    showView("input");
  });

  el("graphBtn").addEventListener("click", () => {
    drawChartForSelected();
    showToast("グラフ更新");
  });

  el("csvAllBtn").addEventListener("click", exportCSVAll);
  el("csvChildBtn").addEventListener("click", exportCSVSelectedChild);

  backupBtn.addEventListener("click", exportCSVBackup);

  restoreBtn.addEventListener("click", () => {
    restoreFile.value = "";
    restoreFile.click();
  });

  restoreFile.addEventListener("change", (ev) => {
    const file = ev.target.files?.[0];
    if (file) restoreFromCSV(file);
  });

  el("resetBtn").addEventListener("click", () => {
    if (prompt("削除と入力") === "削除") {
      localStorage.removeItem(STORAGE_KEY);
      setModeNew();
      refreshStatus();
      showView("input");
      tbody.innerHTML = "";
      const ctx = chartCanvas.getContext("2d");
      ctx.clearRect(0, 0, chartCanvas.width, chartCanvas.height);
      chartNote.textContent = "—";
      showToast("全削除");
    }
  });

  classSelect.addEventListener("change", () => {
    refreshChildOptions();
    setModeNew();
    showToast("クラス切替");
  });

  childSelect.addEventListener("change", () => {
    setModeNew();
    refreshStatus();
  });
}

async function loadChildData() {
  const res = await fetch("./child.json", { cache: "no-store" });

  if (!res.ok) {
    throw new Error("child.json の読み込みに失敗しました。");
  }

  const json = await res.json();

  CLASSES = (json.classes || [])
    .map((c) => ({
      id: String(c.id ?? ""),
      name: String(c.name ?? "")
    }))
    .filter((c) => c.id && c.name);

  CHILDREN = (json.children || [])
    .map((ch) => ({
      id: String(ch.id ?? ""),
      classId: String(ch.classId ?? ""),
      className: String(ch.className ?? ""),
      no: Number(ch.no ?? 0),
      name: String(ch.name ?? ""),
      gender: String(ch.gender ?? "")
    }))
    .filter((ch) => ch.id && ch.classId && ch.name);
}

async function initApp() {
  try {
    await loadChildData();
    initSelectors();
    setModeNew();
    refreshStatus();
    bindEvents();
  } catch (err) {
    console.error(err);
    alert("child.json の読み込みに失敗しました。");
    statusLine.textContent = "child.json の読み込みに失敗しました。";
  }
}

if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("./sw.js");
  });
}

initApp();