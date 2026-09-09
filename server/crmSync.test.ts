// @vitest-environment node
import { describe, expect, it } from "vitest";
import { AssessmentCrmSync, assessOpportunitySync, readCrmSyncConfig, AI_PIPELINE_ID,
  AI_PIPELINE_STAGES, type CrmSyncConfig, type VerifiedOpportunity } from "./crmSync";
import { MemoryStore, testSubmission, TEST_CONFIG } from "./testing";
import { canonical, digest } from "./storage";
import type { AssessmentSubmission } from "../src/domain/assessment";
import { INTAKE_LOCATION_ID } from "../src/domain/intakeSchema";

// Synthetic field IDs are fixtures, not a proposed production mapping.
const CONFIG: CrmSyncConfig = { enabled: true, locationId: INTAKE_LOCATION_ID,
  token: TEST_CONFIG.ghlToken, dedicatedMultilineFieldsVerified: true,
  fields: { firstAssessment: "fixture-first", latestAssessment: "fixture-latest" },
  assessmentTag: "ww-assessment-completed", tagWorkflowsReviewed: true };
async function fixture() {
  const store = new MemoryStore();
  const calls: { method: string; path: string; body?: Record<string, unknown> }[] = [];
  const contact = { id: "contact-test", locationId: TEST_CONFIG.locationId,
    email: "taylor@example.test", firstName: "Trusted CRM name", phone: "+12025550100",
    dnd: true, tags: ["existing-tag"],
    customFields: [{ id: "unrelated-field", value: "Keep this" }] as { id: string; value: unknown }[] };
  let failWrite = false;
  let ignoreFields = false;
  let beforeGet: (() => Promise<void>) | undefined;
  const fetcher: typeof fetch = async (url, init) => {
    const parsed = new URL(String(url));
    expect(parsed.origin).toBe("https://services.leadconnectorhq.com");
    expect(init?.redirect).toBe("error");
    expect(new Headers(init?.headers).get("Version")).toBe("v3");
    const method = init?.method ?? "GET";
    const body = init?.body ? JSON.parse(String(init.body)) as Record<string, unknown> : undefined;
    calls.push({ method, path: parsed.pathname, body });
    if (method === "GET") {
      await beforeGet?.();
      return Response.json({ contact });
    }
    if (failWrite) throw new Error("Simulated uncertain failure with private provider data");
    if (method === "PUT") {
      expect(Object.keys(body!)).toEqual(["customFields"]);
      if (!ignoreFields) for (const field of body!.customFields as { id: string; fieldValue: string }[]) {
        const old = contact.customFields.find((value) => value.id === field.id);
        if (old) old.value = field.fieldValue;
        else contact.customFields.push({ id: field.id, value: field.fieldValue });
      }
      return Response.json({ succeeded: true, contact });
    }
    expect(parsed.pathname).toBe("/contacts/contact-test/tags");
    expect(Object.keys(body!)).toEqual(["tags"]);
    contact.tags = [...new Set([...contact.tags, ...body!.tags as string[]])];
    return Response.json({ tags: contact.tags }, { status: 201 });
  };
  const save = async (submission: AssessmentSubmission, receivedAt = "2026-09-05T16:00:00Z") => {
    const hash = digest(canonical(submission));
    await store.cas(`submissions/${digest(submission.submission_id)}`,
      { submission, hash, receivedAt }, null);
    await store.cas(`receipts/${digest(submission.submission_id)}`,
      { submissionId: submission.submission_id, hash, receivedAt, contactId: contact.id }, null);
    return { contactId: contact.id, submissionId: submission.submission_id };
  };
  const submission = testSubmission();
  const input = await save(submission);
  return { store, contact, calls, fetcher, save, input, submission,
    adapter: new AssessmentCrmSync(CONFIG, store, fetcher),
    failWrite: () => { failWrite = true; },
    ignoreFields: () => { ignoreFields = true; },
    beforeGet: (fn: () => Promise<void>) => { beforeGet = fn; } };
}

