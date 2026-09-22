import { adapters } from "./core/adapters";
import { runJob, setModuleEnabled, swapAdapter } from "./core/hierarchy";
import { moduleRegistry } from "./core/registry";
import type { AdapterId, ModuleId } from "./core/types";
import { demoInputs, demoJob, samplePath } from "./demo/sample-path";
import {
  buildViewModel,
  type FilmBoard,
  type LeakBoard,
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
  for (const module of modules) {
    const button = el("button", module.enabled ? "rail-item" : "rail-item is-off", "");
    button.type = "button";
    if (module.id === selectedId) button.setAttribute("aria-current", "true");
    button.addEventListener("click", () => {
      selectedId = module.id;
      advancedOpen = false;
      render();
    });
    const dot = el("span", module.enabled ? "dot is-on" : "dot is-off", "");
    dot.setAttribute("aria-hidden", "true");
    button.append(dot, el("span", "rail-name", module.name));
    nav.append(button);
  }
  return nav;
}

function board(module: ModuleView | undefined): HTMLElement {
  const pane = el("section", "board");
  if (!module) return pane;
  pane.append(el("h2", "", module.name), el("p", "one-liner", module.oneLiner));
  pane.append(surface(module.board));
  pane.append(advanced(module));
  return pane;
}

function surface(boardState: OperatorBoard): HTMLElement {
  if (boardState.kind === "leak-ranker") return leakSurface(boardState);
  if (boardState.kind === "job-film") return filmSurface(boardState);
  if (boardState.kind === "proof-gate") return proofSurface(boardState);
  if (boardState.kind === "exception-hour") return sweepSurface(boardState);
  return el("p", "status-note", boardState.message);
}

function leakSurface(boardState: LeakBoard): HTMLElement {
  const wrap = el("div", "surface");
  const table = el("table", "rank-table");
  const head = document.createElement("thead");
  const headRow = document.createElement("tr");
  for (const label of ["Rank", "Type", "Miss", "Cost"]) {
    const cell = el("th", label === "Cost" ? "num" : "", label);
    cell.scope = "col";
    headRow.append(cell);
  }
  head.append(headRow);
  const bodyRows = document.createElement("tbody");
  for (const row of boardState.rows) {
    const tr = document.createElement("tr");
    tr.append(
      el("td", "num", row.rank),
      el("td", "", row.kind),
      el("td", "", row.note),
      el("td", "num", row.cost),
    );
    bodyRows.append(tr);
  }
  table.append(head, bodyRows);
  wrap.append(table);
  if (boardState.fixFirst) {
    const callout = el("aside", "callout");
    callout.append(
      el("p", "callout-label", "Fix first"),
      el("p", "callout-value", boardState.fixFirst),
      el("p", "callout-reason", boardState.reason),
    );
    wrap.append(callout);
  } else {
    wrap.append(el("p", "status-note", boardState.reason));
  }
  return wrap;
}

function filmSurface(boardState: FilmBoard): HTMLElement {
  const list = el("ol", "steps");
  for (const step of boardState.steps) {
    const item = el("li", `step is-${step.tone}`);
    item.append(el("span", "step-order", step.order));
    const copy = el("div", "step-copy");
    copy.append(
      el("p", "step-label", step.label),
      el("p", "step-meta", `${step.accountable} · ${step.authority} · ${step.status}`),
    );
    item.append(copy);
    list.append(item);
  }
  const wrap = el("div", "surface");
  wrap.append(list);
  for (const problem of boardState.problems) wrap.append(el("p", "status-note", problem));
  return wrap;
}

function proofSurface(boardState: ProofBoard): HTMLElement {
  const wrap = el("div", "surface");
  const verdict = el(
    "p",
    `verdict is-${boardState.verdict}`,
    boardState.verdict === "pass" ? "Pass" : "Hold",
  );
  wrap.append(verdict, el("p", "gate-reason", boardState.reason), el("p", "handoff", boardState.handoff));
  const list = el("ul", "proofs");
  for (const proof of boardState.proofs) {
    const item = el("li", "proof");
    item.append(el("span", "proof-label", proof.label), el("span", "proof-detail", proof.detail));
    list.append(item);
  }
  wrap.append(list);
  return wrap;
}

function sweepSurface(boardState: SweepBoard): HTMLElement {
  const wrap = el("div", "surface");
  if (boardState.clear) {
    wrap.append(el("p", "empty", "No exceptions. Sweep clear."));
    return wrap;
  }
  const list = el("ul", "exceptions");
  for (const item of boardState.assignments) {
    const row = el("li", "exception");
    row.append(el("p", "exception-summary", item.summary), el("p", "exception-action", item.nextAction));
    list.append(row);
  }
  wrap.append(list);
  if (boardState.deferred.length) {
    const deferred = el("div", "deferred");
    deferred.append(el("p", "deferred-label", "Deferred"));
    const items = el("ul", "exceptions");
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

  const enabled = document.createElement("label");
  const checkbox = document.createElement("input");
  checkbox.type = "checkbox";
  checkbox.checked = module.enabled;
  checkbox.addEventListener("change", () => {
    advancedOpen = true;
    job = setModuleEnabled(job, module.id, checkbox.checked);
    render();
  });
  enabled.append(checkbox, document.createTextNode(" Enabled"));

  const adapterLabel = document.createElement("label");
  adapterLabel.append(document.createTextNode("Adapter "));
  const select = document.createElement("select");
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
