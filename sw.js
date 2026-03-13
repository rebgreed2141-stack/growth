:root {
  --b: #e5e7eb;
  --t: #111827;
  --m: #6b7280;
  --bg: #ffffff;
  --card: #f9fafb;
  --accent: #2563eb;
}

body {
  font-family: system-ui, -apple-system, "Segoe UI", Roboto, "Hiragino Kaku Gothic ProN", "Noto Sans JP", Arial, sans-serif;
  margin: 0;
  color: var(--t);
  background: #f3f4f6;
}

header {
  padding: 14px 16px;
  background: var(--bg);
  border-bottom: 1px solid var(--b);
  position: sticky;
  top: 0;
  z-index: 5;
}

header h1 {
  font-size: 16px;
  margin: 0;
}

main {
  padding: 16px;
  max-width: 1100px;
  margin: 0 auto;
  display: grid;
  gap: 12px;
}

.card {
  background: var(--bg);
  border: 1px solid var(--b);
  border-radius: 12px;
  padding: 12px;
  box-shadow: 0 1px 0 rgba(0, 0, 0, 0.03);
}

.card h2 {
  font-size: 14px;
  margin: 0 0 8px 0;
}

.muted {
  color: var(--m);
  font-size: 12px;
}

.small {
  font-size: 12px;
  color: var(--m);
}

.grid {
  display: grid;
  gap: 10px;
}

.grid2 {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 10px;
}

label {
  font-size: 12px;
  color: var(--m);
  display: block;
  margin-bottom: 4px;
}

select,
input {
  width: 100%;
  padding: 8px 10px;
  border: 1px solid var(--b);
  border-radius: 10px;
  background: #fff;
  font-size: 14px;
  box-sizing: border-box;
}

input[type="number"] {
  text-align: right;
}

.btns {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-top: 6px;
}

button {
  border: 1px solid var(--b);
  background: #fff;
  border-radius: 10px;
  padding: 8px 10px;
  font-size: 13px;
  cursor: pointer;
}

button.primary {
  background: var(--accent);
  color: #fff;
  border-color: var(--accent);
}

button.danger {
  background: #fff;
  border-color: #ef4444;
  color: #ef4444;
}

button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.toast {
  position: fixed;
  right: 16px;
  bottom: 16px;
  background: #111827;
  color: #fff;
  padding: 10px 12px;
  border-radius: 12px;
  font-size: 13px;
  opacity: 0;
  transform: translateY(8px);
  transition: all 0.18s ease;
  pointer-events: none;
  max-width: 80vw;
}

.toast.show {
  opacity: 1;
  transform: translateY(0);
}

canvas {
  width: 100%;
  height: 320px;
  background: var(--card);
  border: 1px solid var(--b);
  border-radius: 12px;
}

table {
  width: 100%;
  border-collapse: collapse;
  font-size: 13px;
}

th,
td {
  border-bottom: 1px solid var(--b);
  padding: 8px 6px;
  vertical-align: middle;
}

th {
  text-align: left;
  font-size: 12px;
  color: var(--m);
  background: #fafafa;
  position: sticky;
  top: 0;
}

.pill {
  display: inline-block;
  padding: 2px 8px;
  border-radius: 999px;
  font-size: 11px;
  border: 1px solid var(--b);
  background: #fff;
  color: var(--m);
}

.warn {
  border-color: #f59e0b;
  color: #92400e;
  background: #fffbeb;
}

.ok {
  border-color: #10b981;
  color: #065f46;
  background: #ecfdf5;
}

.right {
  text-align: right;
}

.nowrap {
  white-space: nowrap;
}

.view {
  display: none;
}

.view.active {
  display: block;
}

.report-actions {
  margin-top: 0;
}

.table-card {
  max-height: 440px;
  overflow: auto;
}

.table-note {
  margin-bottom: 8px;
}

@media (max-width: 700px) {
  .grid2 {
    grid-template-columns: 1fr;
  }

  main {
    padding: 12px;
  }

  .card {
    padding: 10px;
  }
}