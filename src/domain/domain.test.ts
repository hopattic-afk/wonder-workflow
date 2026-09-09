import { describe, expect, it } from "vitest";
import { calculate, money, pilotFit, riskWarnings } from "./calculations";
import {
  defaultSettings,
  demoSession,
  newLabor,
  newRecurring,
  newRework,
  newSession,
  newSoftware,
  newStep,
} from "./defaults";
import {
  generateProposal,
  generateRecommendation,
  proposalSourceFingerprint,
  proposalUsesStaleRecommendation,
  sourceFingerprint,
} from "./documents";
import {
  exportStore,
  loadStore,
  parseImport,
  saveStore,
  STORAGE_KEY,
} from "./storage";
import { sessionSchema, settingsSchema, storeSchema } from "./validation";
import type { Store } from "./types";

const makeStore = (): Store => ({
  version: 1,
  sessions: [newSession()],
  settings: defaultSettings(),
  lastSaved: null,
  lastExport: null,
});
const example = () => {
  const s = demoSession();
  s.calculator.price = 3000;
  s.worksheet.decision = "Proceed with AI pilot";
  return s;
};
const memoryStorage = () => {
  const data = new Map<string, string>();
  return {
    getItem: (key: string) => data.get(key) ?? null,
    setItem: (key: string, value: string) => {
      data.set(key, value);
    },
  };
};

