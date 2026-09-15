import { useEffect, useRef, useState, type FormEvent } from "react";
import {
  ASSESSMENT_META,
  BOOKING_IFRAME_TITLE,
  FIT_REVIEW_NAME,
  ONE_PATH_COPY,
} from "../site/publicOffer";
import {
  ASSESSMENT_BOOKING_URL,
  ASSESSMENT_PHONE_HINT,
  validAssessmentPhone,
  assessmentScore,
  QUESTIONS,
  CONTACT_LABELS,
  TEAM_SIZE_OPTIONS,
  INDUSTRY_OPTIONS,
  PRIORITY_OPTIONS,
  buildAssessmentSubmission,
  readAssessmentAttribution,
  type AssessmentContact,
  type AssessmentSubmission,
} from "../domain/assessment";
import "./assessment.css";

const blankContact = () =>
  Object.fromEntries(
    Object.keys(CONTACT_LABELS).map((key) => [key, ""]),
  ) as Record<keyof AssessmentContact, string>;
type Result = { submission: AssessmentSubmission; saved: true };

export function Assessment() {
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [step, setStep] = useState(0);
  const [answerCooldown, setAnswerCooldown] = useState(false);
  const cooldown = useRef<ReturnType<typeof setTimeout> | null>(null);
  const heading = useRef<HTMLHeadingElement>(null);
  const complete = step === QUESTIONS.length;
  const score = complete ? assessmentScore(answers) : null;

  useEffect(() => {
    document.title = "Operations Assessment | Wonder & Workflow";
    let description = document.querySelector<HTMLMetaElement>(
      'meta[name="description"]',
    );
    if (!description) {
      description = document.createElement("meta");
      description.name = "description";
      document.head.appendChild(description);
    }
    description.content =
      ASSESSMENT_META;
    let canonical = document.querySelector<HTMLLinkElement>(
      'link[rel="canonical"]',
    );
    if (!canonical) {
      canonical = document.createElement("link");
      canonical.rel = "canonical";
      document.head.appendChild(canonical);
    }
    canonical.href = "https://wonderworkflow.com/assessment";
    return () => {
      if (cooldown.current) clearTimeout(cooldown.current);
    };
  }, []);
  useEffect(() => {
    heading.current?.focus();
  }, [step]);

  const chooseAnswer = (value: number) => {
    if (cooldown.current || complete) return;
    setAnswers((previous) => ({ ...previous, [QUESTIONS[step].key]: value }));
    setAnswerCooldown(true);
    cooldown.current = setTimeout(() => {
      cooldown.current = null;
      setAnswerCooldown(false);
    }, 300);
    setStep((previous) => previous + 1);
  };

  return (
    <div className="assessment-page">
      <header className="assessment-header">
        <a
          href="/"
          className="assessment-wordmark"
          aria-label="Wonder & Workflow home"
        >
          <img src="/brand/emblem.png" alt="" width="40" height="48" />
          <span>Wonder &amp; Workflow</span>
        </a>
        <span>OPERATIONS ASSESSMENT</span>
      </header>
      <main className="assessment-main">
        {!complete && (
          <section
            className="assessment-form-panel assessment-step"
            key={QUESTIONS[step].key}
            aria-label="Current question"
          >
            <p className="assessment-eyebrow">
              Question {step + 1} of {QUESTIONS.length} · About 2 minutes
            </p>
            <progress
              className="assessment-progress"
              value={step + 1}
              max={QUESTIONS.length}
              aria-label="Assessment progress"
            />
            <h1 className="assessment-step-heading" ref={heading} tabIndex={-1}>
              {QUESTIONS[step].label}
            </h1>
            <p className="assessment-section-copy">
              Choose the answer closest to your current situation. Selecting an
              answer continues to the next step.
            </p>
            <div className="assessment-options">
              {QUESTIONS[step].options.map((label, value) => (
                <button
                  type="button"
                  className="assessment-option"
                  key={label}
                  aria-pressed={answers[QUESTIONS[step].key] === value}
                  disabled={answerCooldown}
                  onClick={(event) => {
                    if (event.detail <= 1) chooseAnswer(value);
                  }}
                >
                  {label}
                </button>
              ))}
            </div>
            <button
              type="button"
              className="assessment-back"
              onClick={() => setStep((previous) => Math.max(0, previous - 1))}
              disabled={step === 0}
            >
              Back
            </button>
          </section>
        )}
        {score && (
          <section
            className="assessment-result assessment-step"
            aria-label="Assessment result"
          >
            <p className="assessment-eyebrow">
              Your indicative AI operations score
            </p>
            <h1 className="assessment-score" ref={heading} tabIndex={-1}>
              {score.score} / {score.max_score}
            </h1>
            <p>
              <strong>{score.tier}</strong>
            </p>
            <p>
              This score reflects your answers. It is not an independent
              diagnosis, a recommendation to buy services, or proof of potential
              savings.
            </p>
            <p>
              Your answers stay in this browser tab. Share your result when you
              contact us.
            </p>
            <p className="assessment-small">
              Refreshing or leaving this page clears the result. We have not
              sent your answers or collected contact details.
            </p>
            <p>
              <a className="assessment-button" href="/contact">
                Discuss your result
              </a>
            </p>
            <p>
              <a href="mailto:operations@wonderworkflow.com">
                Email operations@wonderworkflow.com
              </a>
            </p>
            <button
              type="button"
              className="assessment-back"
              onClick={() => setStep(0)}
            >
              Review answers
            </button>
            <details>
              <summary>Your answers</summary>
              <dl>
                {QUESTIONS.map((question) => (
                  <div key={question.key}>
                    <dt>{question.label}</dt>
                    <dd>{question.options[answers[question.key]]}</dd>
                  </div>
                ))}
              </dl>
            </details>
          </section>
        )}
      </main>
      <footer className="assessment-footer">
        <span>Wonder&amp;Workflow LLC · Operations</span>
        <a href="mailto:operations@wonderworkflow.com">
          operations@wonderworkflow.com
        </a>
        <a
          href="/terms"
          target="_blank"
          rel="noopener noreferrer"
          aria-label="Terms & Conditions (opens in a new tab)"
        >
          Terms &amp; Conditions
        </a>
        <a
          href="/privacy"
          target="_blank"
          rel="noopener noreferrer"
          aria-label="Privacy (opens in a new tab)"
        >
          Privacy
        </a>
        <a href="/contact">Contact</a>
      </footer>
    </div>
  );
}

