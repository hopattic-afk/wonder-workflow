import { ASSESSMENT_META, HOME_DESCRIPTION } from "./publicOffer";

export function organizationNode() {
  return {
    "@type": "Organization",
    "@id": "https://wonderworkflow.com/#organization",
    name: "Wonder & Workflow",
    legalName: "Wonder&Workflow LLC",
    url: "https://wonderworkflow.com",
    email: "operations@wonderworkflow.com",
    logo: "https://wonderworkflow.com/brand/primary-stacked-paper.png",
    sameAs: ["https://www.instagram.com/wonderandworkflow/"],
  };
}

export function websiteNode() {
  return {
    "@type": "WebSite",
    "@id": "https://wonderworkflow.com/#website",
    url: "https://wonderworkflow.com/",
    name: "Wonder & Workflow",
    description: HOME_DESCRIPTION,
    publisher: { "@id": "https://wonderworkflow.com/#organization" },
  };
}

export function assessmentHowToNode() {
  return {
    "@type": "HowTo",
    name: "Assess your operations",
    description: ASSESSMENT_META,
    totalTime: "PT2M",
    step: [
      {
        "@type": "HowToStep",
        position: 1,
        name: "Answer seven questions",
        text: "Answer seven questions about how work happens today. About two minutes.",
      },
      {
        "@type": "HowToStep",
        position: 2,
        name: "Save your contact details",
        text: "Add your contact details and save the assessment.",
      },
      {
        "@type": "HowToStep",
        position: 3,
        name: "Book an Operations Fit Review",
        text: "Book a complimentary 30-minute Operations Fit Review on the calendar.",
      },
    ],
  };
}

export function assessmentJsonLd() {
  return {
    "@context": "https://schema.org",
    "@graph": [organizationNode(), assessmentHowToNode()],
  };
}

export function writeJsonLd(schema: object | null) {
  document.querySelector("#ww-structured-data")?.remove();
  if (!schema) return;
  const script = document.createElement("script");
  script.id = "ww-structured-data";
  script.type = "application/ld+json";
  script.textContent = JSON.stringify(schema).replaceAll("<", "\\u003c");
  document.head.appendChild(script);
}
