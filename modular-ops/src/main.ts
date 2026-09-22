import { adapters } from "./core/adapters";
import { runJob, setModuleEnabled, swapAdapter } from "./core/hierarchy";
import { moduleRegistry } from "./core/registry";
import type { AdapterId, ModuleId } from "./core/types";
import { demoInputs, demoJob, samplePath } from "./demo/sample-path";
import {
  buildViewModel,
  type FilmBoard,
  type LeakBoard,
  type LeakBoardRow,
  type LeakCaptureRow,
  type ModuleView,
  type OperatorBoard,
  type OpsViewModel,
  type ProofBoard,
  type SweepBoard,
} from "./view";

let job = demoJob;
let selectedId: ModuleId = "leak-ranker";
let advancedOpen = false;

const app = document.querySelector("#app");
if (!app) throw new Error("Missing #app");

const root = app;

function render(): void {
  const runs = runJob(job, demoInputs, moduleRegistry);
  paint(root, buildViewModel(samplePath, job, demoInputs, runs));
}

function paint(host: Element, view: OpsViewModel): void {
  const active = view.modules.find((module) => module.id === selectedId) ?? view.modules[0];
  if (active) selectedId = active.id;

  host.replaceChildren();
  const desk = el("div", "desk");
  desk.append(header(view), body(view, active));
  host.append(desk);
}

function header(view: OpsViewModel): HTMLElement {
  const bar = el("header", "desk-header");
  bar.append(el("p", "wordmark", "Wonder & Workflow"));
  const context = el("div", "desk-context");
  context.append(el("h1", "", view.pathName), el("p", "job-name", view.jobTitle));
  bar.append(context);
  return bar;
}

function body(view: OpsViewModel, active: ModuleView | undefined): HTMLElement {
  const wrap = el("div", "desk-body");
  wrap.append(rail(view.modules), board(active));
  return wrap;
}

function rail(modules: ModuleView[]): HTMLElement {
  const nav = el("nav", "rail");
  nav.setAttribute("aria-label", "Modules");
  nav.append(el("p", "rail-kicker", "Modules"));
  for (const module of modules) {
    const button = el("button", module.enabled ? "rail-item" : "rail-item is-off", "");
    button.type = "button";
    if (module.id === selectedId) button.setAttribute("aria-current", "page");
    button.addEventListener("click", () => {
      selectedId = module.id;
      advancedOpen = false;
      render();
    });
    const dot = el("span", module.enabled ? "dot is-on" : "dot is-off", "");
    dot.setAttribute("aria-hidden", "true");
    const copy = el("span", "rail-copy");
    copy.append(
      el("span", "rail-name", module.name),
      el("span", "rail-state", module.enabled ? "On" : "Off"),
    );
    button.append(dot, copy);
    nav.append(button);
  }
  return nav;
}

function board(module: ModuleView | undefined): HTMLElement {
  const pane = el("section", "board");
  if (!module) return pane;
  if (module.board.kind === "leak-ranker") pane.append(leakTool(module, module.board));
  else pane.append(boardHead(module), surface(module.board));
  pane.append(advanced(module));
  return pane;
}

function boardHead(module: ModuleView): HTMLElement {
  const head = el("header", "board-head");
  const copy = el("div", "board-copy");
  copy.append(el("h2", "", module.name), el("p", "one-liner", module.oneLiner));
  head.append(copy);
  return head;
}

function surface(boardState: Exclude<OperatorBoard, LeakBoard>): HTMLElement {
  if (boardState.kind === "job-film") return filmSurface(boardState);
  if (boardState.kind === "proof-gate") return proofSurface(boardState);
  if (boardState.kind === "exception-hour") return sweepSurface(boardState);
  return el("p", "status-note", boardState.message);
}