describe("opt-in durable assessment CRM synchronization", () => {
  it("runtime configuration defaults off and requires exact flags and distinct verified IDs", () => {
    const env: Record<string, string> = {};
    const read = () => readCrmSyncConfig((key) => env[key], TEST_CONFIG);
    expect(read()).toBeNull();
    env.WW_CRM_SYNC_ENABLED = "true";
    expect(read()).toBeNull();
    env.WW_CRM_FIRST_ASSESSMENT_FIELD_ID = "fixture-first";
    env.WW_CRM_LATEST_ASSESSMENT_FIELD_ID = "fixture-latest";
    expect(read()).toBeNull();
    env.WW_CRM_FIELDS_VERIFIED = "true";
    expect(read()).toMatchObject({ enabled: true, fields: CONFIG.fields });
    env.WW_CRM_ASSESSMENT_TAG_ENABLED = "true";
    expect(read()).toBeNull();
    env.WW_CRM_TAG_WORKFLOWS_REVIEWED = "true";
    expect(read()).toMatchObject({ assessmentTag: "ww-assessment-completed" });
    env.WW_CRM_SYNC_ENABLED = "TRUE";
    expect(read()).toBeNull();
  });
  it("shares the caller abort signal across all provider operations", async () => {
    const f = await fixture();
    const controller = new AbortController();
    f.beforeGet(async () => { controller.abort(); });
    expect((await f.adapter.sync(f.input, controller.signal)).status).toBe("review_required");
    expect(f.calls.map((call) => call.method)).toEqual(["GET"]);
    expect((await f.adapter.sync(f.input)).reason).toBe("pending_operation_requires_reconciliation");
  });
  it("does no storage or network work when disabled or missing config", async () => {
    for (const config of [null, { ...CONFIG, enabled: false }]) {
      const adapter = new AssessmentCrmSync(config, null!, async () => { throw new Error("must not fetch"); });
      expect(await adapter.sync({ contactId: "", submissionId: "" })).toEqual({ status: "disabled" });
    }
  });
  it("requires reviewed dedicated fields and reviewed additive-tag triggers", async () => {
    const f = await fixture();
    for (const config of [
      { ...CONFIG, dedicatedMultilineFieldsVerified: false },
      { ...CONFIG, tagWorkflowsReviewed: false },
      { ...CONFIG, fields: { firstAssessment: "same", latestAssessment: "same" } },
    ]) expect((await new AssessmentCrmSync(config, f.store, f.fetcher).sync(f.input)).status).toBe("review_required");
    expect(f.calls).toHaveLength(0);
  });
  it("verifies durable association and refuses missing or tampered snapshots", async () => {
    const f = await fixture();
    expect((await f.adapter.sync({ ...f.input, contactId: "wrong-contact" })).reason).toBe("durable_association_mismatch");
    expect((await f.adapter.sync({ ...f.input, submissionId: "missing" })).status).toBe("review_required");
    const key = `submissions/${digest(f.input.submissionId)}`;
    const row = f.store.rows.get(key)!;
    (row.value as { hash: string }).hash = "tampered";
    expect((await f.adapter.sync(f.input)).reason).toBe("durable_association_mismatch");
    expect(f.calls).toHaveLength(0);
  });
  it("writes only dedicated fields and additive tag, then verifies all readbacks", async () => {
    const f = await fixture();
    expect(await f.adapter.sync(f.input)).toEqual({ status: "synced" });
    expect(f.calls.map((call) => call.method)).toEqual(["GET", "PUT", "GET", "POST", "GET"]);
    expect(f.contact).toMatchObject({ firstName: "Trusted CRM name", phone: "+12025550100", dnd: true });
    expect(f.contact.tags).toEqual(["existing-tag", "ww-assessment-completed"]);
    expect(f.contact.customFields[0]).toEqual({ id: "unrelated-field", value: "Keep this" });
    const journal = (await f.store.read(`crm-sync/${digest(f.contact.id)}`))!.value;
    expect(journal).toMatchObject({ phase: "complete" });
    expect(JSON.stringify(journal)).not.toContain(CONFIG.token);
  });
  it("duplicate submission makes no extra CRM calls or tag-trigger replay", async () => {
    const f = await fixture();
    await f.adapter.sync(f.input);
    const count = f.calls.length;
    expect(await f.adapter.sync(f.input)).toEqual({ status: "duplicate" });
    expect(f.calls).toHaveLength(count);
  });
  it("keeps first assessment attribution frozen and latest consistent with latest answers", async () => {
    const f = await fixture();
    await f.adapter.sync(f.input);
    const first = f.contact.customFields.find((field) => field.id === "fixture-first")!.value;
    const next = testSubmission("next-submission");
    next.attribution = { first_touch: { utm_source: "campaign-b" }, last_touch: { utm_source: "campaign-b" } };
    next.contact.current_tools = "Another tool";
    const nextInput = await f.save(next, "2026-09-05T17:00:00Z");
    expect((await f.adapter.sync(nextInput)).status).toBe("synced");
    expect(f.contact.customFields.find((field) => field.id === "fixture-first")!.value).toBe(first);
    const latest = JSON.parse(String(f.contact.customFields.find((field) => field.id === "fixture-latest")!.value));
    expect(latest.assessment.attribution.last_touch.utm_source).toBe("campaign-b");
    expect(latest.assessment.contact.current_tools).toBe("Another tool");
    expect(f.calls.filter((call) => call.method === "POST")).toHaveLength(1);
    expect(await f.adapter.sync(f.input)).toEqual({ status: "stale" });
  });
  it("does not fabricate carried-over campaign tags when latest assessment is direct", async () => {
    const f = await fixture();
    await f.adapter.sync(f.input);
    const next = testSubmission("direct-submission");
    const input = await f.save(next, "2026-09-05T17:00:00Z");
    await f.adapter.sync(input);
    const latest = JSON.parse(String(f.contact.customFields.find((field) => field.id === "fixture-latest")!.value));
    expect(latest.assessment.attribution).toEqual({ first_touch: {}, last_touch: {} });
  });
  it("refuses prepopulated or manually modified mapped values rather than overwriting", async () => {
    const f = await fixture();
    f.contact.customFields.push({ id: "fixture-first", value: "Operator notes" });
    expect((await f.adapter.sync(f.input)).reason).toBe("mapped_fields_changed_requires_review");
    expect(f.calls.map((call) => call.method)).toEqual(["GET"]);
    expect(f.contact.customFields.at(-1)!.value).toBe("Operator notes");
  });
  it("rejects canonical CRM email/location drift before mutation", async () => {
    const f = await fixture();
    f.contact.email = "changed@example.test";
    expect((await f.adapter.sync(f.input)).status).toBe("review_required");
    expect(f.calls.map((call) => call.method)).toEqual(["GET"]);
  });
  it("does not trust successful mutation responses without matching readback", async () => {
    const f = await fixture();
    f.ignoreFields();
    expect((await f.adapter.sync(f.input)).reason).toBe("field_readback_failed");
    expect(f.calls.some((call) => call.method === "POST")).toBe(false);
  });
  it("uncertain mutation blocks automatic retries and later submissions", async () => {
    const f = await fixture();
    f.failWrite();
    expect((await f.adapter.sync(f.input)).reason).toBe("operation_requires_reconciliation");
    const count = f.calls.length;
    expect((await f.adapter.sync(f.input)).reason).toBe("pending_operation_requires_reconciliation");
    const next = await f.save(testSubmission("next"), "2026-09-05T17:00:00Z");
    expect((await f.adapter.sync(next)).reason).toBe("pending_operation_requires_reconciliation");
    expect(f.calls).toHaveLength(count);
  });
  it("serializes simultaneous syncs across adapter instances using durable CAS", async () => {
    const f = await fixture();
    let release!: () => void;
    const barrier = new Promise<void>((resolve) => { release = resolve; });
    let entered!: () => void;
    const firstRead = new Promise<void>((resolve) => { entered = resolve; });
    f.beforeGet(async () => { entered(); await barrier; });
    const running = f.adapter.sync(f.input);
    await firstRead;
    const second = new AssessmentCrmSync(CONFIG, f.store, f.fetcher);
    expect((await second.sync(f.input)).reason).toBe("pending_operation_requires_reconciliation");
    release();
    expect((await running).status).toBe("synced");
    expect(f.calls.filter((call) => call.method === "PUT")).toHaveLength(1);
  });
  it("changed mapping and tied receipt timestamps require review", async () => {
    const f = await fixture();
    await f.adapter.sync(f.input);
    const next = await f.save(testSubmission("tied"));
    expect((await f.adapter.sync(next)).reason).toBe("ambiguous_receipt_order");
    expect((await new AssessmentCrmSync({ ...CONFIG, assessmentTag: undefined }, f.store, f.fetcher)
      .sync(f.input)).reason).toBe("mapping_changed_requires_review");
  });
});

