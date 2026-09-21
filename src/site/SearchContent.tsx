import { Link as RouterLink } from "react-router-dom";
import { publicHref } from "./campaign";
import {
  FIT_REVIEW_NAME,
  LADDER_NOTE,
  ONE_PATH_COPY,
} from "./publicOffer";
import {
  assessmentHowToNode,
  organizationNode,
  websiteNode,
  writeJsonLd,
} from "./jsonld";

type ExtraSection = {
  eyebrow?: string;
  title: string;
  body: string;
  points?: string[];
};

type Service = {
  slug: string;
  title: string;
  short: string;
  problem: string;
  ideal: string[];
  process: string[];
  deliverables: string[];
  pricing: string;
  faqs: [string, string][];
  extraSections?: ExtraSection[];
};

type Guide = {
  slug: string;
  title: string;
  answer: string;
  sections: { title: string; body: string; points?: string[] }[];
  faqs: [string, string][];
  reviewed?: string;
  dateModified?: string;
};

function Link({ to, children, className }: { to: string; children: React.ReactNode; className?: string }) {
  return <RouterLink className={className} to={publicHref(to)}>{children}</RouterLink>;
}

export const services: Service[] = [
  {
    slug: "operations-consultant-for-small-business",
    title: "Operations consultant for small business",
    short: "For owners of 1–50 person field and service shops. We map one real path of work and make the next step obvious. Start with a complimentary Operations Fit Review.",
    problem: "You still hold the day together. Missed calls while you are on a job. Quotes sitting. Notes that never reach the crew. An operations consultant for a small business should fix how work moves, not sell a software stack.",
    extraSections: [
      {
        eyebrow: "Process work",
        title: "What a business process consultant does for a small business",
        body: "A business process consultant sits with the person doing the work and follows one live example, from request to done to paid. The job is to make intake, handoffs, quotes, and admin visible enough to fix. Wonder & Workflow does that for field and service shops. We do not lead with a tool, an AI agency pitch, or a fractional COO title.",
      },
      {
        eyebrow: "Owner nouns",
        title: "How a business process consultant maps intake, handoffs, and admin",
        body: "We use the words you already use. Who answers the phone. Who writes the quote. Who tells the crew. Who invoices. If those steps live in group texts and “just ask me,” a business process consultant should name the next owner and the next action.",
        points: [
          "Intake: calls and texts while you are on the tools.",
          "Handoffs: the office has one version of the job, the crew has another.",
          "Admin: quotes waiting, invoices after the fact, payroll pieced together.",
        ],
      },
      {
        eyebrow: "Not a fit",
        title: "Who this is not for",
        body: "Not law, CPA, or clinical practices. Not an AI agency engagement.",
      },
    ],
    ideal: [
      "You own a field or service shop with roughly 1–50 people.",
      "Cleaning, landscaping, detailing, signs and print, restoration, moving, or similar work.",
      "Admin, intake, and handoffs still land on you.",
      "You want one process clearer, not a full-time operations chief.",
    ],
    process: [
      "Walk one live job from request to done to paid.",
      "Name the stuck point in owner language: intake, handoffs, quotes waiting, admin that chases you.",
      "Pick the smallest change that makes the next step obvious.",
      "Test on real jobs. Leave a named owner, clear instructions, and a fallback.",
    ],
    deliverables: [
      "Map of one real path of work",
      "Named stuck point and owner",
      "Practical next-step plan",
      "Written scope before any paid work",
      "Handoff notes the team can use",
      "Fallback if the change does not stick",
    ],
    pricing: `The ${FIT_REVIEW_NAME} is complimentary. Paid diagnostic or implementation work is quoted in writing after that review. Software and vendor costs stay separate. We do not publish package prices.`,
    faqs: [
      ["Do you work with service businesses, or only offices?", "Field and service shops with roughly 1–50 people are the core fit: cleaning, landscaping, detailing, signs and print, restoration, moving, and similar work. Law, CPA, and clinical practices are out of scope."],
      ["Are you a fractional COO?", "No. We do not lead with a fractional COO retainer or embed as your operations chief. We map one real path of work and make the next step obvious."],
      ["Is this an AI agency?", "No. Most of the time this is a structure and ownership problem, not a software problem. You may not need another tool. AI is optional later, not the pitch."],
      ["How do we start?", `Take the two-minute assessment, leave your details, and book a complimentary ${FIT_REVIEW_NAME}. That 30-minute business operations review is the first conversation.`],
    ],
  },
  {
    slug: "operations-audit-for-small-business",
    title: "Operations audit for small business",
    short: "A complimentary 30-minute Operations Fit Review that names where jobs get stuck. Not a multi-week paid audit as the first step.",
    problem: "Owners search for an operations audit when the day feels stuck and they want someone to look. Many audits are multi-week paid projects. Wonder & Workflow starts with a complimentary 30-minute business operations review.",
    extraSections: [
      {
        eyebrow: "Start here",
        title: "Complimentary Operations Fit Review vs a typical multi-week paid audit",
        body: `The ${FIT_REVIEW_NAME} is a complimentary 30-minute business operations review. You take a two-minute assessment, leave your details, and we look at the results together. A typical operations audit for a small business runs across multiple weeks, with a longer written diagnostic as the product. That deeper paid diagnostic exists here too, but it is scoped after the ${FIT_REVIEW_NAME}. We do not start with a multi-week engagement.`,
        points: [
          "Complimentary Operations Fit Review: about 30 minutes, after a two-minute assessment.",
          "Typical paid audit: multi-week discovery, more people, a longer written report.",
          `Our paid diagnostic: quoted in writing only after the ${FIT_REVIEW_NAME}, if it is worth doing.`,
        ],
      },
      {
        eyebrow: "What we look at",
        title: "What a 30-minute business operations review can actually cover",
        body: "We review where intake, handoffs, and admin slow the day. We choose one path of work worth improving. We do not rewrite the whole company in one sitting. If a longer audit is the right next step, you will hear that in plain language, with scope before price.",
      },
    ],
    ideal: [
      "You can name a recurring stuck point but not the root cause.",
      "You want a live look at how work moves, not a binder of unused recommendations.",
      "You are not ready to buy a multi-week audit before a conversation.",
    ],
    process: [
      "Complete the two-minute operations assessment.",
      `Book a complimentary ${FIT_REVIEW_NAME}.`,
      "Walk one real path of work together.",
      "Decide whether a paid diagnostic is worth scoping, or stop.",
    ],
    deliverables: [
      "Shared read on where jobs get stuck",
      "One path of work named as the first improvement",
      "Clear proceed, revise, or stop decision",
      "Written scope if a paid diagnostic follows",
      "Software and vendor costs kept separate",
      "Handoff so the owner knows what happens next",
    ],
    pricing: `The ${FIT_REVIEW_NAME} is complimentary. A multi-week paid audit is not the first product. Any paid diagnostic is quoted after that review because the number of systems, people, and exceptions determines the work. You receive a written scope and price before paid work begins.`,
    faqs: [
      ["Is the Operations Fit Review a full operations audit?", `No. It is a complimentary 30-minute business operations review. A typical multi-week paid audit is a different product. If you need that depth, we quote it after the ${FIT_REVIEW_NAME}.`],
      ["Do you publish audit package prices?", "No. Price follows scope. Software and vendor costs stay separate."],
      ["Will you change our systems during the review?", `No. The ${FIT_REVIEW_NAME} is a conversation and a look at how work moves. Implementation receives a separate scope, approval, and rollback plan.`],
    ],
  },
  {
    slug: "ai-workflow-audit",
    title: "AI Workflow Audit",
    short: "Find the right workflow to improve before buying or building the wrong solution.",
    problem: "A team can feel buried in repetitive work without knowing which part is actually suitable for automation or AI. An audit turns that broad frustration into a bounded, evidence-based decision.",
    ideal: ["You can name a recurring workflow but not its root cause.", "Several tools or handoffs are involved.", "You need a defensible build, improve, or stop decision."],
    process: ["Walk through a recent real example with the people doing the work.", "Map triggers, inputs, decisions, delays, exceptions, systems, and ownership.", "Compare process changes, native features, conventional automation, and AI assistance.", "Define the recommended future state, controls, and acceptance tests."],
    deliverables: ["Current-state workflow map", "Evidence-backed baseline where data exists", "Tool, permission, and dependency map", "Options comparison and recommendation", "Future-state map and implementation scope", "Acceptance tests, risks, and open questions"],
    pricing: `The initial ${FIT_REVIEW_NAME} is complimentary. A full audit is quoted after that review because the number of systems, participants, exceptions, and evidence sources determines the work. You receive a written scope and price before paid work begins. Software and vendor costs stay separate.`,
    faqs: [["Is this a security or compliance audit?", "No. We consider practical privacy, access, and risk boundaries, but formal legal, certification, penetration-testing, and regulated-industry work needs an appropriately qualified specialist."], ["Will the audit recommend AI?", "Only when it is the simplest suitable option. A clearer procedure, an existing software feature, or conventional automation may be the better answer."], ["Do you change our systems during the audit?", "No production change is implied. Implementation receives a separate scope, approval, and rollback plan."]],
  },
  {
    slug: "business-process-automation",
    title: "Business Process Automation",
    short: "Connect a defined process so routine work moves with fewer manual handoffs.",
    problem: "Copying information, checking status, renaming files, sending routine updates, and recreating the same documents consume attention and create avoidable errors.",
    ideal: ["The process repeats often enough to observe.", "Inputs and desired outputs can be defined.", "A person owns the process and can test exceptions."],
    process: ["Set the workflow boundary and baseline.", "Simplify unnecessary steps before automating.", "Build in client-owned accounts with minimum required access.", "Test ordinary, incomplete, duplicate, and failure cases.", "Train the operator and document manual fallback."],
    deliverables: ["Configured workflow or integration", "Written rules and decision boundaries", "Test set and observed results", "Alerts and exception routing", "Fallback and rollback procedure", "Operator and administrator documentation"],
    pricing: "Implementation is a custom proposal after diagnostic work. The proposal separates build labor, third-party subscriptions, usage charges, training, and any stabilization or support period.",
    faqs: [["Can you use our current software?", "We assess it first. Available integrations, permissions, data quality, vendor limits, and cost determine what is feasible."], ["Does automation mean nobody reviews the work?", "No. We explicitly reserve commitments, sensitive judgments, and defined exceptions for people."], ["What happens when a tool fails?", "The operating design includes alerts, ownership, a manual path, and a rollback procedure appropriate to the workflow."]],
  },
  {
    slug: "customer-intake-automation",
    title: "Customer Intake Automation",
    short: "Collect the right information once, route it clearly, and keep a person present where trust matters.",
    problem: "Incomplete forms, scattered emails, repeated questions, and unclear ownership delay the first useful response and make customers repeat themselves.",
    ideal: ["Requests arrive through multiple channels.", "Staff re-enter or chase the same information.", "Different request types need different owners or next steps."],
    process: ["Identify the minimum information needed for the next decision.", "Design plain-language questions and progressive follow-up.", "Route complete and incomplete requests separately.", "Keep sensitive, unusual, or high-consequence cases with a person.", "Test the experience from the customer and operator sides."],
    deliverables: ["Intake question and field design", "Routing and ownership rules", "Confirmation and follow-up logic", "Incomplete and duplicate handling", "Privacy-conscious data map", "Test cases and staff handoff guide"],
    pricing: "Pricing depends on channels, forms, systems, routing branches, and whether customer communications are included. We confirm those boundaries in a written proposal before implementation.",
    faqs: [["Will intake feel impersonal?", "It should not. Automate collection and routing, not empathy. Use clear language, explain what happens next, and provide a visible human path."], ["Can it handle every request automatically?", "That is rarely the right goal. Unclear, sensitive, urgent, and high-value cases should be routed to a named person."], ["Do we need a new CRM?", "Not necessarily. We first assess whether your current form, inbox, CRM, or scheduling tools can support the required flow."]],
  },
  {
    slug: "crm-follow-up-automation",
    title: "CRM & Follow-up Automation",
    short: "Make the CRM support the real follow-up process instead of creating a second job for the team.",
    problem: "A CRM becomes manual work when stages, fields, ownership, and follow-up rules do not match how the business actually qualifies and serves customers.",
    ideal: ["Records are incomplete or duplicated.", "Staff copy information between inboxes, forms, calendars, and the CRM.", "Follow-up depends on memory or one person."],
    process: ["Trace one lead or customer from first contact to a clear outcome.", "Remove fields and stages that do not support a decision.", "Define ownership, timing, consent, and stop conditions.", "Connect only the necessary systems.", "Test duplicates, replies, opt-outs, failures, and human takeover."],
    deliverables: ["Lifecycle and stage map", "Field and source-of-truth plan", "Assignment and task rules", "Consent-aware follow-up design", "Duplicate and exception handling", "Reporting and operator guide"],
    pricing: "A cleanup or configuration project may be smaller than a multi-system integration. Price follows a diagnostic of the CRM, connected tools, data condition, permissions, and communication requirements.",
    faqs: [["Can you clean all our CRM data?", "Data migration or bulk cleanup is separately scoped because reversibility, matching rules, backups, and approval requirements matter."], ["Will you turn on automated texts or emails?", "Only with explicit approval, a verified consent basis, correct sender configuration, and tested stop conditions."], ["Can automation guarantee more sales?", "No. It can improve process consistency and measurement, but demand, offer, timing, staff decisions, and customer choice still determine outcomes."]],
  },
  {
    slug: "ai-operations-consulting",
    title: "AI Operations Consulting",
    short: "Decide whether AI helps intake, handoffs, or admin, or whether a clearer procedure is enough.",
    problem: "Leaders are asked to adopt AI while the real constraints, data, workflow, risk, integration, support, and staff capacity, remain undefined.",
    ideal: ["You have several possible AI projects and need a sequence.", "A pilot exists but nobody owns its operating risks.", "You need a practical plan rather than a broad transformation presentation."],
    process: ["Connect the business problem to a specific workflow.", "Assess variability, consequence of error, information sensitivity, and maintenance capacity.", "Choose a proportionate pilot and define where people retain authority.", "Set acceptance criteria, monitoring, and a stop condition before expansion."],
    deliverables: ["Prioritized workflow opportunity list", "Pilot recommendation and no-go boundaries", "Decision and ownership register", "Vendor or approach comparison", "Testing and measurement plan", "Implementation roadmap"],
    pricing: "Consulting is scoped around the decision to be made, the workflows reviewed, the participants required, and the depth of evidence. A written proposal states deliverables, exclusions, schedule, and price.",
    faqs: [["Do you sell a specific AI platform?", "No. The recommendation should follow the workflow, existing systems, risk, and maintainability, not a predetermined tool."], ["Do you provide AI governance certification?", "No. We apply practical controls within workflow delivery; formal governance, legal opinions, or certification require qualified specialists."], ["Can you help with a pilot already underway?", "Yes, if its boundary, access, testability, and decision owner can be established."]],
  },
  {
    slug: "small-business-workflow-automation",
    title: "Workflow Automation for Small Businesses",
    short: "Improve one recurring workflow without forcing a small team into enterprise complexity.",
    problem: "Small businesses often rely on owner memory and staff workarounds. Large transformation programs are disproportionate, while one-off app connections can create fragile dependencies.",
    ideal: ["An owner or key employee is the bottleneck.", "The same administrative sequence happens every week.", "You want a bounded first project with a clear handoff."],
    process: ["Choose one workflow with visible friction and a reachable owner.", "Measure enough to understand the starting point.", "Use the simplest suitable change.", "Prove it on representative examples before expanding.", "Leave editable documentation and clear responsibility."],
    deliverables: ["One-workflow current and future maps", "Practical improvement recommendation", "Scoped build when justified", "Exception and fallback design", "Team training and documentation", "Measurement sheet for the first operating period"],
    pricing: `Start with a complimentary ${FIT_REVIEW_NAME}. Any paid diagnostic or build is separately quoted, with software and usage costs shown apart from our work. We do not price from company size or an assessment score alone.`,
    faqs: [["Is my business too small for automation?", "Possibly, but team size is not the deciding factor. Frequency, clarity, consequence of error, and maintenance capacity matter more."], ["Should we automate several processes together?", "Usually begin with one bounded workflow. What you learn about data, ownership, and adoption will make later decisions better."], ["Will our team be able to run it?", "That is an acceptance requirement: client-owned accounts where practical, documentation, training, and a manual path are part of the design."]],
  },
];

