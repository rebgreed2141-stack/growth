let CLASSES = [];
let CHILDREN = [];

const STORAGE_KEY = "growth_records_v2";

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

  for (const ch of list) {
    const opt = document.createElement("option");
    opt.value = ch.id;
    opt.textContent = `${ch.no}. ${ch.name}`;
    childSelect.appendChild(opt);
  }

  if (list.length) {
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
  modeView.value = "編集（一覧から選択中）";
}

function currentChildId() {
  return childSelect.value;
}

function refreshStatus() {
  const childId = currentChildId();
  const cls = getClassById(classSelect.value);
  const ch = getChildById(childId);

  if (!childId) {
    statusLine.textContent = `選択中：${cls?.name ?? "-"} / （園児未登録）`;
    return;
  }

  statusLine.textContent = `選択中：${cls?.name ?? "-"} / ${ch?.name ?? "-"}（ID: ${childId}）`;
}

function validateInputs() {
  const childId = currentChildId();
  if (!childId) {
    return { ok: false, msg: "園児が未登録のクラスです。child.json を確認してください。" };
  }

  const d = dateInput.value;
  const h = parseNum(heightInput.value);
  const w = parseNum(weightInput.value);

  if (!d) return { ok: false, msg: "日付を入力してください。" };
  if (h === null || w === null) return { ok: false, msg: "身長・体重を入力してください。" };
  if (h <= 0 || w <= 0) return { ok: false, msg: "身長・体重は0より大きい値にしてください。" };

  return { ok: true, childId, date: d, height: round1(h), weight: round1(w) };
}

