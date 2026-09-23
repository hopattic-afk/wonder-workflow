import { useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import {
  ASSESS_BEAT_LABEL,
  ASSESS_CLOSE,
  AUTOMATION_BODY,
  AUTOMATION_H2,
  AUTOMATION_TRUTH,
  CHAT_WITH_US,
  CONTACT_MAILTO,
  FEEL_FACE,
  FEEL_SUPPORT,
  FIT_REVIEW_LINE,
  HOMEPAGE_MEDIA,
  INFLECTION_FORKS,
  INFLECTION_INTRO,
  DIAGNOSTIC_H1,
  DIAGNOSTIC_PATH,
  SEASONING_CARDS,
  SEASONING_H2,
  SEASONING_SUPPORT,
  UNDERSTAND_H2,
  UNDERSTAND_LEAD,
  UNDERSTAND_STEPS,
  WHO_FOR_BODY,
  WHO_FOR_HEADING,
  WORK_WITH_US,
} from "./publicOffer";
import "./homepage-ship.css";

export type HomeChrome = {
  onMedia: boolean;
  assessGlow: boolean;
};

const STRIP = [
  { src: HOMEPAGE_MEDIA.desk, caption: "Handoffs" },
  { src: HOMEPAGE_MEDIA.field, caption: "Field pace" },
  { src: HOMEPAGE_MEDIA.shop, caption: "Shop floor" },
  { src: HOMEPAGE_MEDIA.pile, caption: "The pile" },
] as const;

export function HomepageShip({
  onChrome,
}: {
  onChrome?: (chrome: HomeChrome) => void;
}) {
  const feelRef = useRef<HTMLDivElement>(null);
  const assessRef = useRef<HTMLDivElement>(null);
  const chromeRef = useRef(onChrome);
  chromeRef.current = onChrome;

  useEffect(() => {
    const feel = feelRef.current;
    const assess = assessRef.current;
    let raf = 0;
    const apply = () => {
      raf = 0;
      const headerLine = 72;
      const viewH = window.innerHeight || 1;
      const feelRect = feel?.getBoundingClientRect();
      const assessRect = assess?.getBoundingClientRect();
      chromeRef.current?.({
        onMedia: Boolean(
          feelRect && feelRect.top < headerLine && feelRect.bottom > headerLine,
        ),
        assessGlow: Boolean(
          assessRect &&
            assessRect.top < viewH * 0.72 &&
            assessRect.bottom > viewH * 0.28,
        ),
      });
    };
    const onScroll = () => {
      if (!raf) raf = window.requestAnimationFrame(apply);
    };
    apply();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
      if (raf) window.cancelAnimationFrame(raf);
    };
  }, []);

  return (
    <div className="ship" data-homepage-ship>
      <section className="ship-chapter" aria-label="Feel Understand Assess">
        <div className="ship-stage">
          <div className="ship-beat ship-beat-feel" ref={feelRef} data-beat="feel">
            <div className="ship-feel-media">
              <img
                className="ship-feel-hero"
                src={HOMEPAGE_MEDIA.feel}
                alt="Long warehouse aisle packed with inventory, reading as capacity and pace under load"
                width={2000}
                height={2666}
                fetchPriority="high"
              />
              <div className="ship-feel-scrim" aria-hidden="true" />
            </div>
            <div className="ship-feel-content">
              <p className="ship-beat-label">Feel</p>
              <h2 className="ship-display ship-display-xl">{FEEL_FACE}</h2>
              <p className="ship-feel-support">{FEEL_SUPPORT}</p>
            </div>
            <div className="ship-feel-strip" aria-hidden="true">
              {STRIP.map((item) => (
                <figure key={item.caption}>
                  <img src={item.src} alt="" width={600} height={400} loading="lazy" />
                  <figcaption>{item.caption}</figcaption>
                </figure>
              ))}
            </div>
          </div>

          <div className="ship-beat ship-beat-understand" data-beat="understand">
            <div className="ship-understand-grid">
              <div>
                <p className="ship-beat-label">Understand</p>
                <h2 className="ship-display ship-display-lg">{UNDERSTAND_H2}</h2>
                <p className="ship-lede">{UNDERSTAND_LEAD}</p>
                <ul className="ship-steps">
                  {UNDERSTAND_STEPS.map((step) => (
                    <li key={step}>
                      <span className="ship-step-body">{step}</span>
                    </li>
                  ))}
                </ul>
              </div>
              <div className="ship-understand-media">
                <img
                  src={HOMEPAGE_MEDIA.desk}
                  alt="Hands and paper notes on a desk during a work handoff"
                  width={2000}
                  height={1335}
                  loading="lazy"
                />
              </div>
            </div>
          </div>

          <div className="ship-beat ship-beat-assess" ref={assessRef} data-beat="assess">
            <p className="ship-beat-label">Assess</p>
            <div className="ship-assess-rule" aria-hidden="true" />
            <p className="ship-close-lines">
              {ASSESS_CLOSE[0]}
              <br />
              {ASSESS_CLOSE[1]}
            </p>
            <p className="ship-fit-line">{FIT_REVIEW_LINE}</p>
            <div className="ship-cta-row">
              <Link className="ship-btn-primary" to="/assessment">
                {ASSESS_BEAT_LABEL} <span aria-hidden="true">↗</span>
              </Link>
              <Link className="ship-btn-ghost" to={DIAGNOSTIC_PATH}>
                {DIAGNOSTIC_H1}
              </Link>
              <a className="ship-btn-ghost" href={CONTACT_MAILTO}>
                {CHAT_WITH_US}
              </a>
              <span className="ship-cta-sep" aria-hidden="true">
                ·
              </span>
              <a className="ship-btn-ghost" href={CONTACT_MAILTO}>
                {WORK_WITH_US}
              </a>
            </div>
          </div>
        </div>
      </section>

      <div className="ship-below">
        <section className="ship-section" aria-labelledby="inflection-heading">
          <p className="ship-kicker">Owner-scale forks</p>
          <h2 className="ship-section-h2" id="inflection-heading">
            {INFLECTION_INTRO}
          </h2>
          <div className="ship-fork-grid">
            {INFLECTION_FORKS.map(([title, body]) => (
              <article className="ship-fork-card" key={title}>
                <h3>{title}</h3>
                <p>{body}</p>
              </article>
            ))}
          </div>
        </section>

        <section className="ship-section ship-section-tight" aria-labelledby="season-heading">
          <p className="ship-kicker">Seasoning</p>
          <h2 className="ship-section-h2" id="season-heading">
            {SEASONING_H2}
          </h2>
          <p className="ship-section-lead">{SEASONING_SUPPORT}</p>
          <div className="ship-season-grid">
            {SEASONING_CARDS.map(([title, body]) => (
              <article className="ship-season-card" key={title}>
                <h3>{title}</h3>
                <p>{body}</p>
              </article>
            ))}
          </div>
        </section>

        <section className="ship-section ship-section-rule" aria-labelledby="auto-heading">
          <div className="ship-auto-block">
            <div>
              <p className="ship-kicker">Supporting</p>
              <h2 className="ship-section-h2" id="auto-heading">
                {AUTOMATION_H2}
              </h2>
              <p className="ship-section-lead">{AUTOMATION_BODY}</p>
            </div>
            <p className="ship-owner-truth">{AUTOMATION_TRUTH}</p>
          </div>
        </section>

        <section className="ship-section ship-section-tight" aria-labelledby="icp-heading">
          <h2 className="ship-section-h2" id="icp-heading">
            {WHO_FOR_HEADING}
          </h2>
          <p className="ship-section-lead">{WHO_FOR_BODY}</p>
        </section>
      </div>
    </div>
  );
}

export default HomepageShip;
