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
  const config = readConfig((key) => Netlify.env.get(key));
  try {
    // Do not touch storage or construct a credential-bearing client when disabled.
    if (!config)
      return createBridge({ config: null, store: null!, ghl: null! })(
        request,
        context.ip,
      );
    const store = productionStore();
    const crmConfig = readCrmSyncConfig((key) => Netlify.env.get(key), config);
    const crm = crmConfig ? new AssessmentCrmSync(crmConfig, store) : null;
    return createBridge({
      config,
      store,
      ghl: new HttpGhl(config),
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
