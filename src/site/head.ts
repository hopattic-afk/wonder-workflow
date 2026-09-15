export const SITE_ORIGIN = "https://wonderworkflow.com";
export const OG_IMAGE = `${SITE_ORIGIN}/brand/og-ops.png`;
export const organization = {
  "@type": "Organization",
  "@id": `${SITE_ORIGIN}/#organization`,
  name: "Wonder & Workflow",
  legalName: "Wonder&Workflow LLC",
  url: SITE_ORIGIN,
  email: "operations@wonderworkflow.com",
  logo: `${SITE_ORIGIN}/brand/logo.png`,
};

export function canonicalUrl(path: string) {
  if (path === "/") return `${SITE_ORIGIN}/`;
  return `${SITE_ORIGIN}${path.replace(/\/+$/, "")}`;
}

export function faqPage(url: string, faqs: [string, string][]) {
  return {
    "@type": "FAQPage",
    "@id": `${url}#faq`,
    url,
    mainEntity: faqs.map(([name, text]) => ({
      "@type": "Question",
      name,
      acceptedAnswer: { "@type": "Answer", text },
    })),
  };
}

export function graph(nodes: Record<string, unknown>[]) {
  return { "@context": "https://schema.org", "@graph": nodes };
}

export function assessmentStructuredData() {
  return graph([
    organization,
    {
      "@type": "HowTo",
      name: "Complete the operations assessment",
      description:
        "A 2-minute, 7-question operations check. Save your contact details, then book a complimentary 30-minute Workflow Fit Review.",
      totalTime: "PT2M",
      url: `${SITE_ORIGIN}/assessment`,
      step: [
        {
          "@type": "HowToStep",
          position: 1,
          name: "Answer seven questions",
          text: "Answer seven questions about how work happens today. The assessment takes about two minutes.",
        },
        {
          "@type": "HowToStep",
          position: 2,
          name: "Save your contact details",
          text: "Add your contact details and save so we can prepare for the conversation.",
        },
        {
          "@type": "HowToStep",
          position: 3,
          name: "Book a Workflow Fit Review",
          text: "Book a complimentary 30-minute Workflow Fit Review on the calendar to discuss one workflow to improve.",
        },
      ],
    },
  ]);
}

function upsertMeta(selector: string, attributes: Record<string, string>) {
  let element = document.querySelector<HTMLMetaElement>(selector);
  if (!element) {
    element = document.createElement("meta");
    document.head.appendChild(element);
  }
  for (const [name, value] of Object.entries(attributes)) {
    element.setAttribute(name, value);
  }
}

export function applyPageHead(
  path: string,
  title: string,
  description: string,
  schema: ReturnType<typeof graph> | null = null,
) {
  const url = canonicalUrl(path);
  document.title = `${title} | Wonder & Workflow`;
  let descriptionTag = document.querySelector<HTMLMetaElement>(
    'meta[name="description"]',
  );
  if (!descriptionTag) {
    descriptionTag = document.createElement("meta");
    descriptionTag.name = "description";
    document.head.appendChild(descriptionTag);
  }
  descriptionTag.content = description;
  let canonical = document.querySelector<HTMLLinkElement>('link[rel="canonical"]');
  if (!canonical) {
    canonical = document.createElement("link");
    canonical.rel = "canonical";
    document.head.appendChild(canonical);
  }
  canonical.href = url;
  upsertMeta('meta[property="og:title"]', {
    property: "og:title",
    content: `${title} | Wonder & Workflow`,
  });
  upsertMeta('meta[property="og:description"]', {
    property: "og:description",
    content: description,
  });
  upsertMeta('meta[property="og:url"]', { property: "og:url", content: url });
  upsertMeta('meta[property="og:image"]', {
    property: "og:image",
    content: OG_IMAGE,
  });
  upsertMeta('meta[property="og:type"]', {
    property: "og:type",
    content: "website",
  });
  upsertMeta('meta[name="twitter:card"]', {
    name: "twitter:card",
    content: "summary_large_image",
  });
  document.querySelector("#ww-structured-data")?.remove();
  if (!schema) return;
  const script = document.createElement("script");
  script.id = "ww-structured-data";
  script.type = "application/ld+json";
  script.textContent = JSON.stringify(schema).replaceAll("<", "\\u003c");
  document.head.appendChild(script);
}