function upsertRecord(childId, dateStr, height, weight) {
  const all = loadAll();
  if (!all[childId]) all[childId] = {};
  const existed = !!all[childId][dateStr];

  all[childId][dateStr] = {
    date: dateStr,
    height,
    weight,
    updatedAt: Date.now()
  };

  saveAll(all);
  return existed;
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

function computeLatestByMonthForChild(recsByDate) {
  const monthLatest = {};
  const dates = Object.keys(recsByDate || {}).sort();

  for (const d of dates) {
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
    showToast("園児を選択してください。");
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
  const monthLatest = computeLatestByMonthForChild(recs);

  const rows = Object.keys(recs)
    .sort((a, b) => b.localeCompare(a))
    .map((dateStr) => {
      const r = recs[dateStr];
      const ym = ymOf(dateStr);
      const latest = monthLatest[ym] || dateStr;
      const isValid = dateStr === latest;

      return {
        date: dateStr,
        ym,
        height: r.height,
        weight: r.weight,
        isValid
      };
    });

  tbody.innerHTML = "";

  if (rows.length === 0) {
    const tr = document.createElement("tr");
    tr.innerHTML = `<td colspan="5" class="muted">この園児のデータがありません。</td>`;
    tbody.appendChild(tr);
    return;
  }

  for (const row of rows) {
    const tr = document.createElement("tr");

    const statePill = row.isValid
      ? `<span class="pill ok">有効</span>`
      : `<span class="pill warn">無効候補</span>`;

    tr.innerHTML = `
      <td class="nowrap">${escapeHtml(row.date)}<div class="small">${escapeHtml(row.ym)}</div></td>
      <td class="right nowrap">${Number(row.height).toFixed(1)}</td>
      <td class="right nowrap">${Number(row.weight).toFixed(1)}</td>
      <td class="nowrap">${statePill}</td>
      <td class="nowrap">
        <button data-act="edit">編集</button>
        <button class="danger" data-act="del">削除</button>
      </td>
    `;

    tr.addEventListener("click", (ev) => {
      const act = ev.target?.dataset?.act;

      if (act === "edit") {
        ev.stopPropagation();
        loadRowToForm(childId, row.date);
        return;
      }

      if (act === "del") {
        ev.stopPropagation();

        if (confirm(`削除しますか？\n${row.date}`)) {
          const ok = deleteRecord(childId, row.date);

          if (ok) {
            if (editContext && editContext.childId === childId && editContext.originalDate === row.date) {
              setModeNew();
            }

            showToast("削除しました。");
            renderChildTable();
            drawChartForSelected();
          }
        }

        return;
      }

      loadRowToForm(childId, row.date);
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
  showToast("編集用に入力画面へ戻しました。");
  refreshStatus();
}

function escapeHtml(s) {
  return String(s ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function drawChartForSelected() {
  const childId = currentChildId();
  const all = loadAll();
  const recsByDate = all?.[childId] || {};
  const dates = Object.keys(recsByDate);
  const ctx = chartCanvas.getContext("2d");

  ctx.clearRect(0, 0, chartCanvas.width, chartCanvas.height);

  if (!childId) {
    ctx.font = "14px system-ui";
    ctx.fillStyle = "#6b7280";
    ctx.fillText("園児が未選択です。", 20, 40);
    chartNote.textContent = "—";
    return;
  }

  const ch = getChildById(childId);
  const cls = getClassById(ch?.classId || "");
  chartNote.textContent = `表示中：${cls?.name ?? "-"} / ${ch?.name ?? "-"}（月別、同月は最新日付のみ／Y=0〜140）`;

  if (dates.length === 0) {
    ctx.font = "14px system-ui";
    ctx.fillStyle = "#6b7280";
    ctx.fillText("データがありません。", 20, 40);
    return;
  }

  const monthLatest = computeLatestByMonthForChild(recsByDate);
  const months = Object.keys(monthLatest).sort();
  const points = months.map((ym) => {
    const d = monthLatest[ym];
    const r = recsByDate[d];
    return { ym, date: d, height: r.height, weight: r.weight };
  });

  const pad = { l: 56, r: 20, t: 26, b: 46 };
  const W = chartCanvas.width;
  const H = chartCanvas.height;
  const plotW = W - pad.l - pad.r;
  const plotH = H - pad.t - pad.b;

  const Y_MIN = 0;
  const Y_MAX = 140;

  const xOf = (i) => pad.l + (points.length === 1 ? plotW / 2 : plotW * (i / (points.length - 1)));
  const yOf = (v) => pad.t + plotH * (1 - (v - Y_MIN) / (Y_MAX - Y_MIN));

  ctx.strokeStyle = "#e5e7eb";
  ctx.lineWidth = 1;
  ctx.strokeRect(pad.l, pad.t, plotW, plotH);

  const TICK_STEP = 10;
  ctx.font = "12px system-ui";
  ctx.fillStyle = "#6b7280";
  ctx.strokeStyle = "#eef2f7";
  ctx.lineWidth = 1;

  for (let yv = Y_MIN; yv <= Y_MAX; yv += TICK_STEP) {
    const y = yOf(yv);

    ctx.beginPath();
    ctx.moveTo(pad.l, y);
    ctx.lineTo(pad.l + plotW, y);
    ctx.stroke();

    const label = String(yv);
    const tw = ctx.measureText(label).width;
    ctx.fillText(label, pad.l - 8 - tw, y + 4);
  }

  ctx.fillStyle = "#6b7280";
  ctx.strokeStyle = "#f1f5f9";
  ctx.lineWidth = 1;

  points.forEach((p, i) => {
    const x = xOf(i);
    const label = p.ym;
    const w = ctx.measureText(label).width;

    ctx.fillText(label, x - w / 2, H - 14);

    ctx.beginPath();
    ctx.moveTo(x, pad.t);
    ctx.lineTo(x, pad.t + plotH);
    ctx.stroke();
  });

  ctx.fillStyle = "#111827";
  ctx.font = "12px system-ui";
  ctx.fillText("身長（cm）", pad.l, 16);
  ctx.fillText("体重（kg）", pad.l + 90, 16);

  const colorHeight = "#2563eb";
  const colorWeight = "#ef4444";

  ctx.strokeStyle = colorHeight;
  ctx.lineWidth = 2;
  ctx.beginPath();
  points.forEach((p, i) => {
    const x = xOf(i);
    const y = yOf(p.height);
    if (i === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  });
  ctx.stroke();

  ctx.strokeStyle = colorWeight;
  ctx.lineWidth = 2;
  ctx.beginPath();
  points.forEach((p, i) => {
    const x = xOf(i);
    const y = yOf(p.weight);
    if (i === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  });
  ctx.stroke();

  points.forEach((p, i) => {
    const x = xOf(i);

    ctx.fillStyle = colorHeight;
    ctx.beginPath();
    ctx.arc(x, yOf(p.height), 3, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = colorWeight;
    ctx.beginPath();
    ctx.arc(x, yOf(p.weight), 3, 0, Math.PI * 2);
    ctx.fill();
  });
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

function exportCSVAll() {
  const all = loadAll();
  const lines = [];
  lines.push(["className", "childName", "childId", "date", "yearMonth", "height_cm", "weight_kg"].join(","));

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
        weight: Number(r.weight).toFixed(1)
      });
    }
  }

  rows.sort((a, b) => (a.date + a.childId).localeCompare(b.date + b.childId));

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
  showToast("CSV（全園児）を書き出しました。");
}

function exportCSVSelectedChild() {
  const childId = currentChildId();

  if (!childId) {
    showToast("園児を選択してください。");
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
  showToast("CSV（この園児）を書き出しました。");
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

    const existed = upsertRecord(v.childId, v.date, v.height, v.weight);
    showToast(existed ? "上書きしました。" : "登録しました。");

    setModeNew();
    refreshStatus();
  });

  el("newBtn").addEventListener("click", () => {
    setModeNew();
    showToast("新規入力に戻しました。");
  });

  el("openReportBtn").addEventListener("click", openReport);

  el("backBtn").addEventListener("click", () => {
    showView("input");
    showToast("入力画面に戻りました。");
  });

  el("graphBtn").addEventListener("click", () => {
    drawChartForSelected();
    showToast("グラフを更新しました。");
  });

  el("csvAllBtn").addEventListener("click", exportCSVAll);
  el("csvChildBtn").addEventListener("click", exportCSVSelectedChild);

  el("resetBtn").addEventListener("click", () => {
    if (confirm("本当に全データを削除しますか？（元に戻せません）")) {
      localStorage.removeItem(STORAGE_KEY);
      setModeNew();
      refreshStatus();
      showView("input");
      showToast("全データを削除しました。");
    }
  });

  classSelect.addEventListener("change", () => {
    refreshChildOptions();
    setModeNew();
    showToast("クラスを切り替えました。");
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

  if (!json || !Array.isArray(json.classes) || !Array.isArray(json.children)) {
    throw new Error("child.json の形式が正しくありません。");
  }

  CLASSES = json.classes
    .map((c) => ({
      id: String(c.id ?? ""),
      name: String(c.name ?? "")
    }))
    .filter((c) => c.id && c.name);

  CHILDREN = json.children
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
    alert("child.json の読み込みに失敗しました。index.html と同じフォルダに child.json を置き、内容を確認してください。");
    statusLine.textContent = "child.json の読み込みに失敗しました。";
  }
}

if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("./sw.js");
  });
}

initApp();