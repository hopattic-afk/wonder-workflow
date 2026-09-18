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
  SEASONING_CARDS,
  UNDERSTAND_H2,
  UNDERSTAND_LEAD,
  UNDERSTAND_STEPS,
  WHO_FOR_BODY,
  WHO_FOR_EXCLUDE,
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

function clamp(n: number, a: number, b: number) {
  return Math.max(a, Math.min(b, n));
}
function lerp(a: number, b: number, t: number) {
  return a + (b - a) * t;
}
function smooth(t: number) {
  return t * t * (3 - 2 * t);
}

function setBeat(el: HTMLElement | null, opacity: number, y: number) {
  if (!el) return;
  el.style.opacity = String(opacity);
  el.style.transform = y ? `translate3d(0,${y}px,0)` : "none";
  el.classList.toggle("is-active", opacity > 0.35);
}

export function HomepageShip({
  onChrome,
}: {
  onChrome?: (chrome: HomeChrome) => void;
}) {
  const chapterRef = useRef<HTMLElement>(null);
  const feelRef = useRef<HTMLDivElement>(null);
  const understandRef = useRef<HTMLDivElement>(null);
  const assessRef = useRef<HTMLDivElement>(null);
  const heroRef = useRef<HTMLImageElement>(null);
  const stripRef = useRef<HTMLDivElement>(null);
  const chromeRef = useRef(onChrome);
  chromeRef.current = onChrome;

  useEffect(() => {
    const chapter = chapterRef.current;
    if (!chapter) return;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const still = new URLSearchParams(window.location.search).get("still");

    const apply = (p: number) => {
      const feelOp = p < 0.28 ? 1 : p < 0.42 ? 1 - smooth((p - 0.28) / 0.14) : 0;
      const undOp =
        p < 0.28
          ? 0
          : p < 0.38
            ? smooth((p - 0.28) / 0.1)
            : p < 0.58
              ? 1
              : p < 0.7
                ? 1 - smooth((p - 0.58) / 0.12)
                : 0;
      const assOp = p < 0.58 ? 0 : p < 0.7 ? smooth((p - 0.58) / 0.12) : 1;

      setBeat(feelRef.current, feelOp, reduce ? 0 : (1 - feelOp) * -24);
      setBeat(understandRef.current, undOp, reduce ? 0 : (1 - undOp) * 18);
      setBeat(assessRef.current, assOp, reduce ? 0 : (1 - assOp) * 18);

      if (!reduce && heroRef.current) {
        const scale = lerp(1.06, 1, clamp(p / 0.36, 0, 1));
        heroRef.current.style.transform = `scale(${scale.toFixed(4)})`;
      }

      const figures = stripRef.current?.querySelectorAll("figure") ?? [];
      figures.forEach((fig, i) => {
        const start = 0.04 + i * 0.035;
        const t = clamp((p - start) / 0.12, 0, 1);
        const op = feelOp * (0.35 + 0.65 * smooth(t));
        const y = reduce ? 0 : (1 - smooth(t)) * 18;
        (fig as HTMLElement).style.opacity = String(op);
        (fig as HTMLElement).style.transform = y
          ? `translate3d(0,${y}px,0)`
          : "none";
      });

      chromeRef.current?.({
        onMedia: feelOp > 0.45,
        assessGlow: assOp > 0.55 || p > 0.85,
      });
    };

    const progressFromScroll = () => {
      const rect = chapter.getBoundingClientRect();
      const run = chapter.offsetHeight - window.innerHeight;
      if (run <= 0) return 0;
      return clamp(-rect.top / run, 0, 1);
    };

    if (still === "feel" || still === "understand" || still === "assess") {
      document.body.dataset.still = still;
      apply({ feel: 0.08, understand: 0.48, assess: 0.88 }[still]);
      return () => {
        delete document.body.dataset.still;
      };
    }

    if (reduce) {
      apply(0.08);
      const onScroll = () => apply(progressFromScroll() > 0.5 ? 0.9 : 0.08);
      window.addEventListener("scroll", onScroll, { passive: true });
      return () => window.removeEventListener("scroll", onScroll);
    }

    let raf = 0;
    const tick = () => {
      raf = 0;
      apply(progressFromScroll());
    };
    const onScroll = () => {
      if (!raf) raf = window.requestAnimationFrame(tick);
    };
    apply(progressFromScroll());
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
      <section
        className="ship-chapter"
        ref={chapterRef}
        aria-label="Feel Understand Assess"
      >
        <div className="ship-stage">
          <div className="ship-beat ship-beat-feel is-active" ref={feelRef} data-beat="feel">
            <div className="ship-feel-media">
              <img
                className="ship-feel-hero"
                ref={heroRef}
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
            <div className="ship-feel-strip" ref={stripRef} aria-hidden="true">
              {STRIP.map((item) => (
                <figure key={item.caption}>
                  <img src={item.src} alt="" width={600} height={400} loading="lazy" />
                  <figcaption>{item.caption}</figcaption>
                </figure>
              ))}
            </div>
          </div>

          <div className="ship-beat ship-beat-understand" ref={understandRef} data-beat="understand">
            <div className="ship-understand-grid">
              <div>
                <p className="ship-beat-label">Understand</p>
                <h2 className="ship-display ship-display-lg">{UNDERSTAND_H2}</h2>
                <p className="ship-lede">{UNDERSTAND_LEAD}</p>
                <ol className="ship-steps">
                  {UNDERSTAND_STEPS.map((step, index) => (
                    <li key={step}>
                      <span className="ship-step-num">0{index + 1}</span>
                      <span className="ship-step-body">{step}</span>
                    </li>
                  ))}
                </ol>
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
            Where the day frays.
          </h2>
          <p className="ship-section-lead">
            Equal weight. Not the brand face. No Assess on these cards.
          </p>
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
          <p className="ship-icp-not">
            <strong>{WHO_FOR_EXCLUDE.split(":")[0]}:</strong>
            {WHO_FOR_EXCLUDE.slice(WHO_FOR_EXCLUDE.indexOf(":") + 1)}
          </p>
        </section>
      </div>
    </div>
  );
}

export default HomepageShip;
