import { useEffect, useRef, useState, type ComponentProps } from "react";
import {
  Link as RouterLink,
  NavLink as RouterNavLink,
  Navigate,
  Route,
  Routes,
  useLocation,
} from "react-router-dom";
import { BrandLockup } from "./BrandLockup";
import { OwnershipPathScroll } from "./OwnershipPathScroll";
import { captureCampaign, publicHref } from "./campaign";
import {
  ASSESSMENT_META,
  FIT_REVIEW_NAME,
  FIT_REVIEW_PLAIN,
  FOOTER_BLURB,
  HOME_DECK,
  HOME_DESCRIPTION,
  HOME_EYEBROW,
  HOME_H1,
  HOME_TITLE,
  LADDER_NOTE,
  ONE_PATH_COPY,
  TOOL_AGNOSTIC_COPY,
  TRUST_LINE,
  WHO_FOR_BODY,
  WHO_FOR_EXCLUDE,
} from "./publicOffer";
import { AssessmentCaseStudy, GuidePage, GuidesIndex, ServiceDirectory, ServicePage, applyStructuredData, guides, honestyFaqs, searchPages, services } from "./SearchContent";
import "./website.css";

function Link(props: ComponentProps<typeof RouterLink>) {
  return (
    <RouterLink
      {...props}
      to={typeof props.to === "string" ? publicHref(props.to) : props.to}
    />
  );
}
function NavLink(props: ComponentProps<typeof RouterNavLink>) {
  return (
    <RouterNavLink
      {...props}
      to={typeof props.to === "string" ? publicHref(props.to) : props.to}
    />
  );
}
export const pages: Record<string, [string, string]> = {
  "/": [HOME_TITLE, HOME_DESCRIPTION],
  "/services": [
    "Operations Fit Review, diagnostic, and implementation",
    "Start with a complimentary Operations Fit Review, then a paid diagnostic scoped after the review, implementation, and optional support. Software and vendor costs stay separate.",
  ],
  "/how-we-work": [
    "How We Map How Work Gets Done",
    "See how Wonder & Workflow maps one real path of work, picks one improvement, tests it, and leaves people in control.",
  ],
  "/about": [
    "About Wonder & Workflow",
    "Wonder & Workflow helps owner-led field and service shops improve how work gets done through careful discovery, proportionate technology, testing, and clear ownership.",
  ],
  "/start": ["Start With an Operations Assessment", ASSESSMENT_META],
  "/privacy": [
    "Privacy",
    "How Wonder & Workflow handles website, assessment, consultation, and project information.",
  ],
  "/terms": [
    "Terms & Conditions",
    "Terms for using Wonder & Workflow's website, operations assessment, and consultation services.",
  ],
  "/contact": [
    "Contact Wonder & Workflow",
    "Contact Wonder&Workflow LLC about an Operations Fit Review, a project, or an existing inquiry.",
  ],
  ...searchPages,
};
const canonicalPaths: Record<string, string> = {
  "/ai-operations": "/services",
  "/book": "/start",
  "/pricing": "/services",
};
function Arrow() {
  return <span aria-hidden="true">↗</span>;
}
function Cta({ secondary = false }: { secondary?: boolean }) {
  return (
    <Link className={secondary ? "ww-text-link" : "ww-button"} to="/assessment">
      Assess your operations <Arrow />
    </Link>
  );
}
function Eyebrow({ children }: { children: React.ReactNode }) {
  return <p className="ww-eyebrow">{children}</p>;
}
function NextStepNote() {
  return <p className="ww-cta-ladder">{LADDER_NOTE}</p>;
}
function Invitation({
  title = "Find where jobs get stuck between intake and paid.",
  copy = `Take the 2-minute assessment, leave your details, and book a complimentary ${FIT_REVIEW_NAME}. We’ll look at your results together and pick one improvement worth doing.`,
}: {
  title?: string;
  copy?: string;
}) {
  return (
    <section className="ww-invitation">
      <Eyebrow>Get started</Eyebrow>
      <h2>{title}</h2>
      <div>
        <p>{copy}</p>
        <Link className="ww-button" to="/assessment">
          Assess your operations <Arrow />
        </Link>
        <NextStepNote />
        <Link className="ww-text-link" to="/how-we-work">
          How the process works <Arrow />
        </Link>
      </div>
    </section>
  );
}
function CopySection({
  label,
  title,
  children,
}: {
  label: string;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="ww-section ww-intro">
      <Eyebrow>{label}</Eyebrow>
      <div>
        <h2>{title}</h2>
        {children}
      </div>
    </section>
  );
}
function BulletList({ items }: { items: string[] }) {
  return (
    <ul className="ww-copy-list">
      {items.map((item) => (
        <li key={item}>{item}</li>
      ))}
    </ul>
  );
}
function Flow() {
  return (
    <div
      className="ww-flow"
      aria-label="Example workflow: receive information, organize it, review with a person, and move work forward"
    >
      <div className="ww-flow-caption">
        Example workflow <span>Illustrative workflow</span>
      </div>
      <div className="ww-flow-line">
        <div>
          <span>01 / INPUT</span>
          <h3>
            Information
            <br />
            arrives.
          </h3>
          <p>Forms, files & requests</p>
        </div>
        <b aria-hidden="true">→</b>
        <div>
          <span>02 / STRUCTURE</span>
          <h3>
            Context
            <br />
            takes shape.
          </h3>
          <p>Organized & prepared</p>
        </div>
        <b aria-hidden="true">→</b>
        <div className="ww-flow-human">
          <span>03 / HUMAN REVIEW</span>
          <h3>
            Your team
            <br />
            decides.
          </h3>
          <p>Judgment stays with people</p>
        </div>
        <b aria-hidden="true">→</b>
        <div>
          <span>04 / HANDOFF</span>
          <h3>
            Work moves
            <br />
            forward.
          </h3>
          <p>Clear owner & next step</p>
        </div>
      </div>
    </div>
  );
}
function Home() {
  return (
    <div className="ww-home">
      <section className="ww-hero ww-home-hero">
        <div className="ww-home-hero-heading">
          <div>
            <Eyebrow>{HOME_EYEBROW}</Eyebrow>
            <h1 tabIndex={-1}>{HOME_H1}</h1>
          </div>
          <div className="ww-home-hero-intro">
            <p>{HOME_DECK}</p>
            <p className="ww-tool-line">{TOOL_AGNOSTIC_COPY}</p>
            <Link className="ww-button" to="/assessment">
              Assess your operations <Arrow />
            </Link>
            <p className="ww-trust-note">{TRUST_LINE}</p>
          </div>
        </div>
      </section>
      <OwnershipPathScroll />
      <section className="ww-section ww-who-for">
        <div className="ww-section-heading">
          <Eyebrow>Who this is for</Eyebrow>
          <h2>Built for shops where the owner still holds the day together</h2>
        </div>
        <p>{WHO_FOR_BODY}</p>
        <p className="ww-exclude">{WHO_FOR_EXCLUDE}</p>
      </section>
      <section className="ww-section">
        <div className="ww-section-heading">
          <Eyebrow>Where work gets stuck</Eyebrow>
          <h2>What usually slows the day down</h2>
        </div>
        <div className="ww-problem-list">
          {[
            [
              "Missed intake",
              "Calls and texts while you’re on the tools. Leads slip. Jobs get double-booked.",
            ],
            [
              "Handoffs that leak",
              "The office has one version of the job. The crew has another. Screenshots and memory fill the gap.",
            ],
            [
              "Admin that chases you",
              "Quotes waiting. Invoices after the fact. Payroll pieced together from texts and paper.",
            ],
          ].map(([title, problem], index) => (
            <article key={title}>
              <span className="ww-index">0{index + 1}</span>
              <h3>{title}</h3>
              <p>{problem}</p>
            </article>
          ))}
        </div>
        <p className="ww-bridge">
          If nothing moves without you, the process is the product.
        </p>
      </section>
      <section className="ww-section ww-home-process">
        <div>
          <Eyebrow>How we work</Eyebrow>
          <h2>One real path of work. One practical improvement.</h2>
          <Link className="ww-text-link" to="/how-we-work">
            See how we work <Arrow />
          </Link>
        </div>
        <ol>
          <li>
            <h3>Walk it</h3>
            <p>
              Sit with the person doing the work and follow one live example
              (request to done to paid).
            </p>
          </li>
          <li>
            <h3>Simplify it</h3>
            <p>
              Pick the smallest change that removes the stuck point. Agree scope
              before anything is built.
            </p>
          </li>
          <li>
            <h3>Hand it over</h3>
            <p>
              Test on real jobs. Leave clear owners, instructions, and a
              fallback.
            </p>
          </li>
        </ol>
      </section>
      <section className="ww-section ww-ladder">
        <div className="ww-section-heading">
          <Eyebrow>What happens next</Eyebrow>
          <h2>A clear ladder. No mystery pitch.</h2>
        </div>
        <ol className="ww-ladder-list">
          <li>
            <h3>Operations assessment</h3>
            <p>About 2 minutes, free. Spot where time leaks.</p>
          </li>
          <li>
            <h3>{FIT_REVIEW_NAME}</h3>
            <p>
              30 minutes, complimentary. Review results. Choose one path of work
              to improve.
            </p>
          </li>
          <li>
            <h3>Paid diagnostic</h3>
            <p>
              Scoped after the Fit Review. Deeper map, priorities, and a written
              next-step plan.
            </p>
          </li>
          <li>
            <h3>Implementation</h3>
            <p>Fixed scope when it’s worth it. Build and hand over the change.</p>
          </li>
          <li>
            <h3>Optional support</h3>
            <p>Only if you want ongoing help after the handoff.</p>
          </li>
        </ol>
        <p>Software and vendor costs stay separate from our work. No public fees.</p>
      </section>
      <section className="ww-section ww-proof">
        <div className="ww-section-heading">
          <Eyebrow>Proof</Eyebrow>
          <h2>Shops like yours</h2>
        </div>
        <div className="ww-proof-grid">
          <article>
            <h3>What we can show today</h3>
            <p>
              Case studies and owner quotes land here when we have real ones.
              Until then: no invented testimonials.
            </p>
            <Link
              className="ww-text-link"
              to="/case-studies/operations-assessment"
            >
              First-party implementation study <Arrow />
            </Link>
          </article>
        </div>
      </section>
      <Invitation />
    </div>
  );
}
function PageHero({
  number,
  label,
  title,
  accent,
  copy,
}: {
  number: string;
  label: string;
  title: string;
  accent: string;
  copy: string;
}) {
  return (
    <section className="ww-page-hero ww-strategy-page-hero">
      <Eyebrow>
        {number} / {label}
      </Eyebrow>
      <h1>
        {title}
        <br />
        <em>{accent}</em>
      </h1>
      <p>{copy}</p>
    </section>
  );
}
const faqs = honestyFaqs;
function Services() {
  return (
    <>
      <PageHero
        number="01"
        label="Operations help for field and service shops"
        title="Start small enough to understand."
        accent="Build well enough to depend on."
        copy="Every engagement begins with one real path of work, a named owner, and an observable problem. We expand only after the first result is understood."
      />
      <section className="ww-service-details ww-offer-details">
        <article>
          <span className="ww-eyebrow">01</span>
          <div>
            <Eyebrow>Complimentary · 30 minutes</Eyebrow>
            <h2>{FIT_REVIEW_NAME}</h2>
          </div>
          <div>
            <h3>Decide whether this is worth solving, and how.</h3>
            <p>
              <strong>For you if:</strong> A recurring process is frustrating,
              but you do not yet know whether the answer is a clearer procedure,
              better use of what you already own, automation, or AI.
            </p>
            <p>
              <strong>What we do:</strong> {ONE_PATH_COPY} We review its
              trigger, people, tools, repeated effort, exceptions, and business
              consequence.
            </p>
            <p>
              <strong>What you receive:</strong> A concise next-step note naming
              the likely approach, important unknowns, and the recommended
              decision.
            </p>
            <p>
              <strong>What this is not:</strong> A full technical specification,
              security review, compliance opinion, or production change.
            </p>
            <Cta />
            <NextStepNote />
          </div>
        </article>
        <article>
          <span className="ww-eyebrow">02</span>
          <h2>Paid diagnostic</h2>
          <div>
            <h3>
              Turn a frustrating process into an implementation-ready decision.
            </h3>
            <p>
              <strong>What you receive:</strong>
            </p>
            <BulletList
              items={[
                "Current-state map and process boundary.",
                "Baseline for volume, time, delay, rework, and cost where evidence is available.",
                "Tool, information, permission, and dependency map.",
                "Comparison of process, native-feature, automation, and AI options.",
                "Human-decision and exception-handling plan.",
                "Recommended future state, implementation scope, and acceptance tests.",
              ]}
            />
            <p>
              <strong>What we need from you:</strong> The process owner, one
              backup, a walkthrough, sanitized examples, and agreement on what a
              useful result would look like.
            </p>
            <p>
              <strong>Good result:</strong> You can make a grounded proceed,
              revise, or stop decision without buying an unnecessary build.
            </p>
            <Link className="ww-text-link" to="/start">
              Request a diagnostic <Arrow />
            </Link>
            <p className="ww-small">
              Begin with an {FIT_REVIEW_NAME}. Diagnostic deliverables and
              acceptance criteria are confirmed in a separate written scope and
              proposal. Software and vendor costs stay separate.
            </p>
          </div>
        </article>
        <article>
          <span className="ww-eyebrow">03</span>
          <div>
            <Eyebrow>Scoped implementation</Eyebrow>
            <h2>Implementation</h2>
          </div>
          <div>
            <h3>
              Build one improvement. Test everyday cases and exceptions. Leave your team able to
              run it.
            </h3>
            <p>
              <strong>What we deliver:</strong>
            </p>
            <BulletList
              items={[
                "Agreed configuration or integration in client-owned accounts.",
                "Written rules, prompts, permissions, and decision boundaries.",
                "Representative acceptance tests and observed results.",
                "Alerts, exception routing, manual fallback, and rollback procedure.",
                "Operator documentation, administrator notes, and training.",
                "Initial measurement and a defined stabilization period.",
              ]}
            />
            <p>
              <strong>What remains with people:</strong> Commitments,
              exceptions, sensitive judgments, and any decision the agreed risk
              boundary reserves for a person.
            </p>
            <p>
              <strong>What we do not promise:</strong> Perfect output, automatic
              ROI, uninterrupted third-party services, or an autonomous
              business.
            </p>
            <Link className="ww-text-link" to="/start">
              Scope the first improvement <Arrow />
            </Link>
            <p className="ww-small">
              The first step is an {FIT_REVIEW_NAME}. Build scope, commercial terms, and
              stabilization boundaries are agreed separately after diagnostic
              work. Software and vendor costs stay separate.
            </p>
          </div>
        </article>
      </section>
      <CopySection
        label="After launch"
        title="Know who looks after the work."
      >
        <p>
          Every proposal states who watches failures, who reviews exceptions,
          how changes are approved, and what support is included. Ongoing care
          is offered only where we can define real coverage and responsibility;
          it is not an unlimited retainer. Optional support is the last rung on
          the ladder, not the starting offer.
        </p>
      </CopySection>
      <ServiceDirectory />
      <section className="ww-section ww-faq">
        <div className="ww-section-heading">
          <Eyebrow>Questions, answered</Eyebrow>
          <h2>
            Clarity before
            <br />
            <em>commitment.</em>
          </h2>
        </div>
        {faqs.map(([question, answer]) => (
          <details key={question}>
            <summary>{question}</summary>
            <p>{answer}</p>
          </details>
        ))}
      </section>
      <Invitation
        title="A useful first step should reduce uncertainty."
        copy={`Start with the operations assessment. We will discuss your results. ${ONE_PATH_COPY} Then we decide together whether a diagnostic is justified.`}
      />
    </>
  );
}
const steps = [
  [
    "Understand",
    "Understand the real work",
    "We speak with the person doing the work, follow a recent example, identify the source of truth, and include the awkward cases. We separate touch time from waiting, symptoms from causes, and ambition from present capability.",
    "Current-state map, baseline, problem statement, and open questions.",
  ],
  [
    "Simplify",
    "Choose the simplest suitable change",
    "We compare a clearer procedure, a native software feature, conventional automation, and AI-assisted patterns. We consider consequence of error, variability, data sensitivity, permissions, operating cost, and who can maintain the result.",
    "Options comparison and documented proceed/no-go decision.",
  ],
  [
    "Define control",
    "Define control before building",
    "We name the workflow owner, reviewers, backups, approval points, prohibited actions, escalation criteria, maximum queue, and what happens when nobody is available. Access is limited to what the workflow requires.",
    "Decision register, access map, exception plan, and fallback.",
  ],
  [
    "Build & prove",
    "Build and test the edges",
    "We test ordinary cases, incomplete inputs, duplicates, conflicting information, vendor failures, and cases that must go to a person. Release criteria are agreed before the system is judged.",
    "Test set, acceptance report, defect list, and release decision.",
  ],
  [
    "Hand over",
    "Hand over and measure",
    "We train the operator, document administration, record changes, and establish how volume, overrides, errors, delays, cost, and business results will be reviewed.",
    "Operating guide, administrator notes, training, change log, and measurement sheet.",
  ],
];
function Process() {
  return (
    <>
      <PageHero
        number="02"
        label="The Wonder & Workflow method"
        title="The system around the AI"
        accent="matters more than the demo."
        copy="A promising output is not an operating process. Reliable work needs defined inputs, ownership, tests, exceptions, monitoring, and a manual path when technology is unavailable."
      />
      <section className="ww-steps">
        {steps.map(([name, heading, copy, receives], i) => (
          <article key={name}>
            <span className="ww-step-index">0{i + 1}</span>
            <div>
              <Eyebrow>{name}</Eyebrow>
              <h2>{heading}</h2>
              <p>{copy}</p>
              <p className="ww-receives">
                <strong>You receive:</strong> {receives}
              </p>
            </div>
          </article>
        ))}
      </section>
      <Flow />
      <CopySection
        label="Meaningful oversight"
        title="What “human in the loop” means here"
      >
        <p>
          It means a named person reviews a defined class of cases at a specific
          point, using written criteria, with authority to approve, correct,
          escalate, or stop the workflow. The design also accounts for workload,
          absence, backlog, and automation bias. A person clicking “approve”
          without context or time is not a control.
        </p>
      </CopySection>
      <CopySection
        label="Proportionate, not bureaucratic"
        title="Scale the process to the consequence."
      >
        <p>
          Low-consequence drafting may need a quick operator check and version
          history. A workflow that can send commitments, expose confidential
          data, or affect a person’s rights needs stronger controls and may
          require specialist review. We scale the process to the consequence, not
          to the novelty of the technology.
        </p>
      </CopySection>
      <Invitation title="Show us the work before choosing the tool." />
    </>
  );
}
const principles = [
  [
    "The process comes first.",
    "We do not force AI into work that a clearer procedure or existing feature can solve.",
  ],
  [
    "Useful beats impressive.",
    "A workflow must help with a real operating problem and be understandable to the people who run it.",
  ],
  [
    "People keep meaningful authority.",
    "We define where judgment, commitments, exceptions, and escalation belong.",
  ],
  [
    "Proof comes before expansion.",
    "We agree on acceptance criteria and learn from one workflow before adding more.",
  ],
  [
    "Ownership continues after launch.",
    "Documentation, access, monitoring, maintenance, and a fallback are part of the design.",
  ],
];
function About() {
  return (
    <>
      <PageHero
        number="03"
        label="About Wonder & Workflow"
        title="Better operations begin with respect"
        accent="for the people doing the work."
        copy="Wonder & Workflow is a husband-and-wife-owned operations business focused on how field and service work actually gets done: intake, documents, information, approvals, follow-up, reporting, and handoffs."
      />
      <section className="ww-about-statement">
        <BrandLockup variant="ink" className="ww-brand-lockup ww-brand-lockup-panel" />
        <div>
          <Eyebrow>Why we exist</Eyebrow>
          <h2>
            Improve the work.
            <br />
            <em>Respect the people.</em>
          </h2>
          <p>
            Businesses often do not need another dashboard or a dramatic AI
            strategy. They need a recurring process to stop depending on memory,
            duplicate entry, scattered information, or one person’s workaround.
            You may not need another tool.
          </p>
          <p>
            We created Wonder & Workflow to make those improvements carefully:
            understand the operation, choose the simplest suitable change, test
            it, and leave the team able to own what was built.
          </p>
        </div>
      </section>
      <section className="ww-section ww-principle-section">
        <Eyebrow>Our principles</Eyebrow>
        <div className="ww-discipline-list">
          {principles.map(([title, copy], i) => (
            <article key={title}>
              <span>0{i + 1}</span>
              <h3>{title}</h3>
              <p>{copy}</p>
            </article>
          ))}
        </div>
      </section>
      <CopySection
        label="How we measure progress"
        title="Agree on success before we build."
      >
        <p>
          We agree on a starting point and acceptance criteria for each
          workflow, then test the result with your team before expanding.
        </p>
      </CopySection>
      <Invitation title="Discuss a path of work you want to improve." />
    </>
  );
}
function Start() {
  return (
    <>
      <PageHero
        number="04"
        label="Get started"
        title="What would you like"
        accent="to make easier?"
        copy={`Start with a quick look at your operations. Answer seven questions, save your contact details, then book a complimentary ${FIT_REVIEW_PLAIN} on the calendar. You don’t need a technical plan.`}
      />
      <section className="ww-start-simple">
        <div>
          <span className="ww-step-label">1 / About 2 minutes</span>
          <h2>Complete the assessment</h2>
          <p>
            Answer a few questions about how the work happens today, then add
            your contact details and save. Your score offers a starting point.
            It is not an automatic diagnosis or a savings guarantee.
          </p>
          <Link className="ww-button" to="/assessment">
            Assess your operations <Arrow />
          </Link>
          <p className="ww-small">
            Please leave out passwords and confidential records.
          </p>
        </div>
        <div>
          <span className="ww-step-label">2 / Complimentary · 30 minutes</span>
          <h2>Book an {FIT_REVIEW_NAME}</h2>
          <p>
            After the assessment is saved, the {FIT_REVIEW_NAME} calendar appears on
            the same page. Choose a time there. Together we review the result.
            {` ${ONE_PATH_COPY}`}
          </p>
          <p>
            A deeper diagnostic or implementation is optional and receives a
            separate written scope. Software and vendor costs stay separate.
          </p>
          <Link className="ww-button" to="/assessment">
            Assess your operations <Arrow />
          </Link>
          <NextStepNote />
          <p className="ww-small">
            Questions only? Email{" "}
            <a href="mailto:operations@wonderworkflow.com">
              operations@wonderworkflow.com</a>. That inbox is for questions, not
            the {FIT_REVIEW_NAME} booking path.
          </p>
        </div>
      </section>
    </>
  );
}
function Privacy() {
  return (
    <>
      <PageHero
        number="05"
        label="Privacy"
        title="Your information."
        accent="A considered approach."
        copy="Wonder & Workflow is the public name of Wonder&Workflow LLC. This notice explains the information involved when you use this website, complete an assessment, or request a consultation."
      />
      <section className="ww-prose">
        <h2>Information you provide</h2>
        <p>
          The public operations assessment calculates a score in your browser.
          When you submit it, we receive your answers, score, name, email,
          company, team size, industry, and operational priority. You may also
          provide optional business details. If you book an {FIT_REVIEW_NAME},
          we receive the appointment details and any optional booking note. Do
          not submit passwords, access keys, regulated records, or unnecessary
          personal information through the assessment or booking form.
        </p>
        <h2>How we use it</h2>
        <p>
          We use submitted information to prepare for and respond to your
          request, conduct the consultation, and determine whether further work
          is appropriate. An assessment score supplies context; it is not an
          automatic business recommendation or proof of savings.
        </p>
        <h2>Service providers and appointment booking</h2>
        <p>
          Netlify hosts this website and processes assessment submissions
          through a protected server function. HighLevel stores the related
          contact, assessment, and appointment information and provides the
          embedded booking calendar. We also use email to provide confirmations,
          reminders, and requested follow-up.
        </p>
        <h2>Website storage and campaign information</h2>
        <p>
          Campaign labels in a link, such as its source or campaign name, are
          retained in this tab’s session storage as you browse and are submitted
          with the assessment for attribution. The website carries campaign
          parameters, not dedicated visible form fields. Do not include personal
          information in campaign links. Closing the browser tab ends that
          session storage. It is not submitted with your assessment.
        </p>
        <h2>Website analytics</h2>
        <p>
          This website uses Google Analytics to measure visits to public pages.
        </p>
        <h2>Follow-up and marketing</h2>
        <p>
          Your submission is used to respond to your inquiry and prepare the
          requested {FIT_REVIEW_NAME}. The assessment does not request
          marketing or SMS opt-in.
        </p>
        <h2>Optional text messages</h2>
        <p>This website currently uses email for assessment and appointment communications and does not collect SMS consent. Any future text-message enrollment requires a separate opt-in process that explains what information is collected and how it will be used.</p>
        <p>If you separately choose to receive text messages, Wonder&Workflow LLC uses your number for appointment reminders and follow-up you request. Providing a number or using this website alone does not give permission to send text messages. SMS consent is optional and is not a condition of purchasing services.</p>
        <p>We do not disclose mobile numbers to other businesses or affiliates for promotional or marketing use. Service providers may handle information to support our services, such as customer assistance. Text-message opt-in records and consent are excluded from other sharing and are not provided to third parties for their own use.</p>
        <p>Reply STOP to end text messages or HELP for assistance. You can also email operations@wonderworkflow.com. See the <Link to="/terms">SMS terms</Link> for message frequency, charges, and support.</p>
        <h2>Project information and AI tools</h2>
        <p>
          Before project work begins, the written scope should identify what
          information may be processed, by which systems, for what purpose, with
          what access, and for how long. Do not place passwords or secrets in
          prompts. Any proposed use of an AI provider must be agreed for the
          project and remains subject to that provider’s terms and controls.
        </p>
        <h2>Questions and requests about your information</h2>
        <p>
          For questions about your information, or to request a correction or deletion,
          email <a href="mailto:operations@wonderworkflow.com">operations@wonderworkflow.com</a>.
          You do not need to book a consultation. Please do not include passwords or
          confidential records; we can arrange a suitable channel if needed.
        </p>
        <h2>Business identity</h2>
        <p>Wonder & Workflow is the public name of Wonder&Workflow LLC.</p>
      </section>
    </>
  );
}
function Terms() {
  return (
    <>
      <PageHero number="06" label="Terms & Conditions" title="Clear expectations." accent="From the start."
        copy="These terms apply to the Wonder & Workflow website, operated by Wonder&Workflow LLC." />
      <section className="ww-prose">
        <h2>Website and assessment</h2>
        <p>Our website describes AI operations and workflow services for businesses. The operations assessment provides an indicative score based on your answers. It is not a validated diagnosis, a guarantee of results, or a calculation of financial savings.</p>
        <h2>Consultations and project work</h2>
        <p>The {FIT_REVIEW_NAME} is a complimentary {FIT_REVIEW_PLAIN}. Booking a review does not commit you to purchase services. Paid work begins only under a separately agreed scope covering deliverables, fees, responsibilities, access, and support. That agreement governs the project. Software and vendor costs stay separate.</p>
        <h2>Information you submit</h2>
        <p>Provide accurate information that you are authorized to share. Do not submit passwords, access credentials, confidential client records, or unnecessary sensitive information through public forms. You remain responsible for decisions about your business and for approving any proposed production changes.</p>
        <h2>Appropriate use</h2>
        <p>Use this website lawfully. Do not attempt to access private records, interfere with the website, or submit abusive or fraudulent requests. Our logo, written materials, and website design may not be presented as your own or used to imply our endorsement without permission.</p>
        <h2>Third-party services</h2>
        <p>Scheduling and other connected services may be provided by third parties, including HighLevel. Their availability and applicable terms also govern use of those services.</p>
        <h2>Privacy and contact</h2>
        <p>See our <Link to="/privacy">Privacy Policy</Link> for how submitted information is handled. Questions about these terms can be sent to <a href="mailto:operations@wonderworkflow.com">operations@wonderworkflow.com</a>.</p>
        <h2 id="sms">SMS appointment reminders and requested follow-up</h2>
        <p>These SMS terms apply if you separately enroll in appointment reminders and requested follow-up from Wonder&Workflow LLC. This website does not currently collect SMS consent. Messages are sent only after you expressly opt in through a separate consent-enabled process. This program does not enroll you in promotional text campaigns. Consent is voluntary and is not required to purchase services.</p>
        <p>Message frequency varies with your appointments and requests. Your mobile provider may charge message and data fees for texts you send or receive. Contact your provider about your plan.</p>
        <p>To unsubscribe, reply STOP to a message from us. You may receive one confirmation of your opt-out; no further program messages will follow unless you opt in again. Reply HELP for assistance, or contact <a href="mailto:operations@wonderworkflow.com">operations@wonderworkflow.com</a>. To rejoin, complete the opt-in process again.</p>
        <p>Mobile carriers are not responsible for messages that arrive late or cannot be delivered. Review our <Link to="/privacy">Privacy Policy</Link> for information about mobile numbers and consent records.</p>
        <p>Wonder&Workflow LLC · <a href="https://wonderworkflow.com">wonderworkflow.com</a></p>
      </section>
    </>
  );
}
function Contact() {
  return (
    <>
      <PageHero number="07" label="Contact" title="Let's talk about" accent="your operations."
        copy="Contact Wonder & Workflow about an Operations Fit Review, a project, or an existing inquiry." />
      <section className="ww-contact-fit">
        <Eyebrow>{FIT_REVIEW_NAME}</Eyebrow>
        <h2>Assess your operations</h2>
        <p>
          Complete the 2-minute assessment with your contact details and save.
          Then book a complimentary {FIT_REVIEW_PLAIN} on the calendar. {ONE_PATH_COPY}
        </p>
        <div className="ww-contact-actions">
          <Link className="ww-button" to="/assessment">
            Assess your operations <Arrow />
          </Link>
          <Link className="ww-text-link" to="/assessment">
            Request an {FIT_REVIEW_NAME} <Arrow />
          </Link>
        </div>
        <NextStepNote />
      </section>
      <section className="ww-prose">
        <h2>General contact</h2>
        <p>Wonder & Workflow is the public name of Wonder&Workflow LLC. We help 1–50 person field and service shops understand, improve, and maintain how work gets done.</p>
        <p>Email <a href="mailto:operations@wonderworkflow.com">operations@wonderworkflow.com</a> for questions or an existing inquiry. Please leave out passwords and confidential client information; we can arrange an appropriate way to discuss sensitive details.</p>
        <h2>Questions about your information</h2>
        <p>Use the same email address above for privacy questions or correction and deletion requests. Read our <Link to="/privacy">Privacy Policy</Link> and <Link to="/terms">Terms & Conditions</Link>.</p>
      </section>
    </>
  );
}
function NotFound() {
  return (
    <section className="ww-page-hero">
      <Eyebrow>404 / Page not found</Eyebrow>
      <h1>
        A different
        <br />
        <em>way forward.</em>
      </h1>
      <p>
        This page is not available. Return to the website or start your
        assessment.
      </p>
      <Link className="ww-button" to="/">
        Back to home <Arrow />
      </Link>
    </section>
  );
}

