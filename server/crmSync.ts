import { z } from "zod";
import { parseAssessmentSubmission } from "../src/domain/assessment";
import { INTAKE_LOCATION_ID } from "../src/domain/intakeSchema";
import { identity, normalizedEmail, readBounded } from "./ghl";
import { canonical, digest, type DurableStore } from "./storage";
import type { BridgeConfig, Environment } from "./config";

// Disabled by default. Enable only after field schema, additive-tag workflow
// effects, permissions and live readback review.
export interface CrmSyncConfig {
  enabled: boolean;
  locationId: typeof INTAKE_LOCATION_ID;
  token: string;
  fields: { firstAssessment: string; latestAssessment: string };
  dedicatedMultilineFieldsVerified: boolean;
  assessmentTag?: "ww-assessment-completed";
  tagWorkflowsReviewed?: boolean;
}
export type SyncResult = {
  status: "disabled" | "synced" | "duplicate" | "stale" | "review_required";
  reason?: string;
};
export function readCrmSyncConfig(env: Environment, bridge: BridgeConfig): CrmSyncConfig | null {
  if (env("WW_CRM_SYNC_ENABLED") !== "true") return null;
  const first = env("WW_CRM_FIRST_ASSESSMENT_FIELD_ID") ?? "";
  const latest = env("WW_CRM_LATEST_ASSESSMENT_FIELD_ID") ?? "";
  if (bridge.locationId !== INTAKE_LOCATION_ID || env("WW_CRM_FIELDS_VERIFIED") !== "true" ||
      !identity.safeParse(first).success || !identity.safeParse(latest).success || first === latest ||
      (env("WW_CRM_ASSESSMENT_TAG_ENABLED") === "true" && env("WW_CRM_TAG_WORKFLOWS_REVIEWED") !== "true"))
    return null;
  return {
    enabled: true,
    locationId: INTAKE_LOCATION_ID,
    token: bridge.ghlToken,
    fields: { firstAssessment: first, latestAssessment: latest },
    dedicatedMultilineFieldsVerified: env("WW_CRM_FIELDS_VERIFIED") === "true",
    ...(env("WW_CRM_ASSESSMENT_TAG_ENABLED") === "true" ? {
      assessmentTag: "ww-assessment-completed" as const,
      tagWorkflowsReviewed: env("WW_CRM_TAG_WORKFLOWS_REVIEWED") === "true",
    } : {}),
  };
}
const review = (reason: string): SyncResult => ({ status: "review_required", reason });
const contactSchema = z.object({
  id: identity,
  locationId: identity,
  email: z.string(),
  tags: z.array(z.string()).max(1000),
  customFields: z.array(z.object({ id: identity, value: z.unknown() })).max(1000),
});
const snapshotSchema = z.object({
  submission: z.unknown(), hash: z.string(), receivedAt: z.iso.datetime(),
});
const receiptSchema = z.object({
  submissionId: identity, contactId: identity, hash: z.string(),
  receivedAt: z.iso.datetime(),
});
const journalSchema = z.strictObject({
  phase: z.enum(["pending", "complete"]),
  configHash: z.string(), submissionId: identity, hash: z.string(),
  receivedAt: z.iso.datetime(), first: z.string(), latest: z.string(),
});
type Journal = z.infer<typeof journalSchema>;

export class AssessmentCrmSync {
  constructor(
    private readonly config: CrmSyncConfig | null,
    private readonly store: DurableStore,
    private readonly fetcher: typeof fetch = fetch,
  ) {}

  private async request(path: string, signal: AbortSignal, method = "GET", body?: unknown) {
    signal.throwIfAborted();
    const response = await this.fetcher(`https://services.leadconnectorhq.com${path}`, {
      method,
      headers: { Authorization: `Bearer ${this.config!.token}`, Version: "v3",
        "Content-Type": "application/json", Accept: "application/json" },
      ...(body === undefined ? {} : { body: JSON.stringify(body) }),
      signal, redirect: "error",
    });
    if (!response.ok) throw new Error("CRM request unavailable");
    return JSON.parse(await readBounded(response, 512000)) as unknown;
  }

