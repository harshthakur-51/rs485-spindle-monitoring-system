const TOTAL_SPINDLES = 10608;
const NODE_COUNT = 48;
const SPINDLES_PER_NODE = 221;

const state = {
  nodes: Array.from({ length: NODE_COUNT }, (_, index) => ({ id: index + 1, alarms: 0 })),
  events: [],
  trend: Array.from({ length: 60 }, () => 0),
  paused: false,
  ticks: 0,
  downtimeMinutes: 0
};

const nodeGrid = document.querySelector("#nodeGrid");
const rows = document.querySelector("#eventRows");
const alarmValue = document.querySelector("#alarmValue");
const alarmDetail = document.querySelector("#alarmDetail");
const latencyValue = document.querySelector("#latencyValue");
const availabilityValue = document.querySelector("#availabilityValue");
const downtimeDetail = document.querySelector("#downtimeDetail");
const chart = document.querySelector("#trendChart");

function nowLabel() { return new Date().toLocaleTimeString([], { hour12: false }); }
function randomBetween(minimum, maximum) { return Math.floor(Math.random() * (maximum - minimum + 1)) + minimum; }

function openBreak(node) {
  node.alarms += 1;
  const spindle = (node.id - 1) * SPINDLES_PER_NODE + randomBetween(1, SPINDLES_PER_NODE);
  state.events.unshift({ time: nowLabel(), node: `N-${String(node.id).padStart(2, "0")}`, spindle, open: true, latency: randomBetween(82, 272) });
}

function clearBreak() {
  const openEvent = state.events.find((event) => event.open);
  if (!openEvent) return;
  openEvent.open = false;
  const nodeId = Number(openEvent.node.slice(2));
  state.nodes[nodeId - 1].alarms = Math.max(0, state.nodes[nodeId - 1].alarms - 1);
}

function step() {
  if (state.paused) return;
  state.ticks += 1;
  const newEvents = Math.random() < 0.38 ? (Math.random() < 0.13 ? 2 : 1) : 0;
  for (let i = 0; i < newEvents; i += 1) openBreak(state.nodes[randomBetween(0, NODE_COUNT - 1)]);
  if (Math.random() < 0.52) clearBreak();
  const active = state.events.filter((event) => event.open).length;
  state.downtimeMinutes += active / 12;
  state.trend.push(newEvents);
  const windowLength = Number(document.querySelector("#windowSelector").value);
  state.trend = state.trend.slice(-windowLength);
  render();
}

function renderNodes() {
  nodeGrid.innerHTML = state.nodes.map((node) => `
      <div class="node ${node.alarms ? "alert" : ""}">
        <strong>N-${String(node.id).padStart(2, "0")}</strong>
        <span>${node.alarms ? `${node.alarms} alarm` : "online"}</span>
      </div>`).join("");
}

function renderEvents() {
  const onlyOpen = document.querySelector("#alertsOnly").checked;
  const visible = state.events.filter((event) => !onlyOpen || event.open).slice(0, 8);
  rows.innerHTML = visible.length ? visible.map((event) => `
      <tr><td>${event.time}</td><td>${event.node}</td><td>${event.spindle.toLocaleString()}</td>
      <td><span class="tag ${event.open ? "open" : "cleared"}">${event.open ? "Open" : "Cleared"}</span></td><td>${event.latency} ms</td></tr>`).join("")
    : '<tr><td colspan="5">No downtime events in the current window.</td></tr>';
}

function drawTrend() {
  const context = chart.getContext("2d");
  const ratio = window.devicePixelRatio || 1;
  const bounds = chart.getBoundingClientRect();
  chart.width = bounds.width * ratio;
  chart.height = bounds.height * ratio;
  context.scale(ratio, ratio);
  const width = bounds.width;
  const height = bounds.height;
  const padding = { top: 14, right: 14, bottom: 28, left: 31 };
  const plotWidth = width - padding.left - padding.right;
  const plotHeight = height - padding.top - padding.bottom;
  const maxValue = Math.max(3, ...state.trend);
  context.strokeStyle = "#e6edef";
  context.lineWidth = 1;
  context.fillStyle = "#637482";
  context.font = "11px Segoe UI";
  for (let i = 0; i <= maxValue; i += 1) {
    const y = padding.top + plotHeight - (i / maxValue) * plotHeight;
    context.beginPath(); context.moveTo(padding.left, y); context.lineTo(width - padding.right, y); context.stroke(); context.fillText(String(i), 12, y + 4);
  }
  context.beginPath();
  state.trend.forEach((value, index) => {
    const x = padding.left + (index / Math.max(1, state.trend.length - 1)) * plotWidth;
    const y = padding.top + plotHeight - (value / maxValue) * plotHeight;
    if (index === 0) context.moveTo(x, y); else context.lineTo(x, y);
  });
  context.strokeStyle = "#1769aa"; context.lineWidth = 2; context.stroke();
}

function renderMetrics() {
  const active = state.events.filter((event) => event.open).length;
  const latencies = state.events.map((event) => event.latency).sort((a, b) => a - b);
  const median = latencies.length ? latencies[Math.floor(latencies.length / 2)] : null;
  const availability = ((TOTAL_SPINDLES - active) / TOTAL_SPINDLES) * 100;
  alarmValue.textContent = String(active);
  alarmDetail.textContent = active ? `${active} break events unresolved` : "No open breaks";
  alarmDetail.className = active ? "detail" : "detail healthy";
  latencyValue.textContent = median === null ? "-- ms" : `${median} ms`;
  availabilityValue.textContent = `${availability.toFixed(2)}%`;
  downtimeDetail.textContent = `${state.downtimeMinutes.toFixed(1)} spindle-min downtime`;
}

function render() { renderMetrics(); renderNodes(); renderEvents(); drawTrend(); }
document.querySelector("#pauseButton").addEventListener("click", () => { state.paused = !state.paused; document.querySelector("#pauseIcon").textContent = state.paused ? "\u25b6" : "||"; document.querySelector("#pauseButton").title = state.paused ? "Resume event stream" : "Pause event stream"; });
document.querySelector("#resetButton").addEventListener("click", () => { state.nodes.forEach((node) => { node.alarms = 0; }); state.events = []; state.trend = Array.from({ length: Number(document.querySelector("#windowSelector").value) }, () => 0); state.downtimeMinutes = 0; render(); });
document.querySelector("#windowSelector").addEventListener("change", (event) => { const length = Number(event.target.value); state.trend = [...Array.from({ length }, () => 0), ...state.trend].slice(-length); render(); });
document.querySelector("#alertsOnly").addEventListener("change", renderEvents);
window.addEventListener("resize", drawTrend);
render();
setInterval(step, 1000);
