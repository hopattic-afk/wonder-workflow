import { useEffect, useRef, useState, type ComponentProps } from "react";
import {
  Link as RouterLink,
  NavLink as RouterNavLink,
  Route,
  Routes,
  useLocation,
} from "react-router-dom";
import { captureCampaign, publicHref } from "./campaign";
import { AssessmentCaseStudy, GuidePage, GuidesIndex, ServiceDirectory, ServicePage, guides, searchPages, services, structuredData } from "./SearchContent";
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
  "/": [
    "AI Operations for Dependable Workflows",
    "Improve one recurring workflow at a time. Wonder & Workflow maps the work, chooses the simplest suitable solution, tests it, and leaves your team in control.",
  ],
  "/services": [
    "Workflow Diagnostic and AI Operations Services",
    "Map, improve, test, and hand over one recurring business workflow. See Wonder & Workflow’s diagnostic, implementation, and support approach.",
  ],
  "/how-we-work": [
    "How We Design Dependable AI Workflows",
    "See how Wonder & Workflow maps, simplifies, builds, tests, and hands over one business workflow with clear human ownership and fallback.",
  ],
  "/about": [
    "About Wonder & Workflow",
    "Wonder & Workflow helps owner-led service businesses improve recurring operations through careful discovery, proportionate technology, testing, and clear ownership.",
  ],
  "/start": [
    "Start With an Operations Assessment",
    "Assess your operations in about two minutes, discuss your results in a complimentary 30-minute Workflow Fit Review, and choose one workflow to improve.",
  ],
  "/privacy": [
    "Privacy",
    "How Wonder & Workflow handles website, assessment, consultation, and workflow-project information.",
  ],
  "/terms": [
    "Terms & Conditions",
    "Terms for using Wonder & Workflow's website, operations assessment, and consultation services.",
  ],
  "/contact": [
    "Contact Wonder & Workflow",
    "Contact Wonder&Workflow LLC about AI operations, workflow services, or your information.",
  ],
  ...searchPages,
};
const canonicalPaths: Record<string, string> = {
  "/ai-operations": "/services",
  "/book": "/start",
};
export const FIT_REVIEW_MAILTO =
  "mailto:operations@wonderworkflow.com?subject=Workflow%20Fit%20Review%20request&body=Hi%20Ian%2C%0A%0AI%20completed%20the%20operations%20assessment.%0AScore%3A%20%0ATier%3A%20%0AOne%20workflow%20to%20discuss%3A%20%0A%0AThanks.";
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
function Invitation({
  title = "Find where work slows down.",
  copy = "Complete the short assessment, then request a complimentary 30-minute Workflow Fit Review.",
  showFitReviewEmail = false,
}: {
  title?: string;
  copy?: string;
  showFitReviewEmail?: boolean;
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
        {showFitReviewEmail ? (
          <a className="ww-text-link" href={FIT_REVIEW_MAILTO}>
            Request a Fit Review by email <Arrow />
          </a>
        ) : null}
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
function fullMotionRequested() {
  if (typeof window === "undefined") return false;
  const selected = new URLSearchParams(window.location.search).get("motion");
  try {
    if (selected === "full") sessionStorage.setItem("ww-motion-choice", "full");
    if (selected === "reduced") sessionStorage.removeItem("ww-motion-choice");
    return selected === "full" || sessionStorage.getItem("ww-motion-choice") === "full";
  } catch { return selected === "full"; }
}
let homeIntroSeen = false;
function LaunchFilm({
  onComplete,
}: {
  onComplete: (complete: boolean) => void;
}) {
  const video = useRef<HTMLVideoElement>(null);
  const eligible = useRef<boolean | null>(null);
  const [visible, setVisible] = useState(false);
  const [exiting, setExiting] = useState(false);
  const dismiss = () => {
    const returnFocus = document.activeElement?.closest(".ww-launch-intro");
    video.current?.pause();
    setExiting(true);
    onComplete(true);
    if (returnFocus)
      document
        .querySelector<HTMLElement>(".ww-hero h1")
        ?.focus({ preventScroll: true });
  };
  useEffect(() => {
    const preference = window.matchMedia("(prefers-reduced-motion: reduce)");
    if (eligible.current === null) {
      eligible.current = (fullMotionRequested() || !preference.matches) && !homeIntroSeen;
      if (eligible.current) homeIntroSeen = true;
    }
    if (!eligible.current) {
      onComplete(true);
      return;
    }
    setVisible(true);
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape" || event.key === "Tab") dismiss();
    };
    const onPreference = () => {
      if (preference.matches && !fullMotionRequested()) dismiss();
    };
    const timer = window.setTimeout(dismiss, 2650);
    document.addEventListener("keydown", onKey);
    preference.addEventListener("change", onPreference);
    return () => {
      window.clearTimeout(timer);
      document.removeEventListener("keydown", onKey);
      preference.removeEventListener("change", onPreference);
    };
  }, []);
  useEffect(() => {
    if (!exiting) return;
    const timer = window.setTimeout(() => {
      setVisible(false);
      onComplete(true);
    }, 200);
    return () => window.clearTimeout(timer);
  }, [exiting, onComplete]);
  useEffect(() => {
    if (!visible) return;
    let cancelled = false;
    if (video.current) video.current.playbackRate = 2.5;
    video.current?.play().catch(() => {
      if (!cancelled) dismiss();
    });
    return () => {
      cancelled = true;
    };
  }, [visible]);
  if (!visible) return null;
  return (
    <div
      className={`ww-launch-intro${exiting ? " ww-intro-exiting" : ""}`}
      data-testid="home-intro"
    >
      <video
        ref={video}
        autoPlay
        muted
        playsInline
        preload="auto"
        aria-hidden="true"
        onLoadedMetadata={() => { if (video.current) video.current.playbackRate = 2.5; }}
        onTimeUpdate={() => { if (!exiting && video.current && video.current.currentTime >= 5) dismiss(); }}
        onEnded={dismiss}
        onError={dismiss}
      >
        <source src="/brand/launch.mp4" type="video/mp4" />
      </video>
      <button className="ww-intro-skip" onClick={dismiss}>
        Skip intro <span aria-hidden="true">↗</span>
      </button>
    </div>
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
function WorkflowEntrance({ready}: {ready: boolean}) {
  const [paused, setPaused] = useState(false);
  const [reduced, setReduced] = useState(() => typeof window === "undefined" || (window.matchMedia("(prefers-reduced-motion: reduce)").matches && !fullMotionRequested()));
  const [phase, setPhase] = useState(0);
  const [inView, setInView] = useState(true);
  const scene = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const preference = window.matchMedia("(prefers-reduced-motion: reduce)");
    const update = () => setReduced(preference.matches && !fullMotionRequested());
    preference.addEventListener("change", update);
    const observer = new IntersectionObserver(([entry]) => setInView(entry.isIntersecting));
    if (scene.current) observer.observe(scene.current);
    return () => { preference.removeEventListener("change", update); observer.disconnect(); };
  }, []);
  useEffect(() => {
    if (!ready || paused || reduced || !inView) return;
    const timer = window.setInterval(() => {
      if (!document.hidden) setPhase(value => (value + 1) % 4);
    }, 2200);
    return () => window.clearInterval(timer);
  }, [ready, paused, reduced, inView]);
  const moving = ready && !paused && !reduced && inView;
  const stages = ["A request arrives", "Details come together", "Prepared for human review", "A clear next step"];

  return (
    <section className={`ww-live-scene${moving ? " ww-motion-running" : ""}`} data-phase={phase} aria-label="Animated illustration of a business workflow">
      <div className="ww-live-heading"><span>One request. A connected workflow.</span><button className="ww-motion-control" aria-pressed={!paused && !reduced} onClick={() => { if(reduced) { const url = new URL(window.location.href); url.searchParams.set("motion", "full"); window.location.assign(url.toString()); } else setPaused(value => !value); }}>{reduced ? "Enable animation" : paused ? "Resume animation" : "Pause animation"}</button></div>
    <div ref={scene} className="ww-operating-scene" role="img" aria-label="Illustration: incoming requests flow through Wonder and Workflow into organized information, human review, and a clear next action.">
      <div className="ww-scene-grid" aria-hidden="true" />
      <div className="ww-arrivals" aria-hidden="true">
        <div className="ww-arrival ww-arrival-one"><span>01 / INBOX</span><strong>A new customer request</strong><p>“Can we arrange a visit next week?”</p></div>
        <div className="ww-arrival ww-arrival-two"><span>02 / DOCUMENTS</span><strong>The details, together.</strong><p>Notes · attachments · customer history</p></div>
        <div className="ww-arrival ww-arrival-three"><span>03 / YOUR TOOLS</span><strong>Connected to the work.</strong><p>Calendar · CRM · project records</p></div>
      </div>
      <svg className="ww-energy-paths" viewBox="0 0 1100 360" preserveAspectRatio="none" aria-hidden="true">
        <path d="M270 75H360Q400 75 400 115V140Q400 180 450 180H550" />
        <path d="M290 180H550" />
        <path d="M270 290H360Q400 290 400 250V220Q400 180 450 180H550" />
        <path d="M550 180H660Q700 180 700 140V110Q700 80 740 80H810" />
        <path d="M550 180H810" />
        <path d="M550 180H660Q700 180 700 220V250Q700 290 740 290H810" />
        <path className="ww-flow-packet ww-packet-one" d="M270 75H360Q400 75 400 115V140Q400 180 450 180H550" />
        <path className="ww-flow-packet ww-packet-two" d="M290 180H550" />
        <path className="ww-flow-packet ww-packet-three" d="M270 290H360Q400 290 400 250V220Q400 180 450 180H550" />
        <path className="ww-flow-packet ww-packet-four" d="M550 180H660Q700 180 700 140V110Q700 80 740 80H810" />
        <path className="ww-flow-packet ww-packet-five" d="M550 180H810" />
        <path className="ww-flow-packet ww-packet-six" d="M550 180H660Q700 180 700 220V250Q700 290 740 290H810" />
      </svg>
      <div className="ww-engine" aria-hidden="true"><div className="ww-engine-halo" /><img src="/brand/emblem.png" alt="" width="108" height="128" /><span>Wonder & Workflow</span></div>
      <div className="ww-outcomes" aria-hidden="true">
        <div className="ww-outcome"><span className="ww-outcome-check">✓</span><div><span>INFORMATION ORGANIZED</span><strong>Every detail in one place.</strong></div></div>
        <div className="ww-outcome"><span className="ww-outcome-check">✓</span><div><span>HUMAN REVIEW</span><strong>Your team stays in control.</strong></div></div>
        <div className="ww-outcome"><span className="ww-outcome-check">↗</span><div><span>READY FOR THE NEXT STEP</span><strong>A clear owner. Work moves.</strong></div></div>
      </div>
      <div className="ww-scene-caption" aria-hidden="true"><span>{reduced ? "From request to next step." : stages[phase]}</span><span>Illustrative workflow</span></div>
    </div><div className="ww-live-progress" aria-hidden="true">{stages.map((label,index)=><span key={label} className={phase === index ? "is-current" : ""}><i />{label}</span>)}</div>
    </section>
  );
}
function Home() {
  const [introComplete, setIntroComplete] = useState(false);
  return (
    <div className={`ww-home ww-entrance${fullMotionRequested() ? " ww-force-motion" : ""}${introComplete ? " ww-entrance-on" : ""}`}>
      <LaunchFilm onComplete={setIntroComplete} />
      <section className="ww-hero ww-workflow-hero">
        <div className="ww-workflow-hero-heading">
          <div>
            <Eyebrow>AI operations for service businesses</Eyebrow>
            <h1 tabIndex={-1}>
              From scattered requests
              <br />
              <em>to work ready to move.</em>
            </h1>
          </div>
          <div className="ww-workflow-hero-intro">
            <p>
              Turn everyday admin into a clear next step—with connected tools,
              useful AI, and people in control.
            </p>
            <Link className="ww-button" to="/assessment">
              Assess your operations <Arrow />
            </Link>
            <p className="ww-trust-note">
              A 2-minute assessment to spot where work gets slowed down.
            </p>
          </div>
        </div>
        <WorkflowEntrance ready={introComplete} />
      </section>
      <section className="ww-section">
        <div className="ww-section-heading">
          <Eyebrow>What we help with</Eyebrow>
          <h2>Where is the work slowing down?</h2>
        </div>
        <div className="ww-problem-list">
          {[
            [
              "Repeated admin",
              "The same information gets copied between forms, files, and software.",
              "Simplify data entry and document preparation.",
            ],
            [
              "Missing information",
              "Your team spends time finding answers or chasing details.",
              "Organize information and make it easier to use.",
            ],
            [
              "Unclear handoffs",
              "Requests, approvals, or follow-ups depend on someone remembering.",
              "Give each step a clear owner and next action.",
            ],
          ].map(([title, problem, outcome], index) => (
            <article key={title}>
              <span className="ww-index">0{index + 1}</span>
              <h3>{title}</h3>
              <p>{problem}</p>
              <p className="ww-outcome">{outcome}</p>
            </article>
          ))}
        </div>
        <Link className="ww-text-link" to="/services">
          View services <Arrow />
        </Link>
      </section>
      <section className="ww-section ww-home-process">
        <div>
          <Eyebrow>How we work</Eyebrow>
          <h2>
            One workflow.
            <br />
            <em>A practical improvement.</em>
          </h2>
          <Link className="ww-text-link" to="/how-we-work">
            See our process <Arrow />
          </Link>
        </div>
        <ol>
          <li>
            <h3>Understand it</h3>
            <p>Walk through a real example with the person doing the work.</p>
          </li>
          <li>
            <h3>Improve it</h3>
            <p>Choose the simplest suitable change, then agree on the scope.</p>
          </li>
          <li>
            <h3>Test and hand over</h3>
            <p>
              Check real cases and give your team clear instructions and a
              fallback.
            </p>
          </li>
        </ol>
      </section>
      <Invitation
        title="Find where your operations could improve."
        copy="Assess your operations in about two minutes. Then request a complimentary 30-minute Workflow Fit Review to discuss your results and choose one workflow to improve."
        showFitReviewEmail
      />
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
const faqs = [
  [
    "Do you only build with AI?",
    "No. We choose between process change, existing software, conventional automation, and AI based on the work. AI is useful where interpretation or flexible language matters; fixed rules are often better for deterministic steps.",
  ],
  [
    "Can you guarantee how many hours we will save?",
    "No. We establish a baseline and agree on measurement before making a client-specific estimate. Recovered capacity is not automatically cash savings.",
  ],
  [
    "Will this replace an employee?",
    "That is not our default goal or claim. Most useful projects remove repeated administration, improve handoffs, or support decisions while people retain responsibility.",
  ],
  [
    "Can you work with our current software?",
    "We assess it first. Available integrations, account permissions, data quality, vendor limits, and cost determine what is feasible. Sometimes the best result is better use of what you already own.",
  ],
  [
    "Do you provide compliance or security certification?",
    "No. We use practical risk, privacy, testing, and access-control disciplines. Formal legal, certification, penetration-testing, and regulated-industry work requires an appropriately qualified specialist.",
  ],
  [
    "Who owns the finished workflow?",
    "The proposal identifies ownership and licensing. Our default recommendation is client-owned service accounts, editable documentation, and a clear offboarding path. Third-party platforms retain their own terms.",
  ],
];
function Services() {
  return (
    <>
      <PageHero
        number="01"
        label="AI operations and workflow improvement"
        title="Start small enough to understand."
        accent="Build well enough to depend on."
        copy="Every engagement begins with a defined workflow, a named owner, and an observable problem. We expand only after the first result is understood."
      />
      <section className="ww-service-details ww-offer-details">
        <article>
          <span className="ww-eyebrow">01</span>
          <div>
            <Eyebrow>Complimentary · 30 minutes</Eyebrow>
            <h2>Workflow Fit Review</h2>
          </div>
          <div>
            <h3>Decide whether this is worth solving—and how.</h3>
            <p>
              <strong>For you if:</strong> A recurring process is frustrating,
              but you do not yet know whether the answer is AI, automation,
              software configuration, or a better procedure.
            </p>
            <p>
              <strong>What we do:</strong> Review one workflow, its trigger,
              people, tools, repeated effort, exceptions, and business
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
          </div>
        </article>
        <article>
          <span className="ww-eyebrow">02</span>
          <h2>One-Workflow Diagnostic</h2>
          <div>
            <h3>
              Turn a frustrating process into an implementation-ready decision.
            </h3>
            <p>
              <strong>What you receive:</strong>
            </p>
            <BulletList
              items={[
                "Current-state map and workflow boundary.",
                "Baseline for volume, time, delay, rework, and cost where evidence is available.",
                "Tool, information, permission, and dependency map.",
                "Comparison of process, native-feature, automation, and AI options.",
                "Human-decision and exception-handling plan.",
                "Recommended future state, implementation scope, and acceptance tests.",
              ]}
            />
            <p>
              <strong>What we need from you:</strong> The workflow owner, one
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
              Begin with a Workflow Fit Review. Diagnostic deliverables and
              acceptance criteria are confirmed in a separate written scope and
              proposal.
            </p>
          </div>
        </article>
        <article>
          <span className="ww-eyebrow">03</span>
          <div>
            <Eyebrow>Scoped implementation pilot</Eyebrow>
            <h2>Workflow Build &amp; Proof</h2>
          </div>
          <div>
            <h3>
              Build one workflow. Test everyday cases and exceptions. Leave your team able to
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
              Scope the first workflow <Arrow />
            </Link>
            <p className="ww-small">
              The first step is a fit review. Build scope, commercial terms, and
              stabilization boundaries are agreed separately after diagnostic
              work.
            </p>
          </div>
        </article>
      </section>
      <CopySection
        label="After launch"
        title="Know who looks after the workflow."
      >
        <p>
          Every proposal states who watches failures, who reviews exceptions,
          how changes are approved, and what support is included. Ongoing care
          is offered only where we can define real coverage and responsibility;
          it is not an unlimited retainer.
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
        copy="Start with the operations assessment. We will discuss your results, choose one workflow to improve, and decide together whether a diagnostic is justified."
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
          require specialist review. We scale the process to the consequence—not
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
        copy="Wonder & Workflow is a husband-and-wife-owned AI operations business focused on the processes behind service delivery: intake, documents, information, approvals, follow-up, reporting, and handoffs."
      />
      <section className="ww-about-statement">
        <img
          src="/brand/logo-on-black.png"
          alt="Wonder & Workflow"
          loading="lazy"
        />
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
      <Invitation title="Discuss a workflow you want to improve." />
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
        copy="Start with a quick look at your operations. Answer seven simple questions, discuss your results, and choose one workflow to improve. You don’t need a technical plan."
      />
      <section className="ww-start-simple">
        <div>
          <span className="ww-step-label">1 / About 2 minutes</span>
          <h2>Complete the assessment</h2>
          <p>
            Answer a few questions about how the work happens today. Your
            score offers a starting point; it is not an automatic diagnosis or a
            savings guarantee.
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
          <h2>Request a Workflow Fit Review</h2>
          <p>
            After you finish the assessment, email operations@wonderworkflow.com
            to request a complimentary 30-minute Workflow Fit Review. Include
            your score (and tier if shown) and one workflow you’d like to
            improve. Ian reads this inbox.
          </p>
          <a className="ww-button" href={FIT_REVIEW_MAILTO}>
            Email to request Fit Review <Arrow />
          </a>
          <Link className="ww-text-link" to="/contact">
            Contact <Arrow />
          </Link>
          <p>
            A deeper diagnostic or implementation is optional and receives a
            separate written scope.
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
          provide optional business details. If you book a Workflow Fit Review,
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
          session storage. The opening animation is remembered in page memory while you browse;
          reloading the page resets it. Choosing full animation saves that choice
          in this tab’s session storage, so it remains enabled as you browse.
          Closing the tab ends that choice. It is not submitted with your assessment.
        </p>
        <h2>Follow-up and marketing</h2>
        <p>
          Your submission is used to respond to your inquiry and prepare the
          requested Workflow Fit Review. The assessment does not request
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
        <p>The Workflow Fit Review is a complimentary 30-minute conversation. Booking a review does not commit you to purchase services. Paid work begins only under a separately agreed scope covering deliverables, fees, responsibilities, access, and support. That agreement governs the project.</p>
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
        copy="Contact Wonder & Workflow about a workflow, a project, or an existing inquiry." />
      <section className="ww-prose">
        <h2>Request a Workflow Fit Review</h2>
        <p>
          <a className="ww-button" href={FIT_REVIEW_MAILTO}>
            Email operations@wonderworkflow.com
          </a>
        </p>
        <p>No contact form is required. Ian monitors this address.</p>
        <h2>Wonder&Workflow LLC</h2>
        <p>Wonder & Workflow is the public name of Wonder&Workflow LLC. We help service businesses understand, improve, and maintain practical business workflows.</p>
        <p>Email <a href="mailto:operations@wonderworkflow.com">operations@wonderworkflow.com</a>. Please leave out passwords and confidential client information; we can arrange an appropriate way to discuss sensitive details.</p>
        <h2>Start with your operations</h2>
        <p>Our <Link to="/assessment">two-minute operations assessment</Link> helps you identify areas to discuss in a complimentary 30-minute Workflow Fit Review.</p>
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
      "Explore Wonder & Workflow AI operations.",
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
    canonical.href = `https://wonderworkflow.com${canonicalPath}`;
    document.querySelector("#ww-structured-data")?.remove();
    const schema = structuredData(canonicalPath);
    if (schema) {
      const script = document.createElement("script");
      script.id = "ww-structured-data";
      script.type = "application/ld+json";
      script.textContent = JSON.stringify(schema).replaceAll("<", "\\u003c");
      document.head.appendChild(script);
    }
    window.scrollTo({ top: 0, behavior: "instant" });
    if (!initial.current) main.current?.focus({ preventScroll: true });
    initial.current = false;
  }, [location.pathname, location.search]);
  return (
    <div className={`ww-site${fullMotionRequested() ? " ww-full-motion" : ""}`}>
      <a className="ww-skip" href="#ww-main">
        Skip to content
      </a>
      <header className="ww-header">
        <Link
          className="ww-wordmark"
          to="/"
          aria-label="Wonder & Workflow home"
        >
          <img src="/brand/emblem.png" alt="" />
          <span>
            Wonder<span className="ww-amp">&</span>
            <br />
            Workflow
          </span>
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
          <NavLink to="/start">Get started</NavLink>
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
            <span>AI operations for work that needs to run reliably.</span>
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