function leakTool(module: ModuleView, boardState: LeakBoard): HTMLElement {
  const tool = el("article", "tool");
  const head = el("header", "tool-head");
  const copy = el("div", "board-copy");
  copy.append(el("h2", "", module.name), el("p", "one-liner", module.oneLiner));
  head.append(copy);
  tool.append(head);

  tool.append(stage("1", "Capture", captureTable(boardState.capture)));
  tool.append(stage("2", "Rank", rankTable(boardState)));
  tool.append(stage("3", "Commit", commitBlock(boardState)));
  return tool;
}

function stage(index: string, name: string, bodyNode: HTMLElement): HTMLElement {
  const section = el("section", "stage");
  const head = el("div", "stage-head");
  head.append(el("span", "stage-index", index), el("h3", "stage-name", name));
  section.append(head, bodyNode);
  return section;
}

function captureTable(rows: LeakCaptureRow[]): HTMLElement {
  const body = el("div", "stage-body");
  if (rows.length === 0) {
    body.append(el("p", "empty", "No misses in the log."));
    return body;
  }
  const table = el("table", "rank-table");
  table.append(tableHead(["Type", "Miss", "Cost"]));
  const bodyRows = document.createElement("tbody");
  for (const row of rows) {
    const tr = document.createElement("tr");
    tr.append(el("td", "", row.kind), el("td", "", row.note), el("td", "num", row.cost));
    bodyRows.append(tr);
  }
  table.append(bodyRows);
  body.append(table);
  return body;
}

function rankTable(boardState: LeakBoard): HTMLElement {
  const body = el("div", "stage-body");
  if (boardState.rows.length === 0) {
    body.append(el("p", "empty", boardState.reason));
    return body;
  }
  const table = el("table", "rank-table");
  table.append(tableHead(["Rank", "Type", "Miss", "Cost"]));
  const bodyRows = document.createElement("tbody");
  for (const row of boardState.rows) bodyRows.append(rankRow(row, row.rank === "1" && Boolean(boardState.fixFirst)));
  table.append(bodyRows);
  body.append(table);
  return body;
}

function rankRow(row: LeakBoardRow, lead: boolean): HTMLTableRowElement {
  const tr = document.createElement("tr");
  if (lead) tr.className = "is-fix";
  const rankCell = el("td", "rank-cell", "");
  rankCell.append(el("span", "", row.rank));
  if (lead) rankCell.append(chip("Fix first", "accent"));
  tr.append(rankCell, el("td", "", row.kind), el("td", "", row.note), el("td", "num", row.cost));
  return tr;
}

function commitBlock(boardState: LeakBoard): HTMLElement {
  const body = el("div", "stage-body commit");
  if (!boardState.fixNote || !boardState.fixCost) {
    body.append(el("p", "commit-reason", boardState.reason));
    return body;
  }
  body.append(chip("Fix first", "accent"));
  const line = el("div", "commit-line");
  line.append(el("p", "commit-title", boardState.fixNote), el("p", "commit-cost", boardState.fixCost));
  body.append(line, el("p", "commit-reason", boardState.reason));
  return body;
}

function filmSurface(boardState: FilmBoard): HTMLElement {
  const list = el("ol", "steps sheet");
  for (const step of boardState.steps) {
    const item = el("li", `step is-${step.tone}`);
    const copy = el("div", "step-copy");
    copy.append(
      el("p", "step-label", step.label),
      el("p", "step-meta", `${step.accountable} · ${step.authority}`),
    );
    item.append(el("span", "step-order", step.order), copy, chip(step.status, step.tone === "current" ? "accent" : "quiet"));
    list.append(item);
  }
  const wrap = el("div", "surface");
  wrap.append(list);
  for (const problem of boardState.problems) wrap.append(el("p", "status-note", problem));
  return wrap;
}