// Public assessment flow: validates and saves server-side before showing the booking calendar.
export function LegacyAssessment() {
  useEffect(() => {
    document.title = "Operations Assessment | Wonder & Workflow";
    document
      .querySelector('meta[name="description"]')
      ?.setAttribute(
        "content",
        ASSESSMENT_META,
      );
    let canonical = document.querySelector<HTMLLinkElement>(
      'link[rel="canonical"]',
    );
    if (!canonical) {
      canonical = document.createElement("link");
      canonical.rel = "canonical";
      document.head.appendChild(canonical);
    }
    canonical.href = "https://wonderworkflow.com/assessment";
  }, []);
  const [contact, setContact] = useState(blankContact);
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [step, setStep] = useState(0);
  const [answerCooldown, setAnswerCooldown] = useState(false);
  const cooldown = useRef<ReturnType<typeof setTimeout> | null>(null);
  const stepHeading = useRef<HTMLHeadingElement>(null);
  const [accepting, setAccepting] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(false);
  const [saved, setSaved] = useState(false);
  const [status, setStatus] = useState("");
  const [error, setError] = useState(false);
  const [result, setResult] = useState<Result | null>(null);
  const [honeypot, setHoneypot] = useState("");
  const [calendarKey, setCalendarKey] = useState(0);
  const pending = useRef<{
    submission: AssessmentSubmission;
    body: string;
  } | null>(null);
  const locked = Boolean(pending.current);

  useEffect(() => {
    const controller = new AbortController();
    let active = true;
    const timeout = setTimeout(() => controller.abort(), 8000);
    void fetch("/api/integration-status", {
      method: "GET",
      credentials: "same-origin",
      redirect: "error",
      cache: "no-store",
      signal: controller.signal,
    })
      .then(async (response) => {
        if (!response.ok) throw new Error("Status unavailable");
        const data: unknown = await response.json();
        if (active)
          setAccepting(
            Boolean(
              data &&
              typeof data === "object" &&
              "acceptingSubmissions" in data &&
              data.acceptingSubmissions === true,
            ),
          );
      })
      .catch(() => {
        if (active) setAccepting(false);
      })
      .finally(() => clearTimeout(timeout));
    return () => {
      active = false;
      clearTimeout(timeout);
      controller.abort();
    };
  }, []);

  useEffect(() => {
    stepHeading.current?.focus();
  }, [step, result]);

  useEffect(
    () => () => {
      if (cooldown.current) clearTimeout(cooldown.current);
    },
    [],
  );

  const back = () => {
    if (pending.current || loading || saved) return;
    setResult(null);
    setStep((previous) => Math.max(0, previous - 1));
  };
  const chooseAnswer = (value: number) => {
    if (
      pending.current ||
      loading ||
      saved ||
      cooldown.current ||
      step < 0 ||
      step >= QUESTIONS.length
    )
      return;
    const question = QUESTIONS[step];
    setAnswers((previous) => ({ ...previous, [question.key]: value }));
    // Advance immediately, but ignore the second activation of a rapid double click.
    setAnswerCooldown(true);
    cooldown.current = setTimeout(() => {
      cooldown.current = null;
      setAnswerCooldown(false);
    }, 300);
    setStep(step + 1);
  };

  const changeContact = (key: keyof AssessmentContact, value: string) => {
    if (pending.current || loading || saved) return;
    setContact((previous) => ({ ...previous, [key]: value }));
    setResult(null);
  };
  const input = (
    key: keyof AssessmentContact,
    options: {
      type?: string;
      required?: boolean;
      maxLength: number;
      autoComplete?: string;
      placeholder?: string;
      wide?: boolean;
      hint?: string;
    },
  ) => (
    <label
      className={`assessment-field ${options.wide ? "assessment-field-wide" : ""}`}
      key={key}
    >
      <span>
        {CONTACT_LABELS[key]}
        {options.required ? " *" : ""}
      </span>
      {key === "bottleneck_details" ? (
        <textarea
          aria-label={CONTACT_LABELS[key]}
          name={key}
          value={contact[key]}
          onChange={(event) => changeContact(key, event.target.value)}
          maxLength={options.maxLength}
          rows={3}
          placeholder={options.placeholder}
        />
      ) : (
        <input
          aria-label={CONTACT_LABELS[key]}
          name={key}
          type={options.type ?? "text"}
          required={options.required}
          value={contact[key]}
          onChange={(event) => {
            changeContact(key, event.target.value);
            if (key === "phone")
              event.currentTarget.setCustomValidity(
                validAssessmentPhone(event.target.value)
                  ? ""
                  : ASSESSMENT_PHONE_HINT,
              );
          }}
          maxLength={options.maxLength}
          autoComplete={options.autoComplete}
          placeholder={options.placeholder}
        />
      )}
      {options.hint && <span className="assessment-small">{options.hint}</span>}
    </label>
  );
  const select = (
    key: "team_size" | "industry" | "operational_priority",
    options: readonly string[],
    placeholder: string,
  ) => (
    <label
      className={`assessment-field ${key === "operational_priority" ? "assessment-field-wide" : ""}`}
    >
      <span>{CONTACT_LABELS[key]} *</span>
      <select
        aria-label={CONTACT_LABELS[key]}
        name={key}
        value={contact[key]}
        onChange={(event) => changeContact(key, event.target.value)}
        required
      >
        <option value="">{placeholder}</option>
        {options.map((option) => (
          <option key={option}>{option}</option>
        ))}
      </select>
    </label>
  );

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (
      loading ||
      saved ||
      step !== QUESTIONS.length ||
      accepting === null ||
      !event.currentTarget.reportValidity()
    )
      return;
    setError(false);
    setStatus("");
    setResult(null);
    try {
      const submission =
        pending.current?.submission ??
        buildAssessmentSubmission(contact, answers, {
          submissionId: crypto.randomUUID(),
          submittedAt: new Date().toISOString(),
          attribution: readAssessmentAttribution(window.location.search),
        });
      if (!accepting) {
        setLoading(true);
        const response = await fetch("/api/integration-status", {
          credentials: "same-origin",
          cache: "no-store",
          redirect: "error",
          signal: AbortSignal.timeout(8000),
        });
        const availability =
          response.ok &&
          response.headers.get("content-type")?.includes("application/json")
            ? await response.json()
            : null;
        if (availability?.acceptingSubmissions !== true) {
          throw new Error(
            "We can’t save your assessment right now. Your answers are still here. Please try again shortly.",
          );
        }
        setAccepting(true);
      }
      pending.current ??= {
        submission,
        body: JSON.stringify({ ...submission, website_confirm: honeypot }),
      };
      setLoading(true);
      setStatus("Saving your request…");
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 15000);
      try {
        const response = await fetch("/api/assessment", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Idempotency-Key": submission.submission_id,
          },
          body: pending.current.body,
          credentials: "same-origin",
          redirect: "error",
          signal: controller.signal,
        });
        if (!response.ok) throw new Error("Save not confirmed");
        const acknowledgment: unknown = await response.json();
        if (
          !acknowledgment ||
          typeof acknowledgment !== "object" ||
          !("contact_saved" in acknowledgment) ||
          acknowledgment.contact_saved !== true ||
          !("submission_id" in acknowledgment) ||
          acknowledgment.submission_id !== submission.submission_id ||
          !("booking_url" in acknowledgment) ||
          acknowledgment.booking_url !== ASSESSMENT_BOOKING_URL
        )
          throw new Error("Invalid save acknowledgment");
        setSaved(true);
        setResult({ submission, saved: true });
        setStatus(
          `Your request was saved. Choose your complimentary ${FIT_REVIEW_NAME} when you are ready.`,
        );
      } finally {
        clearTimeout(timeout);
      }
    } catch (failure) {
      setError(true);
      setStatus(
        pending.current
          ? "We could not confirm your request was saved. Your entries are still here. Retry sends the same original request safely; keep this page open."
          : failure instanceof Error
            ? failure.message
            : "Review the required fields and answer each assessment question.",
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="assessment-page">
      <header className="assessment-header">
        <a
          href="/"
          className="assessment-wordmark"
          aria-label="Wonder & Workflow home"
        >
          <img src="/brand/emblem.png" alt="" width="40" height="48" />
          <span>Wonder &amp; Workflow</span>
        </a>
        <span>OPERATIONS ASSESSMENT</span>
      </header>
      <main className="assessment-main">
        {step >= 0 && step < QUESTIONS.length && !result && (
          <section
            className="assessment-form-panel assessment-step"
            key={QUESTIONS[step].key}
            aria-label="Current question"
          >
            <p className="assessment-eyebrow">
              Question {step + 1} of {QUESTIONS.length} · About 2 minutes
            </p>
            <progress
              className="assessment-progress"
              value={step + 1}
              max={QUESTIONS.length}
              aria-label="Assessment progress"
            />
            <h1
              className="assessment-step-heading"
              ref={stepHeading}
              tabIndex={-1}
            >
              {QUESTIONS[step].label}
            </h1>
            <p className="assessment-section-copy">
              Choose the answer closest to your current situation. Selecting an
              answer continues to the next step.
            </p>
            <div className="assessment-options">
              {QUESTIONS[step].options.map((label, value) => (
                <button
                  type="button"
                  className="assessment-option"
                  key={label}
                  aria-pressed={answers[QUESTIONS[step].key] === value}
                  disabled={answerCooldown || locked || loading || saved}
                  onClick={(event) => {
                    if (event.detail <= 1) chooseAnswer(value);
                  }}
                >
                  {label}
                </button>
              ))}
            </div>
            <button
              type="button"
              className="assessment-back"
              onClick={back}
              disabled={step === 0 || locked || loading || saved}
            >
              Back
            </button>
          </section>
        )}
        {step === QUESTIONS.length && !result && (
          <section
            className="assessment-form-panel assessment-step"
            id="assessment"
          >
            <p className="assessment-eyebrow">
              All {QUESTIONS.length} questions answered · Your details
            </p>
            <h1
              className="assessment-step-heading"
              ref={stepHeading}
              tabIndex={-1}
            >
              Make it relevant to your business.
            </h1>
            <p className="assessment-section-copy">
              Fields marked * are required. Optional details help focus a future
              conversation.
            </p>
            <form
              onSubmit={(event) => void submit(event)}
              aria-label="AI Operations assessment"
            >
              <fieldset
                className="assessment-form-fields"
                disabled={locked || loading || saved}
              >
                <legend className="assessment-sr-only">
                  Your answers and contact information
                </legend>
                <section className="assessment-contact">
                  <div className="assessment-grid">
                    {input("first_name", {
                      required: true,
                      autoComplete: "given-name",
                      maxLength: 100,
                    })}
                    {input("last_name", {
                      required: true,
                      autoComplete: "family-name",
                      maxLength: 100,
                    })}
                    {input("email", {
                      required: true,
                      type: "email",
                      autoComplete: "email",
                      maxLength: 254,
                    })}
                    {input("company", {
                      required: true,
                      autoComplete: "organization",
                      maxLength: 200,
                    })}
                    {select("team_size", TEAM_SIZE_OPTIONS, "Select team size")}
                    {select("industry", INDUSTRY_OPTIONS, "Select industry")}
                    {select(
                      "operational_priority",
                      PRIORITY_OPTIONS,
                      "Select one priority",
                    )}
                  </div>
                  <details>
                    <summary>Add optional details</summary>
                    <div className="assessment-grid">
                      {input("phone", {
                        type: "tel",
                        autoComplete: "tel",
                        maxLength: 50,
                        hint: `${ASSESSMENT_PHONE_HINT} Providing a number does not give SMS marketing consent.`,
                      })}
                      {input("website", {
                        maxLength: 300,
                        placeholder: "example.com",
                      })}
                      {input("role", {
                        autoComplete: "organization-title",
                        maxLength: 150,
                      })}
                      {input("current_tools", {
                        maxLength: 500,
                        placeholder:
                          "Email, spreadsheets, accounting software…",
                      })}
                      {input("bottleneck_details", {
                        maxLength: 2000,
                        wide: true,
                        placeholder:
                          "Describe the process. Please leave out passwords, client details and other sensitive information.",
                      })}
                    </div>
                  </details>
                </section>
                <label className="assessment-sr-only" aria-hidden="true">
                  Leave this field empty
                  <input
                    name="website_confirm"
                    tabIndex={-1}
                    autoComplete="off"
                    value={honeypot}
                    onChange={(event) => {
                      if (!pending.current && !loading && !saved)
                        setHoneypot(event.target.value);
                    }}
                  />
                </label>
              </fieldset>
              <p className="assessment-privacy">
                Your contact details and answers help us prepare for your{" "}
                {FIT_REVIEW_NAME}. This form does not sign you up for
                marketing or SMS. Please leave out passwords, client details and
                other sensitive information.
              </p>
              <p className="assessment-small">
                Your score is indicative, based on your answers. It is not a
                validated diagnosis or an estimate of savings. During the
                complimentary {FIT_REVIEW_NAME}, we {ONE_PATH_COPY.toLowerCase()}
              </p>
              <button
                className="assessment-button"
                type="submit"
                disabled={loading || saved || accepting === null}
              >
                {saved
                  ? "Request Saved"
                  : loading
                    ? "Saving your request…"
                    : pending.current
                      ? "Retry Original Request"
                      : accepting === null
                        ? "Checking availability…"
                        : "Get My AI Operations Score"}
              </button>
              <button
                className="assessment-back"
                type="button"
                onClick={back}
                disabled={locked || loading || saved}
              >
                Back
              </button>
              <p
                className={`assessment-status ${error ? "assessment-error" : ""}`}
                role={error ? "alert" : "status"}
                aria-live="polite"
              >
                {status}
              </p>
            </form>
          </section>
        )}
        {result && (
          <section
            className="assessment-result assessment-step"
            aria-label="Assessment result"
          >
            <p className="assessment-eyebrow">
              YOUR INDICATIVE OPERATIONS SCORE
            </p>
            <h1 className="assessment-score" ref={stepHeading} tabIndex={-1}>
              {result.submission.score} / {result.submission.max_score}
            </h1>
            <p>
              <strong>{result.submission.tier}</strong>
            </p>
            <p>
              Your assessment is saved. Choose a time below to discuss your
              results. {ONE_PATH_COPY}
            </p>
            <p className="assessment-small">
              This score is based on your answers. We’ll explore what it means
              for your business during your review.
            </p>
            <section
              className="assessment-booking"
              aria-labelledby="assessment-booking-title"
            >
              <p className="assessment-eyebrow">Your next step</p>
              <h2 id="assessment-booking-title">
                Book your {FIT_REVIEW_NAME}
              </h2>
              <p>Complimentary · 30 minutes</p>
              <p className="assessment-small">
                Use the same email address you entered in your assessment so we
                can match your booking.
              </p>
              <iframe
                key={calendarKey}
                className="assessment-calendar"
                src={ASSESSMENT_BOOKING_URL}
                title={BOOKING_IFRAME_TITLE}
                referrerPolicy="no-referrer"
              />
              <p className="assessment-small">
                Calendar not loading?{" "}
                <button
                  type="button"
                  className="assessment-calendar-reload"
                  onClick={() => setCalendarKey((value) => value + 1)}
                >
                  Reload calendar
                </button>
              </p>
            </section>
          </section>
        )}
      </main>
      <footer className="assessment-footer">
        <span>Wonder&amp;Workflow LLC · Operations</span>
        <a href="mailto:operations@wonderworkflow.com">
          operations@wonderworkflow.com
        </a>
        <a
          href="/terms"
          target="_blank"
          rel="noopener noreferrer"
          aria-label="Terms & Conditions (opens in a new tab)"
        >
          Terms &amp; Conditions
        </a>
        <a
          href="/privacy"
          aria-label="Privacy (opens in a new tab)"
          target="_blank"
          rel="noopener noreferrer"
        >
          Privacy
        </a>
        <a
          href="/start"
          aria-label="Operations Fit Review (opens in a new tab)"
          target="_blank"
          rel="noopener noreferrer"
        >
          {FIT_REVIEW_NAME}
        </a>
      </footer>
    </div>
  );
}

export default Assessment;