describe("financial estimates", () => {
  it("matches every value in the required worked example", () => {
    expect(calculate(example())).toMatchObject({
      currentHours: 10,
      currentLabor: 15000,
      weeklyHours: 5,
      annualHours: 250,
      labor: 7500,
      currentSoftware: 3600,
      futureSoftware: 1200,
      subscriptions: 2400,
      rework: 2400,
      avoidedHire: 0,
      recurring: 1200,
      gross: 12300,
      net: 11100,
      finalPrice: 3000,
      firstYear: 8100,
      roi: 270,
      multiple: 3.7,
      incomplete: false,
    });
    expect(calculate(example()).payback).toBeCloseTo(3.243243);
  });
  it("adds multiple rows and editable working weeks", () => {
    const s = example();
    s.calculator.weeks = 40;
    s.calculator.labor.push({
      ...newLabor(),
      hours: 5,
      rate: 40,
      reduction: 25,
    });
    s.calculator.rework.push({
      ...newRework(),
      incidents: 2,
      cost: 50,
      reduction: 100,
    });
    s.calculator.recurring.push({
      ...newRecurring(),
      monthly: 10,
      annual: 500,
    });
    expect(calculate(s)).toMatchObject({
      currentHours: 15,
      weeklyHours: 6.25,
      annualHours: 250,
      currentLabor: 20000,
      labor: 8000,
      rework: 3600,
      recurring: 1820,
    });
  });
  it("does not invent an all-empty case or price", () => {
    expect(calculate(newSession())).toMatchObject({
      gross: null,
      net: null,
      finalPrice: null,
      firstYear: null,
      payback: null,
      roi: null,
      multiple: null,
      incomplete: true,
    });
  });
  it.each(["hours", "rate", "reduction"] as const)(
    "propagates missing labor %s and never drops an incomplete row",
    (key) => {
      const s = example();
      s.calculator.labor.push({
        ...newLabor(),
        hours: 1,
        rate: 20,
        reduction: 50,
        [key]: null,
      });
      expect(calculate(s)).toMatchObject({
        labor: null,
        gross: null,
        net: null,
        incomplete: true,
      });
    },
  );
  it.each(["currentMonthly", "futureMonthly"] as const)(
    "propagates missing software %s",
    (key) => {
      const s = example();
      s.software[0][key] = null;
      expect(calculate(s).subscriptions).toBeNull();
      expect(calculate(s).net).toBeNull();
    },
  );
  it.each(["incidents", "cost", "reduction"] as const)(
    "propagates missing rework %s",
    (key) => {
      const s = example();
      s.calculator.rework[0][key] = null;
      expect(calculate(s).gross).toBeNull();
    },
  );
  it.each(["monthly", "annual"] as const)(
    "requires explicit recurring %s including zero",
    (key) => {
      const s = example();
      s.calculator.recurring[0][key] = null;
      expect(calculate(s)).toMatchObject({
        recurring: null,
        gross: 12300,
        net: null,
        incomplete: true,
      });
    },
  );
  it("excludes avoided hire by default and requires complete assumptions when included", () => {
    const s = example();
    Object.assign(s.calculator.avoidedHire, {
      annualCost: 60000,
      percentage: 50,
    });
    expect(calculate(s).gross).toBe(12300);
    s.calculator.avoidedHire.include = true;
    expect(calculate(s)).toMatchObject({ avoidedHire: 30000, gross: 42300 });
    s.calculator.avoidedHire.percentage = null;
    expect(calculate(s).gross).toBeNull();
  });
  it("floors subscription savings per row and warns on increases", () => {
    const s = example();
    s.software.push({
      ...newSoftware(),
      currentMonthly: 10,
      futureMonthly: 100,
    });
    expect(calculate(s).subscriptions).toBe(2400);
    expect(calculate(s).warnings.join(" ")).toContain(
      "Include the increase in new recurring costs",
    );
  });
  it("keeps recurring savings known when implementation price is absent", () => {
    const s = example();
    s.calculator.price = null;
    expect(calculate(s)).toMatchObject({
      net: 11100,
      firstYear: null,
      payback: null,
      roi: null,
      multiple: null,
    });
  });
  it("subtracts an optional discount and rejects an excessive discount", () => {
    const s = example();
    s.calculator.discount = 500;
    expect(calculate(s).finalPrice).toBe(2500);
    s.calculator.discount = 4000;
    expect(calculate(s).finalPrice).toBeNull();
    expect(calculate(s).warnings.join(" ")).toContain("Discount cannot exceed");
  });
  it("handles zero project price without infinite ROI or multiple", () => {
    const s = example();
    s.calculator.price = 0;
    expect(calculate(s)).toMatchObject({
      firstYear: 11100,
      payback: 0,
      roi: null,
      multiple: null,
    });
  });
  it.each([12300, 13000])(
    "handles nonpositive net savings with recurring cost %s",
    (annual) => {
      const s = example();
      s.calculator.recurring = [{ ...newRecurring(), monthly: 0, annual }];
      const c = calculate(s);
      expect(c.net).toBe(12300 - annual);
      expect(c.payback).toBeNull();
      expect(c.roi).toBeLessThanOrEqual(-100);
      expect(c.warnings).toContain(
        "Financial payback cannot currently be demonstrated.",
      );
      expect(c.warnings).toContain(
        "The current assumptions do not yet support a 3× first-year value case.",
      );
    },
  );
  it("shows 3× warning only below the threshold", () => {
    const s = example();
    s.calculator.price = 3700;
    expect(calculate(s).multiple).toBe(3);
    expect(calculate(s).warnings.join(" ")).not.toContain("3×");
    s.calculator.price = 4000;
    expect(calculate(s).warnings.join(" ")).toContain("3×");
  });
  it("rejects invalid percentages and nonfinite values defensively", () => {
    const s = example();
    s.calculator.labor[0].reduction = 150;
    expect(calculate(s).labor).toBeNull();
    s.calculator.labor[0].reduction = 50;
    s.calculator.labor[0].rate = Infinity;
    expect(calculate(s).labor).toBeNull();
  });
  it("formats USD, CAD, negatives, zero and missing values", () => {
    expect(money(1234.5, "USD")).toMatch(/USD.*1,234\.50/);
    expect(money(1234.5, "CAD")).toMatch(/CAD.*1,234\.50/);
    expect(money(-100, "USD")).toContain("-");
    expect(money(0, "USD")).toContain("0.00");
    expect(money(null, "CAD")).toBe("Not established");
    expect(money(NaN, "USD")).toBe("Not established");
  });
});