export const guides: Guide[] = [
  {
    slug: "how-to-stop-being-the-bottleneck-in-your-business",
    title: "How to stop being the bottleneck in your business",
    answer: "You stop being the bottleneck when the next step of a job does not wait for you. Map where work actually stalls (intake, quotes waiting, handoffs, admin), name an owner for that step, and make the next action obvious. Do not start by buying another tool or hiring a fractional COO.",
    dateModified: "2026-09-15",
    reviewed: "September 15, 2026",
    sections: [
      { title: "The product is not the bottleneck. You are.", body: "Owners say it plainly: nothing moves without me. That is not a character flaw. It is a process that still routes every decision, quote, and handoff through the founder. The work is to take one path off your plate, not to vanish from the business overnight." },
      { title: "Name the stuck steps in owner language", body: "Skip enterprise labels. Write down the last five jobs and mark where they waited.", points: ["Intake: a missed call, an incomplete request, a lead that sat in a text thread.", "Quotes waiting: the estimate is in your head or your drafts, not with the customer.", "Handoffs: the office has one version of the job, the crew has another.", "Admin: invoices, payroll, and follow-up that only you can finish."] },
      { title: "Give one path of work a next owner", body: "Pick the path that repeats every week. Write the trigger, the information needed, who acts, and what done looks like. Then run the next three live jobs without you as the default next step. If the team still has to ask you, the instruction is not done." },
      { title: "Do not wait for a full exit from day-to-day work", body: "Getting out of daily operations is a later chapter. The first win is narrower: one process clearer, one owner named, one fallback if it breaks. A mastermind, an AI agency, or a fractional COO title will not fix a quote that sits until you send it." },
      { title: "A practical next step", body: "Take the two-minute assessment, then book a complimentary Operations Fit Review. We will look at where jobs get stuck between intake and paid and choose one improvement worth doing. You may not need another tool." },
    ],
    faqs: [
      ["Is the founder always the bottleneck?", "Often, in shops this size. The founder holds intake, quotes, handoffs, and admin because the next step was never given an owner."],
      ["Should I hire before I fix the process?", "Not automatically. If people spend the day chasing information, a clearer path of work can free capacity before a new hire."],
      ["Will this make the business run without me?", "Not in one sitting. The honest first win is that one repeating job no longer waits for you."],
    ],
  },
  {
    slug: "what-business-processes-should-i-automate-first",
    title: "What business processes should I automate first?",
    answer: "Automate a process first when it repeats often, follows reasonably clear rules, uses accessible information, has a named owner, and creates a measurable cost when it is delayed or done incorrectly. Avoid starting with rare, unstable, highly sensitive, or judgment-heavy work.",
    sections: [
      { title: "Use five filters", body: "A good first candidate is not merely annoying. It is observable and bounded enough to improve safely.", points: ["Frequency: it happens often enough to learn from.", "Clarity: the trigger, inputs, next action, and finish can be described.", "Consequence: mistakes are detectable and recoverable.", "Access: the necessary systems and information can be used appropriately.", "Ownership: one person can approve, test, and maintain the change."] },
      { title: "Strong first candidates", body: "Common examples include routing complete intake forms, creating internal tasks from approved requests, preparing a standard document from validated fields, or alerting an owner when a case stalls." },
      { title: "Poor first candidates", body: "Do not lead with a process that changes weekly, depends on undocumented expert judgment, makes financial or safety commitments, or has no reliable source of truth." },
      { title: "A practical next step", body: "List three recurring processes. For each, record monthly volume, touch time, waiting time, rework, systems, owner, and the worst plausible error. The best first project is usually the one with useful upside and manageable failure, not the largest theoretical saving." },
    ],
    faqs: [["Should I automate the most time-consuming process first?", "Not automatically. A smaller, clearer process can produce safer learning and a faster proof point."], ["Does the first process need AI?", "No. Rules-based automation or better use of an existing feature is often easier to test and maintain."], ["How do I compare candidates?", "Use the same evidence for each: frequency, effort, delay, error, risk, systems, owner, and maintenance burden."]],
  },
  {
    slug: "why-does-my-crm-require-so-much-manual-work",
    title: "Why does my CRM require so much manual work?",
    answer: "A CRM usually feels manual because it does not match the real customer process: information enters through several places, fields do not support decisions, stages have unclear meaning, ownership is missing, or integrations move data without handling duplicates and exceptions.",
    sections: [
      { title: "The CRM may be recording symptoms", body: "If staff update the same fact in email, a spreadsheet, and the CRM, the main problem is an undefined source of truth, not slow data entry." },
      { title: "Look for four design gaps", body: "Trace one recent record and note every handoff.", points: ["Entry: where information first arrives.", "Decision: what staff must know before moving forward.", "Ownership: who is responsible at each stage.", "Exit: the event that completes or stops follow-up."] },
      { title: "Automate after simplifying", body: "Remove unused fields and ambiguous stages first. Then automate well-defined actions such as assignment, task creation, internal alerts, and status updates. Customer messages require consent, accurate context, and a human takeover path." },
      { title: "Measure process quality", body: "Useful measures include record completeness, duplicate rate, time to ownership, stalled cases, manual touches, opt-outs, exceptions, and the percentage of records with a clear outcome." },
    ],
    faqs: [["Do I need a new CRM?", "Not until you test whether the current system can support a simpler lifecycle and the necessary integrations."], ["Can AI fill missing fields?", "AI may extract candidate information, but important fields still need source evidence, confidence rules, and review."], ["Why do integrations create duplicates?", "Matching rules, timing, source identifiers, and update-versus-create behavior are often undefined or inconsistent."]],
  },
  {
    slug: "workflow-automation-cost",
    title: "How much does workflow automation cost?",
    answer: "Workflow automation cost depends on discovery, number of systems, data quality, branches and exceptions, security and permission needs, testing, training, and ongoing software usage. A responsible estimate separates diagnostic work, implementation labor, third-party fees, and support instead of quoting from company size alone.",
    sections: [
      { title: "What changes the price", body: "A single-system rule with clean data is fundamentally different from a customer-facing, multi-system workflow with historical migration and many exceptions.", points: ["People and systems involved", "Condition and sensitivity of the data", "Number of decisions and exceptions", "Required integrations or custom work", "Testing, documentation, and training depth", "Monitoring, support, and vendor usage fees"] },
      { title: "Ask for a separated proposal", body: "The proposal should distinguish one-time discovery and build work from recurring platform, usage, and support costs. It should also state exclusions and the cost of stopping or changing direction." },
      { title: "Estimate value from a baseline", body: "Record current volume, touch time, delay, rework, and error consequences. Treat future benefit as a hypothesis until the changed workflow operates long enough to measure." },
      { title: "Beware of false precision", body: "An instant quote may omit exception handling, access, testing, training, and maintenance. A range can be useful only when its assumptions are visible." },
    ],
    faqs: [["Why not publish a flat package price?", "A flat price is honest only when the workflow boundary and deliverables are truly standardized."], ["Are software subscriptions included?", "They should be shown separately so you can understand ongoing cost and ownership."], ["How is ROI calculated?", "Use measured baseline and operating results, include implementation and recurring costs, and state what cannot be attributed confidently."]],
  },
  {
    slug: "hire-another-employee-or-automate",
    title: "Should I hire another employee or automate the process?",
    answer: "Hire when the work needs judgment, relationships, adaptability, or more service capacity. Automate when a stable, repeated administrative sequence is consuming attention. Often the best answer is both: remove avoidable coordination work so a new or existing employee can spend more time on customers and skilled decisions.",
    sections: [
      { title: "Separate demand from friction", body: "If customers are waiting because the team lacks skilled capacity, hiring may be the answer. If people spend the day copying, chasing, sorting, and checking, process improvement may release capacity first." },
      { title: "Map the work before choosing", body: "For two weeks, record task volume, touch time, waiting, rework, decisions, and customer contact. Mark which steps require context or accountability and which follow stable rules." },
      { title: "Compare the full options", body: "Consider hiring, training, simplifying the process, configuring current tools, outsourcing, automating, or combining them. Include ramp time, management effort, software cost, failure risk, and maintenance." },
      { title: "Protect the human role", body: "Automation should not make commitments, resolve sensitive exceptions, or hide failures simply because those steps are hard to staff. Define the work people must continue to own." },
    ],
    faqs: [["Can automation replace a full-time role?", "That should not be assumed. Roles contain varied work, and automating tasks is not the same as replacing the responsibility, judgment, and relationships in a job."], ["What if we are already overloaded?", "Choose a narrow diagnostic that uses recent examples and requires limited staff time; avoid launching a broad transformation program."], ["How do we know whether capacity improved?", "Measure throughput, delay, rework, customer experience, and staff intervention before and after the change."]],
  },
  {
    slug: "automate-customer-intake-without-losing-personal-touch",
    title: "How do I automate customer intake without losing the personal touch?",
    answer: "Automate the repetitive coordination around customer intake, collection, completeness checks, routing, confirmations, and reminders, while keeping people responsible for empathy, clarification, sensitive situations, and commitments. Tell customers what happens next and make human help easy to reach.",
    sections: [
      { title: "Ask only what the next step needs", body: "Long forms shift your internal complexity onto the customer. Start with the minimum information required to route or prepare the next conversation, then ask more only when relevant." },
      { title: "Write like a helpful person", body: "Use plain labels, explain why sensitive information is needed, confirm what was received, give a realistic response path, and never pretend an automated message was personally written." },
      { title: "Design human takeover", body: "Route ambiguity, distress, complaints, unusual requests, high-value opportunities, and low-confidence extraction to a named person. The customer should not need to fight the automation to reach help." },
      { title: "Test both experiences", body: "Test complete, incomplete, duplicate, mobile, accessibility, urgent, and privacy-sensitive cases. Then have the staff member who receives the work verify that the information is usable." },
    ],
    faqs: [["Should we use a chatbot for intake?", "Only if conversation materially improves the task. A clear form plus responsive human follow-up may be simpler and more trustworthy."], ["Can we personalize confirmations?", "Yes, using verified fields and careful defaults. Avoid generated claims or specifics that have not been confirmed."], ["What should never be fully automated?", "Sensitive judgment, commitments, complaints, safety concerns, and cases outside the defined rules need human ownership."]],
  },
];