  /** Accept only IDs of an already durable, verified bridge association.
   * A pending journal is never stolen/replayed automatically, even after expiry:
   * the API has no documented conditional update or request-id guarantee.
   */
  async sync(input: { contactId: string; submissionId: string }, abort?: AbortSignal): Promise<SyncResult> {
    const config = this.config;
    if (!config?.enabled) return { status: "disabled" };
    const signal = abort ? AbortSignal.any([abort, AbortSignal.timeout(4000)]) : AbortSignal.timeout(4000);
    if (config.locationId !== INTAKE_LOCATION_ID || config.token.length < 20 ||
        config.dedicatedMultilineFieldsVerified !== true ||
        (config.assessmentTag !== undefined &&
          (config.assessmentTag !== "ww-assessment-completed" || config.tagWorkflowsReviewed !== true)))
      return review("configuration_unverified");
    const ids = [input.contactId, input.submissionId,
      config.fields.firstAssessment, config.fields.latestAssessment];
    if (ids.some((id) => !identity.safeParse(id).success) ||
        config.fields.firstAssessment === config.fields.latestAssessment)
      return review("invalid_identity_or_field_mapping");

    // Configuration identity excludes credentials and never persists a token.
    const configHash = digest(canonical({ locationId: config.locationId,
      fields: config.fields, tag: config.assessmentTag ?? null }));
    const key = `crm-sync/${digest(input.contactId)}`;
    let acquired = false;
    try {
      signal.throwIfAborted();
      const snapshotRow = await this.store.read(`submissions/${digest(input.submissionId)}`);
      const receiptRow = await this.store.read(`receipts/${digest(input.submissionId)}`);
      const snapshot = snapshotSchema.parse(snapshotRow?.value);
      const receipt = receiptSchema.parse(receiptRow?.value);
      const submission = parseAssessmentSubmission(snapshot.submission);
      const hash = digest(canonical(submission));
      if (receipt.contactId !== input.contactId || receipt.submissionId !== input.submissionId ||
          submission.submission_id !== input.submissionId || receipt.hash !== hash ||
          snapshot.hash !== hash || snapshot.receivedAt !== receipt.receivedAt)
        return review("durable_association_mismatch");

      const oldRow = await this.store.read(key);
      const old = oldRow ? journalSchema.parse(oldRow.value) : null;
      if (old?.phase === "pending") return review("pending_operation_requires_reconciliation");
      if (old && old.configHash !== configHash) return review("mapping_changed_requires_review");
      if (old?.submissionId === input.submissionId)
        return old.hash === hash ? { status: "duplicate" } : review("submission_changed");
      if (old && Date.parse(snapshot.receivedAt) < Date.parse(old.receivedAt))
        return { status: "stale" };
      if (old && snapshot.receivedAt === old.receivedAt)
        return review("ambiguous_receipt_order");

      // One JSON value per touch keeps answers, score and its attribution together.
      // First/latest mean first/latest synchronized assessment, not browser history.
      const latest = canonical({ received_at_utc: snapshot.receivedAt, assessment: submission });
      if (latest.length > 16000) return review("assessment_field_capacity");
      const next: Journal = { phase: "pending", configHash,
        submissionId: input.submissionId, hash, receivedAt: snapshot.receivedAt,
        first: old?.first ?? latest, latest };
      signal.throwIfAborted();
      // Acquiring before network access excludes concurrent syncs across instances.
      if (!await this.store.cas(key, next, oldRow?.etag ?? null))
        return review("concurrent_sync");
      acquired = true;
      const check = await this.store.read<Journal>(key);
      if (!check || canonical(check.value) !== canonical(next))
        return review("journal_readback_failed");

      const readContact = async () => {
        const value = z.object({ contact: contactSchema }).parse(
          await this.request(`/contacts/${input.contactId}`, signal)).contact;
        if (value.id !== input.contactId || value.locationId !== config.locationId ||
            normalizedEmail(value.email) !== normalizedEmail(submission.contact.email) ||
            new Set(value.customFields.map((field) => field.id)).size !== value.customFields.length)
          throw new Error("CRM association changed");
        return value;
      };
      const before = await readContact();
      const fieldValue = (contact: z.infer<typeof contactSchema>, id: string) =>
        contact.customFields.find((field) => field.id === id)?.value;
      const empty = (value: unknown) => value === undefined || value === null || value === "";
      const firstBefore = fieldValue(before, config.fields.firstAssessment);
      const latestBefore = fieldValue(before, config.fields.latestAssessment);
      // Unexpected existing values stop writes. These fields require exclusive
      // integration ownership: the provider offers no conditional-write guarantee.
      if ((old ? firstBefore !== old.first : !empty(firstBefore)) ||
          (old ? latestBefore !== old.latest : !empty(latestBefore)))
        return review("mapped_fields_changed_requires_review");
      const customFields = [
        ...(!old ? [{ id: config.fields.firstAssessment, fieldValue: next.first }] : []),
        { id: config.fields.latestAssessment, fieldValue: next.latest },
      ];
      await this.request(`/contacts/${input.contactId}`, signal, "PUT", { customFields });
      const afterFields = await readContact();
      if (fieldValue(afterFields, config.fields.firstAssessment) !== next.first ||
          fieldValue(afterFields, config.fields.latestAssessment) !== next.latest)
        return review("field_readback_failed");
      // Check unrelated fields survived partial update; never replace the tags array.
      for (const field of before.customFields) {
        if (field.id !== config.fields.firstAssessment && field.id !== config.fields.latestAssessment &&
            canonical(fieldValue(afterFields, field.id)) !== canonical(field.value))
          return review("unrelated_field_changed");
      }
      if (config.assessmentTag && !afterFields.tags.includes(config.assessmentTag)) {
        await this.request(`/contacts/${input.contactId}/tags`, signal, "POST", { tags: [config.assessmentTag] });
      }
      const verified = await readContact();
      if (fieldValue(verified, config.fields.firstAssessment) !== next.first ||
          fieldValue(verified, config.fields.latestAssessment) !== next.latest ||
          before.tags.some((tag) => !verified.tags.includes(tag)) ||
          (config.assessmentTag && !verified.tags.includes(config.assessmentTag)))
        return review("final_readback_failed");
      signal.throwIfAborted();
      if (!await this.store.cas(key, { ...next, phase: "complete" }, check.etag))
        return review("completion_not_recorded");
      const completed = await this.store.read<Journal>(key);
      if (!completed || canonical(completed.value) !== canonical({ ...next, phase: "complete" }))
        return review("completion_not_verified");
      return { status: "synced" };
    } catch {
      // No provider bodies, tokens, contact details or answers enter error output.
      return review(acquired ? "operation_requires_reconciliation" : "source_or_storage_unverified");
    }
  }
}

