// @vitest-environment node
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { hostedBridgeEnv } from "./config";
import { readCrmSyncConfig } from "./crmSync";
import { TEST_CONFIG } from "./testing";

describe("hosted Netlify bridge env", () => {
  it("does not force CRM sync, field verification, or field IDs when env is unset", () => {
    const env = hostedBridgeEnv(() => undefined);
    expect(env("WW_CRM_SYNC_ENABLED")).toBeUndefined();
    expect(env("WW_CRM_FIELDS_VERIFIED")).toBeUndefined();
    expect(env("WW_CRM_FIRST_ASSESSMENT_FIELD_ID")).toBeUndefined();
    expect(env("WW_CRM_LATEST_ASSESSMENT_FIELD_ID")).toBeUndefined();
    expect(readCrmSyncConfig(env, TEST_CONFIG)).toBeNull();
  });

  it("keeps research and tag flags off unless env is exactly true", () => {
    const unset = hostedBridgeEnv(() => undefined);
    expect(unset("WW_PUBLIC_RESEARCH_ENABLED")).toBe("false");
    expect(unset("WW_CRM_ASSESSMENT_TAG_ENABLED")).toBe("false");
    expect(unset("WW_CRM_TAG_WORKFLOWS_REVIEWED")).toBe("false");

    const enabled = hostedBridgeEnv((key) =>
      key === "WW_PUBLIC_RESEARCH_ENABLED" ||
      key === "WW_CRM_ASSESSMENT_TAG_ENABLED" ||
      key === "WW_CRM_TAG_WORKFLOWS_REVIEWED"
        ? "true"
        : undefined,
    );
    expect(enabled("WW_PUBLIC_RESEARCH_ENABLED")).toBe("true");
    expect(enabled("WW_CRM_ASSESSMENT_TAG_ENABLED")).toBe("true");
    expect(enabled("WW_CRM_TAG_WORKFLOWS_REVIEWED")).toBe("true");
  });

  it("lets Netlify env enable CRM sync only when WW_CRM_SYNC_ENABLED is exactly true", () => {
    const values: Record<string, string> = {
      WW_CRM_SYNC_ENABLED: "true",
      WW_CRM_FIELDS_VERIFIED: "true",
      WW_CRM_FIRST_ASSESSMENT_FIELD_ID: "fixture-first",
      WW_CRM_LATEST_ASSESSMENT_FIELD_ID: "fixture-latest",
    };
    const on = hostedBridgeEnv((key) => values[key]);
    expect(readCrmSyncConfig(on, TEST_CONFIG)).toMatchObject({ enabled: true });
    values.WW_CRM_SYNC_ENABLED = "TRUE";
    expect(readCrmSyncConfig(on, TEST_CONFIG)).toBeNull();
    delete values.WW_CRM_SYNC_ENABLED;
    expect(readCrmSyncConfig(on, TEST_CONFIG)).toBeNull();
  });

  it("netlify function no longer hardcodes CRM sync on", () => {
    const source = readFileSync(
      join(process.cwd(), "netlify/functions/bridge.ts"),
      "utf8",
    );
    expect(source).not.toContain("fixedWonderWorkflowConfig");
    expect(source).not.toMatch(/WW_CRM_SYNC_ENABLED:\s*"true"/);
    expect(source).not.toMatch(/WW_CRM_FIELDS_VERIFIED:\s*"true"/);
    expect(source).toContain("hostedBridgeEnv");
  });

  it("public assessment route still mounts LegacyAssessment", () => {
    const source = readFileSync(join(process.cwd(), "src/main.tsx"), "utf8");
    expect(source).toContain("default: module.LegacyAssessment");
    expect(source).not.toContain("default: module.Assessment");
  });
});