export const searchPages: Record<string, [string, string]> = Object.fromEntries([
  ...services.map((s) => [`/services/${s.slug}`, [s.title, s.short] as [string, string]]),
  ...guides.map((g) => [`/guides/${g.slug}`, [g.title, g.answer] as [string, string]]),
  ["/case-studies/operations-assessment", ["Operations assessment implementation note", "A first-party note showing how Wonder & Workflow bounded, built, and tested its own public operations assessment. Not a client case study."]],
  ["/guides", ["Guides for field and service shops stuck in intake and admin", "Direct answers on missed intake, leaking handoffs, CRM busywork, and whether you need another tool. For owners of 1–50 person shops."]],
]);

export const honestyFaqs: [string, string][] = [
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
    "We assess it first. Available integrations, account permissions, data quality, vendor limits, and cost determine what is feasible. Sometimes the best result is better use of what you already own. You may not need another tool.",
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

function Breadcrumbs({ items }: { items: [string, string][] }) {
  return <nav className="ww-breadcrumbs" aria-label="Breadcrumb"><ol>{items.map(([label, href], i) => <li key={href}>{i ? <span aria-hidden="true">/</span> : null}<Link to={href}>{label}</Link></li>)}</ol></nav>;
}

function Faqs({ items }: { items: [string, string][] }) {
  return <section className="ww-search-faq"><p className="ww-eyebrow">Questions, answered</p><h2>What buyers usually ask</h2>{items.map(([q, a]) => <details key={q}><summary>{q}</summary><p>{a}</p></details>)}</section>;
}

function Related() {
  return <section className="ww-related"><p className="ww-eyebrow">Related services</p><h2>Continue with the problem closest to yours.</h2><div>{services.map((s) => <Link key={s.slug} to={`/services/${s.slug}`}><strong>{s.title}</strong><span>{s.short}</span><b aria-hidden="true">↗</b></Link>)}</div></section>;
}

export function ServiceDirectory() {
  return <section className="ww-related ww-service-directory"><p className="ww-eyebrow">Explore by need</p><h2>Start with the stuck point you can name.</h2><div>{services.map((s) => <Link key={s.slug} to={`/services/${s.slug}`}><strong>{s.title}</strong><span>{s.short}</span><b aria-hidden="true">↗</b></Link>)}</div></section>;
}

export function ServicePage({ service }: { service: Service }) {
  return <>
    <article className="ww-search-page">
      <Breadcrumbs items={[["Services", "/services"], [service.title, `/services/${service.slug}`]]} />
      <header><p className="ww-eyebrow">Service / {service.title}</p><h1>{service.title}</h1><p className="ww-search-lede">{service.short}</p><Link className="ww-button" to="/assessment">Assess your operations <span aria-hidden="true">↗</span></Link></header>
      <section className="ww-answer-block"><p className="ww-eyebrow">The problem</p><h2>{service.problem}</h2></section>
      {service.extraSections?.map((section) => (
        <section className="ww-service-extra" key={section.title}>
          {section.eyebrow ? <p className="ww-eyebrow">{section.eyebrow}</p> : null}
          <h2>{section.title}</h2>
          <p>{section.body}</p>
          {section.points ? <ul>{section.points.map((x) => <li key={x}>{x}</li>)}</ul> : null}
        </section>
      ))}
      <div className="ww-search-columns"><section><p className="ww-eyebrow">Ideal customer</p><h2>This is a fit when…</h2><ul>{service.ideal.map(x => <li key={x}>{x}</li>)}</ul></section><section><p className="ww-eyebrow">Process</p><h2>How the work moves</h2><ol>{service.process.map((x, i) => <li key={x}><span>0{i + 1}</span>{x}</li>)}</ol></section></div>
      <section className="ww-deliverables"><p className="ww-eyebrow">Deliverables</p><h2>What you receive</h2><div>{service.deliverables.map((x, i) => <article key={x}><span>0{i + 1}</span><h3>{x}</h3></article>)}</div></section>
      <section className="ww-pricing"><p className="ww-eyebrow">Pricing approach</p><h2>Scope first. Price in writing.</h2><p>{service.pricing}</p></section>
      <Faqs items={service.faqs} />
    </article>
    <Related />
    <section className="ww-search-cta"><p className="ww-eyebrow">Next step</p><h2>Bring one real path of work.</h2><p>Complete the two-minute assessment (contact details and save), then book a complimentary {FIT_REVIEW_NAME} on the calendar. {ONE_PATH_COPY}</p><p className="ww-cta-ladder">{LADDER_NOTE}</p><Link className="ww-button" to="/assessment">Start the assessment <span aria-hidden="true">↗</span></Link></section>
  </>;
}

export function GuidesIndex() {
  return <article className="ww-search-page"><Breadcrumbs items={[["Guides", "/guides"]]} /><header><p className="ww-eyebrow">Practical answers</p><h1>Guides for shops stuck between intake and paid</h1><p className="ww-search-lede">Clear answers on missed intake, leaking handoffs, CRM busywork, and whether you need another tool.</p></header><section className="ww-guide-grid">{guides.map(g => <Link key={g.slug} to={`/guides/${g.slug}`}><span>Guide</span><h2>{g.title}</h2><p>{g.answer}</p><b>Read the answer ↗</b></Link>)}</section></article>;
}

export function GuidePage({ guide }: { guide: Guide }) {
  return <>
    <article className="ww-search-page ww-guide-page">
      <Breadcrumbs items={[["Guides", "/guides"], [guide.title, `/guides/${guide.slug}`]]} />
      <header><p className="ww-eyebrow">Answer-first guide</p><h1>{guide.title}</h1><p className="ww-search-lede">{guide.answer}</p></header>
      <aside className="ww-guide-checklist"><p className="ww-eyebrow">Short answer</p><p>{guide.answer}</p></aside>
      {guide.sections.map((s, i) => <section className="ww-guide-section" key={s.title}><span>0{i + 1}</span><div><h2>{s.title}</h2><p>{s.body}</p>{s.points ? <ul>{s.points.map(x => <li key={x}>{x}</li>)}</ul> : null}</div></section>)}
      <Faqs items={guide.faqs} />
      <p className="ww-editorial-note">Reviewed {guide.reviewed ?? "September 9, 2026"}. This guide describes a decision method, not a guaranteed result. Feasibility depends on the actual workflow, tools, data, permissions, and consequences of error.</p>
    </article>
    <Related />
    <section className="ww-search-cta"><p className="ww-eyebrow">Apply the answer</p><h2>Find the first improvement worth making.</h2><p>The assessment takes about two minutes. Save your contact details, then book a complimentary {FIT_REVIEW_NAME}. {ONE_PATH_COPY}</p><p className="ww-cta-ladder">{LADDER_NOTE}</p><Link className="ww-button" to="/assessment">Assess your operations <span aria-hidden="true">↗</span></Link></section>
  </>;
}

export function AssessmentCaseStudy() {
  return <article className="ww-search-page ww-case-study">
    <Breadcrumbs items={[["Case studies", "/case-studies/operations-assessment"], ["Operations assessment", "/case-studies/operations-assessment"]]} />
    <header><p className="ww-eyebrow">First-party implementation study</p><h1>Building our operations assessment as a bounded workflow</h1><p className="ww-search-lede">This is an internal implementation note, not a client case study. It shows the inputs, design decisions, controls, and tests behind Wonder & Workflow’s own public assessment, without claiming invented savings.</p></header>
    <section className="ww-case-facts"><div><span>Boundary</span><strong>Seven questions; 0–21 indicative score</strong></div><div><span>Data posture</span><strong>Answers calculated in the browser</strong></div><div><span>Human role</span><strong>Consultant interprets context</strong></div><div><span>Claim limit</span><strong>No automatic diagnosis or savings claim</strong></div></section>
    <section className="ww-answer-block"><p className="ww-eyebrow">Starting condition</p><h2>The business needed a useful first step that did not pretend a short questionnaire could diagnose an operation.</h2><p>The assessment had to help an owner notice workflow friction, preserve privacy, work on mobile and keyboard, and lead naturally to a human conversation. It could not collect credentials, infer ROI, or activate a customer workflow.</p></section>
    <section className="ww-process-map"><p className="ww-eyebrow">Before and after process map</p><h2>From a vague request to a reviewable next step</h2><div className="ww-map-row"><span>Before</span><ol><li>Owner feels operational friction</li><li>Problem stays broad</li><li>Solution discussion begins too early</li></ol></div><div className="ww-map-row ww-map-after"><span>After</span><ol><li>Owner answers seven bounded questions</li><li>Browser calculates an indicative band</li><li>Result names discussion areas and limitations</li><li>Owner chooses whether to email for a fit review</li></ol></div></section>
    <section className="ww-guide-section"><span>01</span><div><h2>Controls built into the workflow</h2><ul><li>The assessment does not request contact details or confidential records.</li><li>Answers and result remain in browser memory unless the visitor independently chooses to contact us.</li><li>Score language is indicative, not diagnostic.</li><li>The consultation, not the score, determines whether a deeper diagnostic makes sense.</li><li>Customer communications and CRM automation remain outside this workflow.</li></ul></div></section>
    <section className="ww-guide-section"><span>02</span><div><h2>Acceptance criteria</h2><ul><li>All seven questions are usable by keyboard and at narrow mobile widths.</li><li>Score boundaries follow the documented 0–21 calculation rules.</li><li>Refresh and back/forward behavior do not submit information.</li><li>Privacy, contact, and assessment routes are crawlable public pages; internal workspace routes are excluded.</li><li>The result states its limits and provides a clear next step.</li></ul></div></section>
    <section className="ww-pricing"><p className="ww-eyebrow">Observed result</p><h2>A functioning assessment with explicit boundaries, not a fabricated ROI story.</h2><p>The implemented flow gives visitors a two-minute self-assessment and keeps their answers local to the browser. Automated build, calculation, route, accessibility, and browser tests are maintained in the project. Test results describe software behavior only; they do not prove client savings or commercial outcomes.</p></section>
    <section className="ww-answer-block"><p className="ww-eyebrow">What we would measure next</p><h2>Evidence should grow with real use.</h2><p>Useful next measures include completion rate, qualified fit-review requests, the workflows visitors choose to discuss, accessibility issues, and the percentage of reviews that lead to a grounded proceed, revise, or stop decision. Any future case study should state its baseline, method, period, limitations, and permission.</p></section>
    <section className="ww-search-cta"><p className="ww-eyebrow">See the workflow</p><h2>Use the same assessment.</h2><p>Try the public assessment, then decide whether one workflow deserves a closer look.</p><Link className="ww-button" to="/assessment">Start the assessment <span aria-hidden="true">↗</span></Link></section>
  </article>;
}

function faqPage(items: [string, string][]) {
  return {
    "@type": "FAQPage",
    mainEntity: items.map(([question, answer]) => ({
      "@type": "Question",
      name: question,
      acceptedAnswer: { "@type": "Answer", text: answer },
    })),
  };
}

export function structuredData(pathname: string) {
  const service = services.find((s) => pathname === `/services/${s.slug}`);
  const guide = guides.find((g) => pathname === `/guides/${g.slug}`);
  const graph: Record<string, unknown>[] = [organizationNode()];
  if (pathname === "/") {
    graph.push(websiteNode());
    return { "@context": "https://schema.org", "@graph": graph };
  }
  if (pathname === "/services") {
    graph.push(faqPage(honestyFaqs));
    return { "@context": "https://schema.org", "@graph": graph };
  }
  if (pathname === "/assessment") {
    graph.push(assessmentHowToNode());
    return { "@context": "https://schema.org", "@graph": graph };
  }
  if (!searchPages[pathname] && !service && !guide) return null;
  graph.push({
    "@type": "BreadcrumbList",
    itemListElement: pathname
      .split("/")
      .filter(Boolean)
      .map((part, i, all) => ({
        "@type": "ListItem",
        position: i + 1,
        name: part.replaceAll("-", " "),
        item: `https://wonderworkflow.com/${all.slice(0, i + 1).join("/")}`,
      })),
  });
  if (service) {
    graph.push({
      "@type": "Service",
      name: service.title,
      description: service.short,
      provider: { "@id": "https://wonderworkflow.com/#organization" },
      url: `https://wonderworkflow.com${pathname}`,
      offers: { "@type": "Offer", description: service.pricing },
    });
    graph.push(faqPage(service.faqs));
  }
  if (guide) {
    graph.push({
      "@type": "Article",
      headline: guide.title,
      description: guide.answer,
      dateModified: guide.dateModified ?? "2026-09-09",
      author: { "@id": "https://wonderworkflow.com/#organization" },
      publisher: { "@id": "https://wonderworkflow.com/#organization" },
      mainEntityOfPage: `https://wonderworkflow.com${pathname}`,
    });
    graph.push(faqPage(guide.faqs));
  }
  return { "@context": "https://schema.org", "@graph": graph };
}

export function applyStructuredData(pathname: string) {
  writeJsonLd(structuredData(pathname));
}