export const AI_PIPELINE_ID = "lTUUUTxg3y1fTIwHp3lA";
export const AI_PIPELINE_STAGES = [
  "4877cbd0-eea6-4d1b-b506-94a7adbf1f32", // Assessment Submitted
  "0e2dddc3-f159-4dba-8cb3-ac394865e275", // New Lead
  "191264d2-eeab-4d88-b3b5-3ec9053a17eb", // Contact Attempted
  "a2378593-a32e-4919-ba3e-aa1e4eb4a777", // Consultation Booked
  "d0e503d8-9e68-4895-b7cb-364948fa681b", // Connected
  "22a9118c-d20a-44d2-9449-029ed12eccbc", // Qualified
  "191c3f67-ea61-4f73-ad3b-6f36caff0eb4", // Consultation Completed
  "da8bebad-0b38-4271-9123-6f36caff0eb4", // Proposal Sent
  "f5ee376a-081d-4e36-a5bc-8863aaf9c3d4", // Decision Pending
] as const;
export const ASSESSMENT_SUBMITTED_STAGE_ID = AI_PIPELINE_STAGES[0];
export const CONSULTATION_BOOKED_STAGE_ID = AI_PIPELINE_STAGES[3];
const opportunitySchema = z.object({
  id: identity, contactId: identity, locationId: identity, pipelineId: identity,
  pipelineStageId: identity, status: z.enum(["open", "won", "lost", "abandoned"]),
});
export type VerifiedOpportunity = z.infer<typeof opportunitySchema>;

/** Pure decision only. Search-then-create/PUT cannot guarantee uniqueness or
 * prevent an operator stage update racing this process. Never execute writes.
 */
export function assessOpportunitySync(input: {
  contactId: string;
  stage: "assessment_received" | "consultation_booked";
  opportunities: VerifiedOpportunity[];
  complete: boolean;
}): { action: "preserve" | "review_required"; reason: string; desiredStageId?: string } {
  const fail = (reason: string) => ({ action: "review_required" as const, reason });
  if (!input.complete || !identity.safeParse(input.contactId).success ||
      !["assessment_received", "consultation_booked"].includes(input.stage))
    return fail("incomplete_or_invalid_evidence");
  const parsed = z.array(opportunitySchema).max(100).safeParse(input.opportunities);
  if (!parsed.success || parsed.data.some((op) => op.contactId !== input.contactId ||
      op.locationId !== INTAKE_LOCATION_ID || op.pipelineId !== AI_PIPELINE_ID))
    return fail("opportunity_scope_mismatch");
  if (parsed.data.length > 1) return fail("multiple_opportunities_require_review");
  const op = parsed.data[0];
  const desired = input.stage === "consultation_booked" ? 3 : 0;
  if (!op) return { ...fail("atomic_creation_not_verified"), desiredStageId: AI_PIPELINE_STAGES[desired] };
  if (op.status !== "open") return { action: "preserve", reason: "closed_opportunity" };
  const rank = AI_PIPELINE_STAGES.findIndex((id) => id === op.pipelineStageId);
  if (rank < 0) return fail("unknown_stage");
  if (rank >= desired) return { action: "preserve", reason: "same_or_advanced_stage" };
  return { ...fail("conditional_stage_update_not_verified"), desiredStageId: AI_PIPELINE_STAGES[desired] };
}