export default function Website() {
  const location = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);
  const main = useRef<HTMLElement>(null);
  const initial = useRef(true);
  useEffect(() => {
    captureCampaign(location.search);
    setMenuOpen(false);
    const pathname = location.pathname.replace(/\/+$/, "") || "/";
    const canonicalPath = canonicalPaths[pathname] || pathname;
    const metadata = pages[canonicalPath] || [
      "Page not found",
      "This page is not available on Wonder & Workflow.",
    ];
    document.title = `${metadata[0]} | Wonder & Workflow`;
    let description = document.querySelector<HTMLMetaElement>(
      'meta[name="description"]',
    );
    if (!description) {
      description = document.createElement("meta");
      description.name = "description";
      document.head.appendChild(description);
    }
    description.content = metadata[1];
    let canonical = document.querySelector<HTMLLinkElement>(
      'link[rel="canonical"]',
    );
    if (!canonical) {
      canonical = document.createElement("link");
      canonical.rel = "canonical";
      document.head.appendChild(canonical);
    }
    const canonicalHref =
      canonicalPath === "/"
        ? "https://wonderworkflow.com/"
        : `https://wonderworkflow.com${canonicalPath}/`;
    canonical.href = canonicalHref;
    applyStructuredData(canonicalPath);
    window.scrollTo({ top: 0, behavior: "instant" });
    if (!initial.current) main.current?.focus({ preventScroll: true });
    initial.current = false;
  }, [location.pathname, location.search]);
  return (
    <div className="ww-site">
      <a className="ww-skip" href="#ww-main">
        Skip to content
      </a>
      <header className="ww-header">
        <Link
          className="ww-wordmark"
          to="/"
          aria-label="Wonder & Workflow home"
        >
          <BrandLockup />
        </Link>
        <button
          className="ww-menu-toggle"
          aria-expanded={menuOpen}
          aria-controls="ww-navigation"
          onClick={() => setMenuOpen(!menuOpen)}
        >
          {menuOpen ? "Close −" : "Menu +"}
        </button>
        <nav
          id="ww-navigation"
          className={menuOpen ? "ww-nav ww-nav-open" : "ww-nav"}
          aria-label="Main navigation"
        >
          <NavLink to="/services">Services</NavLink>
          <NavLink to="/guides">Guides</NavLink>
          <NavLink to="/how-we-work">How We Work</NavLink>
          <NavLink to="/about">About</NavLink>
          <Link className="ww-nav-cta" to="/assessment">
            Assess your operations <Arrow />
          </Link>
        </nav>
      </header>
      <main id="ww-main" ref={main} tabIndex={-1}>
        <Routes>
          <Route index element={<Home />} />
          <Route path="services" element={<Services />} />
          {services.map(service => <Route key={service.slug} path={`services/${service.slug}`} element={<ServicePage service={service} />} />)}
          <Route path="guides" element={<GuidesIndex />} />
          {guides.map(guide => <Route key={guide.slug} path={`guides/${guide.slug}`} element={<GuidePage guide={guide} />} />)}
          <Route path="case-studies/operations-assessment" element={<AssessmentCaseStudy />} />
          <Route path="ai-operations" element={<Services />} />
          <Route path="how-we-work" element={<Process />} />
          <Route path="about" element={<About />} />
          <Route path="start" element={<Start />} />
          <Route path="book" element={<Start />} />
          <Route path="pricing" element={<Navigate to="/services" replace />} />
          <Route path="privacy" element={<Privacy />} />
          <Route path="terms" element={<Terms />} />
          <Route path="contact" element={<Contact />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </main>
      <footer className="ww-footer">
        <div>
          <Link className="ww-footer-name" to="/">
            Wonder & Workflow
            <span>{FOOTER_BLURB}</span>
          </Link>
          <Cta secondary />
        </div>
        <nav className="ww-footer-links" aria-label="Footer navigation">
          <Link to="/services">Services</Link>
          <Link to="/guides">Guides</Link>
          <Link to="/case-studies/operations-assessment">Implementation study</Link>
          <Link to="/how-we-work">How We Work</Link>
          <Link to="/about">About</Link>
          <Link to="/privacy">Privacy</Link>
          <Link to="/terms">Terms & Conditions</Link>
          <Link to="/contact">Contact</Link>
          <Link to="/start">Start</Link>
          <a href="mailto:operations@wonderworkflow.com">operations@wonderworkflow.com</a>
        </nav>
        <div className="ww-footer-bottom">
          <span>© {new Date().getFullYear()} Wonder&Workflow LLC</span>
          <Link to="/privacy">Privacy</Link>
          <span>
            Wonder & Workflow is the public name of Wonder&Workflow LLC.
          </span>
        </div>
      </footer>
    </div>
  );
}
