# Wonder & Workflow modular ops kit

Fit Review stub for a single operations kit. This is not multi-tenant SaaS.

Eventual home is [hopattic-afk/wonder-workflow-ops](https://github.com/hopattic-afk/wonder-workflow-ops) once that repo can accept writes. A public URL comes later via Netlify when deploy is unlocked. This folder does not deploy.

## Hierarchy

```text
path
  └── job object
        └── modules (enable / disable, adapter swap later)
```

The path holds jobs. Each job lists its modules in order. Turning a module off, or pointing it at a different adapter, does not rewrite the path or the other modules.

The web core is this folder. Google Sheets and GoHighLevel are stub interfaces in `src/core/adapters.ts`. Only the in-memory adapter runs.

## Modules

1. **Leak Ranker (The Plug)** — takes a short log of misses (calls, quotes, handoffs, waits) and ranks which leak costs the most so you fix that one first.
2. **Job Film / Authority Ladder** — shows one live job as a step sequence, with one accountable name per step and who can decide alone versus who must check up.
3. **Proof Gate** — stops a handoff until the required proof is on the record, or marks Hold with a reason. No proof, no pass.
4. **Exception Hour (Daily Sweep)** — a short fixed review that only looks at exceptions, assigns one next action each, and ends on time. Cadence is daily.

Each module is input → decision → output. The demo path `Fit Review field path` carries one job, `Oak Street kitchen`, with all four modules on.

## Run locally

From this folder, with Node.js and npm:

```bash
npm install
npm test
npm run dev
```

Open `http://127.0.0.1:5174`.

`npm run build` typechecks and writes `dist/`. Do not deploy that output from this repo.
