import { adapters } from "./core/adapters";
import { runJob, setModuleEnabled, swapAdapter } from "./core/hierarchy";
import { moduleRegistry } from "./core/registry";
import type { AdapterId } from "./core/types";
import { demoInputs, demoJob, samplePath } from "./demo/sample-path";
import { buildViewModel, type ModuleView, type OpsViewModel } from "./view";

let job = demoJob;

const app = document.querySelector("#app");
if (!app) throw new Error("Missing #app");

const root = app;

function render(): void {
  const runs = runJob(job, demoInputs, moduleRegistry);
  paint(root, buildViewModel(samplePath, job, demoInputs, runs));
}

function paint(host: Element, view: OpsViewModel): void {
  host.replaceChildren();
  host.append(
    el("h1", "Wonder & Workflow modular ops kit"),
    el("p", "One path. One job object. Modules turn on, turn off, or swap adapters later."),
    el("h2", `Path: ${view.pathName}`),
    el("h2", `Job: ${view.jobTitle}`),
  );
  for (const module of view.modules) host.append(moduleCard(module));
}

function moduleCard(module: ModuleView): HTMLElement {
  const card = el("article", "");
  card.append(
    el("h3", module.name),
    el("p", module.oneLiner),
    controls(module),
    el("p", `Status: ${module.status}${module.note ? ` — ${module.note}` : ""}`),
    el("h4", "Input"),
    el("pre", module.inputText),
    el("h4", "Decision"),
    el("pre", module.decisionText),
    el("h4", "Output"),
    el("pre", module.outputText),
  );
  return card;
}

function controls(module: ModuleView): HTMLElement {
  const row = el("div", "");
  const enabled = document.createElement("label");
  const checkbox = document.createElement("input");
  checkbox.type = "checkbox";
  checkbox.checked = module.enabled;
  checkbox.addEventListener("change", () => {
    job = setModuleEnabled(job, module.id, checkbox.checked);
    render();
  });
  enabled.append(checkbox, document.createTextNode(" Enabled"));

  const adapterLabel = document.createElement("label");
  adapterLabel.append(document.createTextNode(" Adapter "));
  const select = document.createElement("select");
  for (const adapter of Object.values(adapters)) {
    const option = document.createElement("option");
    option.value = adapter.id;
    option.textContent = adapter.label;
    option.selected = adapter.id === module.adapterId;
    select.append(option);
  }
  select.addEventListener("change", () => {
    job = swapAdapter(job, module.id, select.value as AdapterId);
    render();
  });
  adapterLabel.append(select);
  row.append(enabled, adapterLabel);
  return row;
}

function el(tag: "h1" | "h2" | "h3" | "h4" | "p" | "pre" | "article" | "div", text: string): HTMLElement {
  const node = document.createElement(tag);
  if (text) node.textContent = text;
  return node;
}

render();
