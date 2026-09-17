import { useEffect, useRef, useState, type CSSProperties } from "react";
import { Link } from "react-router-dom";
import "./ownership-path-scroll.css";

const ASSET = "/brand/scroll-ownership-path";

/** Reed polished microcopy 2026-09-17 (Stuck / Named / Moving + bridge). */
const BEATS = [
  {
    eyebrow: "Beat 01 · Stuck",
    headline: "Different people. Different versions of the truth.",
    body: "Office, crew, and owner each hold their own slice. Nobody knows who owns the next step, so work waits and everyone feels the drag.",
  },
  {
    eyebrow: "Beat 02 · Named",
    headline: "We name who owns the next step.",
    body: "The stuck point gets named out loud. One handoff gets a clear next owner. You can see it, not guess it.",
  },
  {
    eyebrow: "Beat 03 · Moving",
    headline: "One clear path of work.",
    body: "Roles sit on a single path and the handoffs stick. The fix is who owns what, not another pile of tools.",
  },
] as const;

const BRIDGE =
  "The Fit Review is a complimentary 30-minute business operations review. You bring what is actually breaking. We build the fix around how your work really runs.";

/** Equal-weight secondary rotate labels. Default viz stays Office / Crew / Owner. */
const VIGNETTE_LABELS = [
  "Hospitality invoices",
  "Construction inventory",
  "Field / service",
] as const;

type Pose = { x: number; y: number; r: number; o: number; s: number };

const TILE_POSES: Record<"office" | "crew" | "owner", Record<"stuck" | "named" | "moving", Pose>> = {
  office: {
    stuck: { x: -6, y: -10, r: -4, o: 1, s: 1 },
    named: { x: -2, y: -2, r: -1, o: 1, s: 1 },
    moving: { x: 0, y: 4, r: 0, o: 1, s: 0.96 },
  },
  crew: {
    stuck: { x: 8, y: 4, r: 3, o: 1, s: 1 },
    named: { x: 2, y: 2, r: 1, o: 1, s: 1 },
    moving: { x: 0, y: 4, r: 0, o: 1, s: 0.96 },
  },
  owner: {
    stuck: { x: -4, y: 14, r: -2, o: 1, s: 1 },
    named: { x: 0, y: 6, r: 0, o: 1, s: 1 },
    moving: { x: 0, y: 4, r: 0, o: 1, s: 0.96 },
  },
};

function lerp(a: number, b: number, t: number) {
  return a + (b - a) * t;
}
function lerpPose(a: Pose, b: Pose, t: number): Pose {
  return {
    x: lerp(a.x, b.x, t),
    y: lerp(a.y, b.y, t),
    r: lerp(a.r, b.r, t),
    o: lerp(a.o, b.o, t),
    s: lerp(a.s, b.s, t),
  };
}
function ease(t: number) {
  return t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
}
function clamp01(n: number) {
  return Math.min(1, Math.max(0, n));
}

function poseStyle(pose: Pose): CSSProperties {
  return {
    transform: `translate(${pose.x}%, ${pose.y}%) rotate(${pose.r}deg) scale(${pose.s})`,
    opacity: pose.o,
  };
}

