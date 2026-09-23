import { useEffect } from "react";
import {
  DIAGNOSTIC_EMBED_SCRIPT,
  DIAGNOSTIC_FORM_ID,
  DIAGNOSTIC_FORM_NAME,
  DIAGNOSTIC_FORM_SRC,
  DIAGNOSTIC_IFRAME_ID,
} from "./diagnosticForm";

export function DiagnosticIntakeForm() {
  useEffect(() => {
    const selector = `script[src="${DIAGNOSTIC_EMBED_SCRIPT}"]`;
    if (document.querySelector(selector)) return;
    const script = document.createElement("script");
    script.src = DIAGNOSTIC_EMBED_SCRIPT;
    script.async = true;
    document.body.appendChild(script);
  }, []);

  return (
    <div className="ww-diagnostic-embed">
      <iframe
        src={DIAGNOSTIC_FORM_SRC}
        id={DIAGNOSTIC_IFRAME_ID}
        title={DIAGNOSTIC_FORM_NAME}
        data-layout="{'id':'INLINE'}"
        data-trigger-type="alwaysShow"
        data-trigger-value=""
        data-activation-type="alwaysActivated"
        data-activation-value=""
        data-deactivation-type="neverDeactivate"
        data-deactivation-value=""
        data-form-name={DIAGNOSTIC_FORM_NAME}
        data-height="undefined"
        data-layout-iframe-id={DIAGNOSTIC_IFRAME_ID}
        data-form-id={DIAGNOSTIC_FORM_ID}
        data-cookie-consent="true"
        data-cookie-consent-provider="auto"
        referrerPolicy="no-referrer"
      />
    </div>
  );
}
