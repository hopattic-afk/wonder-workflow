import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { publicHref } from "./campaign";
import {
  ASSESS_CLOSE_HEAD,
  ASSESS_CLOSE_LEDE,
  AUTOMATION_BODY,
  AUTOMATION_HEAD,
  AUTOMATION_QUIET,
  FEEL_SEASONING,
  FIT_REVIEW_LOCK,
  INFLECTION_FORKS,
  UNDERSTAND_HEAD,
  UNDERSTAND_LEDE,
} from "./publicOffer";
import {
  assessGlowFromProgress,
  beatOpacities,
  chapterProgress,
  feelTension,
  lerp,
  range,
  smooth,
} from "./feelUnderstandAssessMotion";
import "./feel-understand-assess.css";

const UNDERSTAND_STEPS = [
  "Sit with the work as it happens and name the friction in plain language.",
  "See where handoffs stall, details live in one head, and status has to be chased.",
  "Design the change to fit your shop: strategy and execution, not a deck left behind.",
] as const;

const FEEL_LINE = (
  <>
    The way work gets done{" "}
    <br />
    can't keep up with the work.
  </>
);

function setGlow(on: boolean) {
  if (on) document.documentElement.dataset.wwAssessGlow = "true";
  else delete document.documentElement.dataset.wwAssessGlow;
}