describe("new audits, backup and restore", () => {
  it("creates independent blank audits and clearly fictional demo with no default price", () => {
    const a = newSession();
    const b = newSession();
    expect(a.id).not.toBe(b.id);
    expect(a.client.currency).toBe("USD");
    expect(a.calculator.weeks).toBe(50);
    expect(a.calculator.price).toBeNull();
    expect(demoSession().calculator.price).toBeNull();
    expect(demoSession().client.business).toContain("Demo Data");
    expect(a.proposal.caseStudy).toBe("");
    expect(sessionSchema.safeParse(a).success).toBe(true);
    expect(sessionSchema.safeParse(demoSession()).success).toBe(true);
  });
  it("uses CAD settings and validates optional assessment query inputs", () => {
    const s = newSession(
      { ...defaultSettings(), currency: "CAD", weeks: 48 },
      new URLSearchParams(
        "business=Example&contact=Sam&email=sam%40example.test&score=21&tier=High-Impact+Opportunity&priority=Reports",
      ),
    );
    expect(s.client).toMatchObject({
      business: "Example",
      contact: "Sam",
      email: "sam@example.test",
      score: 21,
      tier: "High-Impact Opportunity",
      priority: "Reports",
      currency: "CAD",
    });
    expect(s.calculator.weeks).toBe(48);
    const invalid = newSession(
      undefined,
      new URLSearchParams("score=999&tier=Fake&email=bad"),
    );
    expect(invalid.client).toMatchObject({ score: null, tier: "", email: "" });
  });
  it("roundtrips JSON exactly and restores saved local data", () => {
    const store = makeStore();
    const storage = memoryStorage();
    expect(loadStore(storage)).toBeNull();
    expect(parseImport(exportStore(store))).toEqual(store);
    saveStore(store, storage);
    expect(loadStore(storage)).toEqual(store);
    store.sessions[0].callNotes = "Restored notes";
    saveStore(store, storage);
    expect(loadStore(storage)?.sessions[0].callNotes).toBe("Restored notes");
  });
  it("accepts whole assessment scores through 21 and rejects scores outside the range", () => {
    for (const score of [0, 18, 19, 20, 21]) {
      const store = makeStore();
      store.sessions[0].client.score = score;
      expect(parseImport(exportStore(store)).sessions[0].client.score).toBe(
        score,
      );
      expect(
        newSession(undefined, new URLSearchParams(`score=${score}`)).client
          .score,
      ).toBe(score);
    }
    for (const score of [-1, 21.5, 22]) {
      const session = newSession();
      session.client.score = score;
      expect(sessionSchema.safeParse(session).success).toBe(false);
      expect(
        newSession(undefined, new URLSearchParams(`score=${score}`)).client
          .score,
      ).toBeNull();
    }
  });
  it("upgrades only the original accent preset without changing saved audits or custom colors", () => {
    const store = makeStore();
    store.settings.accent = "#d4af37";
    store.sessions[0].client.score = 18;
    const storage = memoryStorage();
    saveStore(store, storage);
    expect(loadStore(storage)).toEqual({
      ...store,
      settings: { ...store.settings, accent: "#C29A60" },
    });
    store.settings.accent = "#AABBCC";
    expect(parseImport(exportStore(store))).toEqual(store);
  });
  it("persists session deletion without reseeding data", () => {
    const store = makeStore();
    const storage = memoryStorage();
    saveStore(store, storage);
    store.sessions = [];
    saveStore(store, storage);
    expect(loadStore(storage)?.sessions).toEqual([]);
  });
  it.each(["invalid", "null", "{}", '{"version":2}', "[]"])(
    "rejects malformed or incomplete import %s",
    (value) => {
      expect(() => parseImport(value)).toThrow();
    },
  );
  it("rejects unknown fields, duplicate session/row IDs, and future versions", () => {
    const store = makeStore();
    expect(() =>
      parseImport(JSON.stringify({ ...store, injected: true })),
    ).toThrow();
    store.sessions.push(store.sessions[0]);
    expect(() => exportStore(store)).toThrow();
    store.sessions.pop();
    const step = newStep();
    store.sessions[0].steps = [step, step];
    expect(() => exportStore(store)).toThrow();
    expect(storeSchema.safeParse({ ...makeStore(), version: 2 }).success).toBe(
      false,
    );
  });
  it("preserves prior storage on invalid save and surfaces corrupt storage", () => {
    const storage = memoryStorage();
    const store = makeStore();
    saveStore(store, storage);
    const original = storage.getItem(STORAGE_KEY);
    store.sessions[0].calculator.labor = [{ ...newLabor(), hours: -1 }];
    expect(() => saveStore(store, storage)).toThrow();
    expect(storage.getItem(STORAGE_KEY)).toBe(original);
    storage.setItem(STORAGE_KEY, "{broken");
    expect(() => loadStore(storage)).toThrow("Invalid JSON");
  });
  it("surfaces unavailable storage and quota failure to the caller", () => {
    const unavailable = {
      getItem: () => {
        throw new Error("Blocked");
      },
      setItem: () => {
        throw new Error("Quota exceeded");
      },
    };
    expect(() => loadStore(unavailable)).toThrow("Blocked");
    expect(() => saveStore(makeStore(), unavailable)).toThrow("Quota exceeded");
  });
  it("rejects invalid numeric, dates, large collections and unsafe logo data", () => {
    const s = newSession();
    s.client.score = 22;
    expect(sessionSchema.safeParse(s).success).toBe(false);
    s.client.score = null;
    s.client.auditDate = "2026-02-30";
    expect(sessionSchema.safeParse(s).success).toBe(false);
    s.client.auditDate = "";
    s.steps = Array.from({ length: 201 }, newStep);
    expect(sessionSchema.safeParse(s).success).toBe(false);
    expect(
      settingsSchema.safeParse({
        ...defaultSettings(),
        logo: "data:image/svg+xml;base64,PHN2Zz4=",
      }).success,
    ).toBe(false);
    expect(
      settingsSchema.safeParse({
        ...defaultSettings(),
        logo: "https://example.test/logo.png",
      }).success,
    ).toBe(false);
    expect(
      settingsSchema.safeParse({
        ...defaultSettings(),
        logo: "data:image/png;base64,aGVsbG8=",
      }).success,
    ).toBe(true);
    expect(() => parseImport(" ".repeat(25_000_001))).toThrow("too large");
  });
});