export function OwnershipPathScroll() {
  const chapterRef = useRef<HTMLElement>(null);
  const [progress, setProgress] = useState(0);
  const [beatIndex, setBeatIndex] = useState(0);
  const [vignetteIndex, setVignetteIndex] = useState(0);

  useEffect(() => {
    const id = window.setInterval(() => {
      setVignetteIndex((i) => (i + 1) % VIGNETTE_LABELS.length);
    }, 6000);
    return () => window.clearInterval(id);
  }, []);

  useEffect(() => {
    const chapter = chapterRef.current;
    if (!chapter) return;

    let ticking = false;
    const update = () => {
      const rect = chapter.getBoundingClientRect();
      const total = chapter.offsetHeight - window.innerHeight;
      const scrolled = Math.min(Math.max(-rect.top, 0), total);
      const p = total <= 0 ? 0 : scrolled / total;
      setProgress(p);
      const nextBeat = p < 0.33 ? 0 : p < 0.66 ? 1 : 2;
      setBeatIndex(nextBeat);
      ticking = false;
    };

    const onScroll = () => {
      if (!ticking) {
        window.requestAnimationFrame(update);
        ticking = true;
      }
    };

    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    update();
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
    };
  }, []);

  // Pose map: Stuck (~0-0.33) → Named (~0.33-0.66) → Moving (~0.66-1)
  let tilePhase: "stuck-named" | "named-moving";
  let tileT: number;
  if (progress < 0.45) {
    tilePhase = "stuck-named";
    tileT = ease(clamp01(progress / 0.45));
  } else {
    tilePhase = "named-moving";
    tileT = ease(clamp01((progress - 0.45) / 0.55));
  }

  const tilePoses = {
    office:
      tilePhase === "stuck-named"
        ? lerpPose(TILE_POSES.office.stuck, TILE_POSES.office.named, tileT)
        : lerpPose(TILE_POSES.office.named, TILE_POSES.office.moving, tileT),
    crew:
      tilePhase === "stuck-named"
        ? lerpPose(TILE_POSES.crew.stuck, TILE_POSES.crew.named, tileT)
        : lerpPose(TILE_POSES.crew.named, TILE_POSES.crew.moving, tileT),
    owner:
      tilePhase === "stuck-named"
        ? lerpPose(TILE_POSES.owner.stuck, TILE_POSES.owner.named, tileT)
        : lerpPose(TILE_POSES.owner.named, TILE_POSES.owner.moving, tileT),
  };

  const connectorOpacity =
    progress < 0.2
      ? 0
      : progress < 0.45
        ? ease(clamp01((progress - 0.2) / 0.25))
        : progress < 0.75
          ? 1
          : 1 - ease(clamp01((progress - 0.75) / 0.25)) * 0.55;

  const nextOwnerOpacity =
    progress < 0.32 ? 0 : progress < 0.5 ? ease(clamp01((progress - 0.32) / 0.18)) : 1;

  const pathOpacity =
    progress < 0.55 ? 0 : ease(clamp01((progress - 0.55) / 0.35));
  const pathFill = clamp01((progress - 0.55) / 0.4);

  const beat = BEATS[beatIndex];

  return (
    <div className="ops-block" id="ownership-path">
    <section
      className="ops-chapter"
      ref={chapterRef}
      aria-label="Ownership path"
    >
      <div className="ops-stage">
        <div className="ops-copy">
          <p className="ops-eyebrow">{beat.eyebrow}</p>
          <h2 className="ops-headline">{beat.headline}</h2>
          <p className="ops-body">{beat.body}</p>
          <ul className="ops-beats" aria-hidden="true">
            {[0, 1, 2].map((i) => (
              <li
                key={i}
                className={i <= beatIndex ? "on" : undefined}
                data-beat={i}
              />
            ))}
          </ul>
        </div>

        <div className="ops-viz" aria-hidden="true">
          <div className="ops-viz-frame">
            <div className="ops-tile ops-tile-office" style={poseStyle(tilePoses.office)}>
              <img
                src={`${ASSET}/role-tile-office.svg`}
                alt=""
                width={120}
                height={88}
                draggable={false}
              />
            </div>
            <div className="ops-tile ops-tile-crew" style={poseStyle(tilePoses.crew)}>
              <img
                src={`${ASSET}/role-tile-crew.svg`}
                alt=""
                width={120}
                height={88}
                draggable={false}
              />
            </div>
            <div className="ops-tile ops-tile-owner" style={poseStyle(tilePoses.owner)}>
              <img
                src={`${ASSET}/role-tile-owner.svg`}
                alt=""
                width={120}
                height={88}
                draggable={false}
              />
            </div>

            <div
              className="ops-connector ops-connector-a"
              style={{ opacity: connectorOpacity }}
            >
              <img src={`${ASSET}/connector.svg`} alt="" width={160} height={40} draggable={false} />
            </div>
            <div
              className="ops-connector ops-connector-b"
              style={{ opacity: connectorOpacity * 0.95 }}
            >
              <img src={`${ASSET}/connector.svg`} alt="" width={160} height={40} draggable={false} />
            </div>

            <div
              className="ops-next-owner"
              style={{ opacity: nextOwnerOpacity }}
            >
              <img
                src={`${ASSET}/next-owner-mark.svg`}
                alt=""
                width={32}
                height={32}
                draggable={false}
              />
            </div>

            <div
              className="ops-path-steps"
              style={{
                opacity: pathOpacity,
                ["--ops-path-fill" as string]: `${pathFill * 100}%`,
              }}
            >
              <img
                src={`${ASSET}/path-steps.svg`}
                alt=""
                width={280}
                height={120}
                draggable={false}
              />
            </div>
          </div>

          <p className="ops-vignette-label">{VIGNETTE_LABELS[vignetteIndex]}</p>
          <div className="ops-progress-rail">
            <i style={{ height: `${(progress * 100).toFixed(2)}%` }} />
          </div>
        </div>
      </div>

    </section>
    <div className="ops-bridge">
      <p>{BRIDGE}</p>
      <Link className="ops-cta" to="/assessment">
        Assess your operations <span aria-hidden="true">↗</span>
      </Link>
    </div>
    </div>
  );
}

export default OwnershipPathScroll;