export function FeelUnderstandAssess() {
  const chapterRef = useRef<HTMLElement>(null);
  const feelRef = useRef<HTMLDivElement>(null);
  const understandRef = useRef<HTMLDivElement>(null);
  const assessRef = useRef<HTMLDivElement>(null);
  const ghostsRef = useRef<HTMLParagraphElement[]>([]);
  const paceMarksRef = useRef<HTMLDivElement>(null);
  const paceCaptionRef = useRef<HTMLParagraphElement>(null);
  const stepsRef = useRef<HTMLDivElement[]>([]);
  const assessCtaRef = useRef<HTMLDivElement>(null);
  const calmRuleRef = useRef<HTMLDivElement>(null);
  const ticksRef = useRef<HTMLElement[]>([]);
  const hintRef = useRef<HTMLParagraphElement>(null);
  const [reducedMotion, setReducedMotion] = useState(false);

  useEffect(() => {
    const media = window.matchMedia?.("(prefers-reduced-motion: reduce)");
    const reduced = Boolean(media?.matches);
    setReducedMotion(reduced);
    if (reduced) {
      setGlow(true);
      return () => setGlow(false);
    }

    const chapter = chapterRef.current;
    if (!chapter) return;

    let ticking = false;
    const apply = () => {
      const p = chapterProgress(
        chapter.getBoundingClientRect().top,
        chapter.offsetHeight,
        window.innerHeight,
      );
      const { feel, understand, assess } = beatOpacities(p);
      const tension = feelTension(p);
      const feelHold = 1 - smooth(range(p, 0.28, 0.4));

      if (feelRef.current) {
        feelRef.current.style.opacity = String(feel);
        feelRef.current.classList.toggle("is-active", feel > 0.2);
      }
      if (understandRef.current) {
        understandRef.current.style.opacity = String(understand);
        understandRef.current.classList.toggle("is-active", understand > 0.2);
      }
      if (assessRef.current) {
        assessRef.current.style.opacity = String(assess);
        assessRef.current.classList.toggle("is-active", assess > 0.2);
      }

      ghostsRef.current.forEach((ghost, i) => {
        if (!ghost) return;
        const weights = [0.95, 0.75, 0.55];
        ghost.style.opacity = String(tension * weights[i]);
        const drifts = [
          [0.04, -0.06],
          [-0.08, 0.1],
          [0.14, 0.03],
        ] as const;
        ghost.style.transform = `translate(${drifts[i][0] * tension}em, ${drifts[i][1] * tension}em)`;
      });
      if (paceMarksRef.current) {
        paceMarksRef.current.style.opacity = String(tension);
      }
      if (paceCaptionRef.current) {
        paceCaptionRef.current.style.opacity = String(
          smooth(range(p, 0.12, 0.22)) * feelHold,
        );
      }

      stepsRef.current.forEach((el, i) => {
        if (!el) return;
        const t =
          smooth(range(p, 0.38 + i * 0.045, 0.46 + i * 0.045)) *
          (1 - smooth(range(p, 0.58, 0.68)));
        el.style.opacity = String(t);
        el.style.transform = `translateY(${lerp(14, 0, t)}px)`;
      });

      const calm = smooth(range(p, 0.68, 0.78));
      if (calmRuleRef.current) {
        calmRuleRef.current.style.opacity = String(calm * assess);
        calmRuleRef.current.style.transform = `scaleX(${calm})`;
      }
      if (assessCtaRef.current) {
        const t = smooth(range(p, 0.72, 0.82));
        assessCtaRef.current.style.opacity = String(t * assess);
        assessCtaRef.current.style.transform = `translateY(${lerp(12, 0, t)}px)`;
      }

      setGlow(assessGlowFromProgress(p, false));
      ticksRef.current.forEach((tick, i) => {
        if (!tick) return;
        const on = i === 0 ? p < 0.36 : i === 1 ? p >= 0.36 && p < 0.66 : p >= 0.66;
        tick.classList.toggle("on", on);
      });
      if (hintRef.current) {
        hintRef.current.style.opacity =
          p < 0.08 ? "0.7" : String(Math.max(0, 0.7 - p * 2));
      }
      ticking = false;
    };

    const onScroll = () => {
      if (!ticking) {
        window.requestAnimationFrame(apply);
        ticking = true;
      }
    };

    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll, { passive: true });
    apply();
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
      setGlow(false);
    };
  }, []);

  return (
    <div
      className={reducedMotion ? "fua-block fua-is-reduced" : "fua-block"}
      id="feel-understand-assess"
    >
      <section
        className="fua-chapter"
        ref={chapterRef}
        aria-label="Feel, Understand, Assess"
      >
        <div className="fua-stage">
          <div className="fua-beat fua-beat-feel" ref={feelRef} data-beat="feel">
            <p className="fua-label">Feel</p>
            <div className="fua-feel-stack">
              <p className="fua-feel-line">{FEEL_LINE}</p>
              {[0, 1, 2].map((i) => (
                <p
                  key={i}
                  className={`fua-ghost g${i + 1}`}
                  aria-hidden="true"
                  ref={(el) => {
                    if (el) ghostsRef.current[i] = el;
                  }}
                >
                  {FEEL_LINE}
                </p>
              ))}
            </div>
            <div className="fua-pace-marks" ref={paceMarksRef} aria-hidden="true">
              <span></span>
              <span></span>
              <span></span>
              <span></span>
            </div>
            <p className="fua-pace-caption" ref={paceCaptionRef}>
              {FEEL_SEASONING}
            </p>
          </div>

          <div
            className="fua-beat fua-beat-understand"
            ref={understandRef}
            data-beat="understand"
          >
            <p className="fua-label">Understand</p>
            <h2 className="fua-display">{UNDERSTAND_HEAD}</h2>
            <p className="fua-lede">{UNDERSTAND_LEDE}</p>
            <div className="fua-steps">
              {UNDERSTAND_STEPS.map((step, i) => (
                <div
                  key={step}
                  className="fua-step"
                  ref={(el) => {
                    if (el) stepsRef.current[i] = el;
                  }}
                >
                  <span className="fua-num">0{i + 1}</span>
                  <p>{step}</p>
                </div>
              ))}
            </div>
          </div>

          <div
            className="fua-beat fua-beat-assess"
            ref={assessRef}
            data-beat="assess"
          >
            <p className="fua-label">Assess</p>
            <div className="fua-assess-panel">
              <h2 className="fua-display">{ASSESS_CLOSE_HEAD}</h2>
              <div className="fua-calm-rule" ref={calmRuleRef}></div>
              <p className="fua-lede">{ASSESS_CLOSE_LEDE}</p>
              <div className="fua-cta-row" ref={assessCtaRef}>
                <Link className="fua-btn" to={publicHref("/assessment")}>
                  Assess your operations{" "}
                  <span className="fua-arrow" aria-hidden="true">
                    ↗
                  </span>
                </Link>
                <p className="fua-fit-note">
                  Fit Review: a {FIT_REVIEW_LOCK}.
                </p>
              </div>
            </div>
          </div>

          <div className="fua-ticks" aria-hidden="true">
            {[0, 1, 2].map((i) => (
              <i
                key={i}
                ref={(el) => {
                  if (el) ticksRef.current[i] = el;
                }}
              />
            ))}
          </div>
          <p className="fua-scroll-hint" ref={hintRef}>
            Scroll
          </p>
        </div>
      </section>

      <section className="fua-below" aria-label="Inflection points">
        <p className="fua-kicker">If you're here</p>
        <h2 className="fua-section-title">
          A fork in the road, not a product diagram.
        </h2>
        <div className="fua-forks">
          {INFLECTION_FORKS.map((fork) => (
            <article className="fua-fork" key={fork.title}>
              <h3>{fork.title}</h3>
              <p>{fork.body}</p>
            </article>
          ))}
        </div>

        <div className="fua-support">
          <p className="fua-kicker">Later, if it earns its keep</p>
          <h2>{AUTOMATION_HEAD}</h2>
          <p>{AUTOMATION_BODY}</p>
          <p className="fua-quiet">{AUTOMATION_QUIET}</p>
        </div>
      </section>
    </div>
  );
}

export default FeelUnderstandAssess;
