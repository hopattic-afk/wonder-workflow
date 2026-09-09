import type { Config, Context } from "@netlify/functions";
import { createBridge } from "../../server/bridge";
import { readConfig } from "../../server/config";
import { productionStore } from "../../server/storage";
import { HttpGhl } from "../../server/ghl";
import { fetchPublicWebsiteFacts } from "../../server/publicWebsite";
import { AssessmentCrmSync, readCrmSyncConfig } from "../../server/crmSync";

export default async (
  request: Request,
  context: Context,
): Promise<Response> => {
  const fixedWonderWorkflowConfig: Record<string, string> = {
    WW_CRM_SYNC_ENABLED: "true",
    WW_CRM_FIRST_ASSESSMENT_FIELD_ID: "DVSkC38kqSDaATaoxUZ9",
    WW_CRM_LATEST_ASSESSMENT_FIELD_ID: "C18h3CIbr4s073Ocx4PN",
    WW_CRM_FIELDS_VERIFIED: "true",
    WW_CRM_ASSESSMENT_TAG_ENABLED: "false",
    WW_CRM_TAG_WORKFLOWS_REVIEWED: "false",
    WW_PUBLIC_RESEARCH_ENABLED: "false",
  };
  const env = (key: string) =>
    fixedWonderWorkflowConfig[key] ?? Netlify.env.get(key);
  const config = readConfig(env);
  try {
    // Do not touch storage or construct a credential-bearing client when disabled.
    if (!config)
      return createBridge({ config: null, store: null!, ghl: null! })(
        request,
        context.ip,
      );
    const store = productionStore();
    const crmConfig = readCrmSyncConfig(env, config);
    const crm = crmConfig ? new AssessmentCrmSync(crmConfig, store) : null;
    const crmReadiness = {
      syncEnabled: env("WW_CRM_SYNC_ENABLED") === "true",
      fieldsVerified: env("WW_CRM_FIELDS_VERIFIED") === "true",
      firstFieldPresent: Boolean(env("WW_CRM_FIRST_ASSESSMENT_FIELD_ID")),
      latestFieldPresent: Boolean(env("WW_CRM_LATEST_ASSESSMENT_FIELD_ID")),
      tagConfigurationSafe:
        env("WW_CRM_ASSESSMENT_TAG_ENABLED") !== "true" ||
        env("WW_CRM_TAG_WORKFLOWS_REVIEWED") === "true",
    };
    return createBridge({
      config,
      store,
      ghl: new HttpGhl(config),
      crmReadiness,
      ...(crm ? { crmSync: (input, signal) => crm.sync(input, signal) } : {}),
      ...(config.publicResearch ? { research: fetchPublicWebsiteFacts } : {}),
    })(request, context.ip);
  } catch {
    return new Response(
      JSON.stringify({
        error: "Integration storage is unavailable.",
        acceptingSubmissions: false,
      }),
      {
        status: 503,
        headers: {
          "Content-Type": "application/json",
          "Cache-Control": "no-store",
          "X-Content-Type-Options": "nosniff",
        },
      },
    );
  }
};
export const config: Config = {
  path: [
    "/api/assessment",
    "/api/booking",
    "/api/integration-status",
    "/api/session",
    "/api/inbox",
  ],
};