describe("opportunity policy with no unsafe API writes", () => {
  const op: VerifiedOpportunity = { id: "opportunity-test", contactId: "contact-test",
    locationId: TEST_CONFIG.locationId, pipelineId: AI_PIPELINE_ID,
    pipelineStageId: AI_PIPELINE_STAGES[0], status: "open" };
  const decide = (opportunities: VerifiedOpportunity[], complete = true) =>
    assessOpportunitySync({ contactId: op.contactId, stage: "consultation_booked", opportunities, complete });
  it("requires review for absent/duplicate/incomplete/foreign opportunities", () => {
    expect(decide([]).reason).toBe("atomic_creation_not_verified");
    expect(decide([op, { ...op, id: "second" }]).reason).toBe("multiple_opportunities_require_review");
    expect(decide([op], false).reason).toBe("incomplete_or_invalid_evidence");
    expect(decide([{ ...op, pipelineId: "unrelated" }]).reason).toBe("opportunity_scope_mismatch");
  });
  it("preserves won/lost/abandoned and every same or advanced stage", () => {
    for (const status of ["won", "lost", "abandoned"] as const)
      expect(decide([{ ...op, status }])).toEqual({ action: "preserve", reason: "closed_opportunity" });
    for (const pipelineStageId of AI_PIPELINE_STAGES.slice(3))
      expect(decide([{ ...op, pipelineStageId }]).action).toBe("preserve");
  });
  it("never performs a race-prone stage advancement or assumes unknown stage order", () => {
    expect(decide([op])).toEqual({ action: "review_required",
      reason: "conditional_stage_update_not_verified", desiredStageId: AI_PIPELINE_STAGES[3] });
    expect(decide([{ ...op, pipelineStageId: "unknown" }]).reason).toBe("unknown_stage");
    expect(assessOpportunitySync({ contactId: op.contactId, stage: "assessment_received",
      opportunities: [op], complete: true }).action).toBe("preserve");
  });
});
