import type { Session } from "../domain/types";

export function MeetingPrep({ session }: { session: Session }) {
  const intake = session.intake;
  if (!intake) return null;
  const { packet } = intake;
  const conflicts = intake.conflicts
    .map((conflict) => {
      const [area, field] = conflict.field.split(".") as [
        "client" | "worksheet",
        string,
      ];
      const current = (
        session[area] as unknown as Record<string, string | number | null>
      )[field];
      return { ...conflict, current };
    })
    .filter((conflict) => conflict.current !== conflict.incoming);
  const assessment = packet.assessment;
  const technicalAnswer = (id: string) =>
    assessment?.sourceId === "mccann-ai-operations-assessment" &&
    (id.endsWith(".score") || /^(assessment|consent|attribution)\./.test(id));
  const visibleAnswers =
    assessment?.answers.filter((answer) => !technicalAnswer(answer.id)) ?? [];
  const questionCount = visibleAnswers.filter(
    (answer) => !answer.id.startsWith("context."),
  ).length;
  const research = packet.research;
  const meeting = new Intl.DateTimeFormat(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: packet.timezone,
  }).format(new Date(packet.startsAt));
  return (
    <details className="meeting-prep no-print" open>
      <summary>
        <span>Before the call</span>
        <small>
          {assessment ? "Assessment available" : "Assessment missing"}
        </small>
      </summary>
      <div className="meeting-prep-content">
        <p className="muted">
          {meeting} · {packet.timezone} · {packet.bookingStatus}
        </p>
        {!assessment && (
          <p className="notice">
            This booking has no assessment attached yet. Confirm the prospect’s
            submission before treating their answers as complete.
          </p>
        )}
        {conflicts.length > 0 && (
          <details className="optional-details" open>
            <summary>New information to review · {conflicts.length}</summary>
            <div>
              <p className="muted">
                Your edits were kept. Review these incoming changes before
                updating the worksheet.
              </p>
              <dl className="prep-answers">
                {conflicts.map((conflict) => (
                  <div key={conflict.field}>
                    <dt>
                      {conflict.field
                        .replace(/^(client|worksheet)\./, "")
                        .replace(/([A-Z])/g, " $1")}
                    </dt>
                    <dd>
                      Your value:{" "}
                      {String(conflict.current ?? "Not established")}
                    </dd>
                    <dd>
                      Incoming value:{" "}
                      {String(conflict.incoming ?? "Not established")}
                    </dd>
                  </div>
                ))}
              </dl>
            </div>
          </details>
        )}
        {assessment && (
          <details className="optional-details">
            <summary>Original assessment answers · {questionCount}</summary>
            <div>
              <p className="muted">
                Submitted {new Date(assessment.submittedAt).toLocaleString()} ·
                Version {assessment.version}
                {assessment.score != null ? ` · ${assessment.score}/21` : ""}
              </p>
              <p className="muted">
                These are the submitted answers. They may still need
                clarification during the call.
              </p>
              <dl className="prep-answers">
                {visibleAnswers.map((answer) => (
                  <div key={answer.id}>
                    <dt>{answer.question}</dt>
                    <dd>
                      {Array.isArray(answer.value)
                        ? answer.value.join(", ")
                        : String(answer.value ?? "Not answered")}
                    </dd>
                  </div>
                ))}
              </dl>
              {assessment.answers.some((answer) =>
                technicalAnswer(answer.id),
              ) && (
                <details className="optional-details">
                  <summary>Submission details</summary>
                  <dl className="prep-answers">
                    {assessment.answers
                      .filter((answer) => technicalAnswer(answer.id))
                      .map((answer) => (
                        <div key={answer.id}>
                          <dt>{answer.question}</dt>
                          <dd>
                            {Array.isArray(answer.value)
                              ? answer.value.join(", ")
                              : String(answer.value ?? "Not answered")}
                          </dd>
                        </div>
                      ))}
                  </dl>
                </details>
              )}
            </div>
          </details>
        )}
        {!!research?.facts.length && (
          <details className="optional-details">
            <summary>
              Business background · {research.facts.length} sourced notes
            </summary>
            <div>
              <p className="muted">
                Research is separate from the prospect’s answers. Confirm
                relevant details during the call.
              </p>
              <ul className="prep-research">
                {research.facts.map((fact, index) => (
                  <li key={index}>
                    <p>{fact.text}</p>
                    <a
                      href={fact.sourceUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      referrerPolicy="no-referrer"
                    >
                      {fact.sourceTitle}
                    </a>
                    <small>
                      {" "}
                      · Checked {new Date(fact.accessedAt).toLocaleDateString()}
                    </small>
                  </li>
                ))}
              </ul>
            </div>
          </details>
        )}
        {!!research?.suggestedQuestions.length && (
          <div className="prep-questions">
            <h3>Questions to focus on</h3>
            <ul>
              {research.suggestedQuestions.map((question, index) => (
                <li key={index}>{question}</li>
              ))}
            </ul>
          </div>
        )}
        {!research && (
          <p className="muted small-text">
            Business research has not been attached.
          </p>
        )}
      </div>
    </details>
  );
}