function proofSurface(boardState: ProofBoard): HTMLElement {
  const wrap = el("div", "surface");
  const bar = el("div", "gate-bar");
  bar.append(
    chip(boardState.verdict === "pass" ? "Pass" : "Hold", boardState.verdict === "pass" ? "accent" : "ink"),
    el("p", "gate-reason", boardState.reason),
    el("p", "handoff", boardState.handoff),
  );
  const list = el("ul", "proofs sheet");
  for (const proof of boardState.proofs) {
    const item = el("li", "proof");
    const missingRequired = proof.record === "missing" && proof.requirement === "required";
    item.append(
      el("span", "proof-label", proof.label),
      el("span", "proof-req", proof.requirement),
      chip(proof.record, missingRequired ? "accent" : "quiet"),
    );
    list.append(item);
  }
  wrap.append(bar, list);
  return wrap;
}

function sweepSurface(boardState: SweepBoard): HTMLElement {
  const wrap = el("div", "surface");
  if (boardState.clear) {
    wrap.append(el("p", "empty", "No exceptions. Sweep clear."));
    return wrap;
  }
  const list = el("ul", "exceptions sheet");
  for (const item of boardState.assignments) {
    const row = el("li", "exception");
    row.append(el("p", "exception-summary", item.summary), el("p", "exception-action", item.nextAction));
    list.append(row);
  }
  wrap.append(list);
  if (boardState.deferred.length) {
    const deferred = el("div", "deferred");
    deferred.append(chip("Deferred", "quiet"));
    const items = el("ul", "exceptions sheet");
    for (const item of boardState.deferred) {
      const row = el("li", "exception");
      row.append(el("p", "exception-summary", item.summary), el("p", "exception-action", item.reason));
      items.append(row);
    }
    deferred.append(items);
    wrap.append(deferred);
  }
  wrap.append(el("p", "status-note", boardState.closing));
  return wrap;
}

function advanced(module: ModuleView): HTMLElement {
  const details = el("details", "advanced");
  if (advancedOpen) details.open = true;
  details.addEventListener("toggle", () => {
    advancedOpen = details.open;
  });
  details.append(el("summary", "", "Advanced"));
  const row = el("div", "advanced-row");

  const enabled = el("label", "switch");
  const checkbox = document.createElement("input");
  checkbox.type = "checkbox";
  checkbox.checked = module.enabled;
  checkbox.addEventListener("change", () => {
    advancedOpen = true;
    job = setModuleEnabled(job, module.id, checkbox.checked);
    render();
  });
  const track = el("span", "switch-track", "");
  track.setAttribute("aria-hidden", "true");
  enabled.append(checkbox, track, el("span", "", "Enabled"));

  const adapterLabel = el("label", "field");
  adapterLabel.append(el("span", "", "Adapter"));
  const select = document.createElement("select");
  select.className = "control-select";
  select.setAttribute("aria-label", "Adapter");
  for (const adapter of Object.values(adapters)) {
    const option = document.createElement("option");
    option.value = adapter.id;
    option.textContent = adapter.label;
    option.selected = adapter.id === module.adapterId;
    select.append(option);
  }
  select.addEventListener("change", () => {
    advancedOpen = true;
    job = swapAdapter(job, module.id, select.value as AdapterId);
    render();
  });
  adapterLabel.append(select);
  row.append(enabled, adapterLabel);
  details.append(row);
  return details;
}

function chip(text: string, tone: "accent" | "ink" | "quiet"): HTMLElement {
  return el("span", `chip is-${tone}`, text);
}

function tableHead(labels: string[]): HTMLElement {
  const head = document.createElement("thead");
  const headRow = document.createElement("tr");
  labels.forEach((label, index) => {
    const cell = el("th", index === labels.length - 1 ? "num" : "", label);
    cell.scope = "col";
    headRow.append(cell);
  });
  head.append(headRow);
  return head;
}

function el<K extends keyof HTMLElementTagNameMap>(
  tag: K,
  className: string,
  text?: string,
): HTMLElementTagNameMap[K] {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text) node.textContent = text;
  return node;
}

render();