describe("pilot-fit and independent risk controls", () => {
  it("maps complete ratings to full 0–100 range and reverses risk", () => {
    const s = newSession();
    expect(pilotFit(s).score).toBeNull();
    s.worksheet.fit = [5, 5, 5, 5, 5, 5, 5, 5, 5, 1];
    expect(pilotFit(s)).toEqual({
      score: 100,
      label: "Strong Pilot Candidate",
    });
    s.worksheet.fit = [1, 1, 1, 1, 1, 1, 1, 1, 1, 5];
    expect(pilotFit(s)).toEqual({ score: 0, label: "Weak Initial Pilot" });
    s.worksheet.fit = Array(10).fill(3);
    expect(pilotFit(s)).toEqual({
      score: 50,
      label: "Requires Additional Scoping",
    });
  });
  it("retains hard stops even with a perfect score", () => {
    const s = newSession();
    s.worksheet.fit = [5, 5, 5, 5, 5, 5, 5, 5, 5, 1];
    s.worksheet.riskAreas = ["Financial decisions"];
    s.worksheet.autonomous = "Yes";
    expect(pilotFit(s).score).toBe(100);
    expect(
      riskWarnings(s)
        .filter((v) => v.hardStop)
        .map((v) => v.code),
    ).toEqual(
      expect.arrayContaining([
        "autonomous-high-risk",
        "no-reviewer",
        "data-rights",
        "consequential",
      ]),
    );
  });
  it("flags marketing referrals, baseline, inconsistency and unknown integrations", () => {
    const s = newSession();
    s.worksheet.classifications = [
      "Marketing or lead generation — refer to Justin",
    ];
    s.worksheet.fit[0] = 1;
    s.software.push(newSoftware());
    const warnings = riskWarnings(s);
    expect(warnings.map((v) => v.code)).toEqual(
      expect.arrayContaining([
        "marketing",
        "baseline",
        "inconsistent",
        "integration",
      ]),
    );
    expect(warnings.find((v) => v.code === "marketing")?.message).toBe(
      "Out of scope for AI Operations — refer to Justin.",
    );
  });
  it.each(["None", " No ", "Unknown", ""])(
    "flags integration choice %s",
    (integration) => {
      const s = newSession();
      s.software = [{ ...newSoftware(), integration }];
      expect(riskWarnings(s).some((v) => v.code === "integration")).toBe(true);
    },
  );
});

describe("editable document generation", () => {
  it("generates recommendation with estimates, no private notes and no investment by default", () => {
    const s = example();
    s.callNotes = "PRIVATE_CALL";
    s.client.notes = "PRIVATE_CLIENT";
    s.worksheet.rationale = "PRIVATE_RATIONALE";
    s.calculator.pricingNotes = "PRIVATE_PRICE";
    const r = generateRecommendation(s, defaultSettings());
    const json = JSON.stringify(r);
    expect(r.includeInvestment).toBe(false);
    expect(r.includeRationale).toBe(false);
    expect(r.impact).toContain("11,100.00");
    expect(r.nextStep).toBe(
      "Confirm the workflow scope, required system access, success metric, and implementation terms.",
    );
    expect(json).not.toContain("PRIVATE_");
    expect(json).not.toContain("3,000");
    s.recommendation = r;
    expect(sessionSchema.safeParse(s).success).toBe(true);
  });
  it("does not invent baseline, accuracy, prices, duration, consent or payment choices", () => {
    const s = newSession();
    const settings = defaultSettings();
    const r = generateRecommendation(s, settings);
    const p = generateProposal(s, settings);
    expect(r.baseline).toContain("Not established");
    expect(r.impact).toContain("Not established");
    expect(p.targetMetric).toBe("");
    expect(p.standard).toBe("");
    expect(p.sampleSize).toBeNull();
    expect(p.paymentPreset).toBe("");
    expect(p.deposit).toBeNull();
    expect(p.monthlySupport).toBeNull();
    expect(p.caseStudy).toBe("");
    expect(p.milestones.every((m) => m.days === null)).toBe(true);
    expect(p.deliverables.every((d) => !d.included)).toBe(true);
    s.proposal = p;
    expect(sessionSchema.safeParse(s).success).toBe(true);
    expect(r.impact).not.toContain("0.00");
    expect(r.impact).toContain(
      "Estimated annual labor savings: Not established",
    );
    expect(r.impact).toContain(
      "Estimated annual subscription savings: Not established",
    );
  });
  it("includes required editable proposal boilerplate and client data only", () => {
    const s = example();
    s.callNotes = "PRIVATE_CALL";
    s.worksheet.rationale = "PRIVATE_REASON";
    s.calculator.pricingNotes = "PRIVATE_PRICE";
    const p = generateProposal(s, defaultSettings());
    expect(p.legalName).toBe(s.client.business);
    expect(p.thirdParty).toContain("client is responsible");
    expect(p.exclusions).toContain("Lead generation");
    expect(p.privacy).toContain("qualified counsel");
    expect(p.privacy).toContain("No credentials");
    expect(p.privacy).toContain("not guaranteed to be error-free");
    expect(p.changeOrders).toBe(
      "Requests outside the approved scope will be documented and priced separately before additional work begins.",
    );
    expect(JSON.stringify(p)).not.toContain("PRIVATE_");
  });
  it("tracks changed assumptions and edited recommendations without self-invalidating", () => {
    const s = example();
    const settings = defaultSettings();
    const original = sourceFingerprint(s, settings);
    s.recommendation = generateRecommendation(s, settings);
    expect(sourceFingerprint(s, settings)).toBe(original);
    const p = generateProposal(s, settings);
    s.proposal = p;
    expect(proposalSourceFingerprint(s, settings)).toBe(p.sourceFingerprint);
    s.recommendation.objective = "Updated objective";
    expect(proposalSourceFingerprint(s, settings)).not.toBe(
      p.sourceFingerprint,
    );
    s.calculator.labor[0].hours = 12;
    expect(sourceFingerprint(s, settings)).not.toBe(original);
  });
  it.each([
    "Additional discovery required",
    "Process cleanup required first",
    "Software consolidation only",
    "Not currently recommended",
    "Refer marketing request to Justin",
    "",
  ])("honors decision %s instead of generating an AI pilot", (decision) => {
    const s = example();
    const settings = defaultSettings();
    s.recommendation = generateRecommendation(s, settings);
    s.recommendation.opportunity = "Previously edited AI pilot";
    s.worksheet.decision = decision;
    const r = generateRecommendation(s, settings);
    const p = generateProposal(s, settings);
    const expected = decision || "Decision not established";
    expect(r.opportunity).toContain(expected);
    expect(r.pilot).toContain(expected);
    expect(p.projectName).toContain(expected);
    expect(p.scope).toContain(expected);
    expect(p.solution).toContain(expected);
    expect(p.solution).not.toContain("Previously edited AI pilot");
    expect(p.deliverables.some((v) => v.text.includes("AI prompt"))).toBe(
      false,
    );
    expect(p.milestones.some((v) => /Configure|Launch/.test(v.name))).toBe(
      false,
    );
    expect(r.nextStep).not.toContain("implementation terms");
    expect(s.recommendation.opportunity).toBe("Previously edited AI pilot");
    s.recommendation = r;
    s.proposal = p;
    expect(sessionSchema.safeParse(s).success).toBe(true);
  });
  it("allows an explicitly selected AI pilot with unselected configurable deliverables", () => {
    const s = example();
    const p = generateProposal(s, defaultSettings());
    expect(p.projectName).toContain("AI Operations pilot");
    expect(
      p.deliverables.some(
        (v) => v.text === "AI prompt or instruction configuration",
      ),
    ).toBe(true);
    expect(p.deliverables.every((v) => !v.included)).toBe(true);
  });
  it("overrides positive decision when marketing is classified", () => {
    const s = example();
    s.worksheet.classifications.push(
      "Marketing or lead generation — refer to Justin",
    );
    const r = generateRecommendation(s, defaultSettings());
    const p = generateProposal(s, defaultSettings());
    expect(r.opportunity).toContain("Marketing work is out of scope");
    expect(r.nextStep).toContain("Justin");
    expect(p.solution).toContain("No AI Operations implementation is proposed");
    expect(p.deliverables).toEqual([]);
  });
  it("carries audit data, risk, accuracy and review controls without internal ratings or rationale", () => {
    const s = example();
    Object.assign(s.worksheet, {
      riskAreas: ["Financial decisions"],
      autonomous: "Yes",
      sensitivity: "High",
      dataRights: "Unknown",
      wrongResult: "Incorrect invoice total",
      correctable: "No",
      controls: "Reconcile totals against approved source records",
      escalation: "No",
      rationale: "PRIVATE_RATIONALE",
      fit: [5, 5, 5, 5, 5, 5, 5, 5, 5, 1],
    });
    const r = generateRecommendation(s, defaultSettings());
    const p = generateProposal(s, defaultSettings());
    for (const text of [r.risks, p.privacy]) {
      expect(text).toContain("Financial decisions");
      expect(text).toContain("Data sensitivity: High");
      expect(text).toContain("Data usage rights: Unknown");
      expect(text).toContain("Incorrect invoice total");
      expect(text).toContain("Reconcile totals");
      expect(text).toContain("must not be fully autonomous");
      expect(text).toContain("Escalation path: No");
      expect(text).not.toContain("PRIVATE_RATIONALE");
      expect(text).not.toContain("100");
    }
    expect(p.privacy).toContain("Office manager");
  });
  it("surfaces stale inherited recommendation in a new proposal while preserving edits", () => {
    const s = example();
    const settings = defaultSettings();
    s.recommendation = generateRecommendation(s, settings);
    s.recommendation.objective = "Edited objective to preserve";
    expect(proposalUsesStaleRecommendation(s, settings)).toBe(false);
    s.calculator.labor[0].hours = 100;
    expect(proposalUsesStaleRecommendation(s, settings)).toBe(true);
    const p = generateProposal(s, settings);
    expect(p.objective).toBe("Edited objective to preserve");
    expect(p.currentState).toContain(
      "source recommendation uses earlier audit inputs",
    );
    expect(p.solution).toContain(
      "source recommendation uses earlier audit inputs",
    );
  });
});
