import { useEffect, useState } from "react";
import { Pause, Play, RotateCcw, Timer as TimerIcon } from "lucide-react";
import type { Session } from "../domain/types";
export function Timer({
  session,
  onChange,
}: {
  session: Session;
  onChange: (s: Session) => void;
}) {
  const [now, setNow] = useState(Date.now());
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 500);
    return () => clearInterval(id);
  }, []);
  const t = session.timer;
  const remaining = Math.max(
    0,
    t.remainingSeconds -
      (t.runningSince === null ? 0 : Math.floor((now - t.runningSince) / 1000)),
  );
  const update = (timer: Session["timer"]) => onChange({ ...session, timer });
  if (!t.visible)
    return (
      <button
        className="button small secondary"
        onClick={() => update({ ...t, visible: true })}
      >
        <TimerIcon size={15} />
        Show timer
      </button>
    );
  return (
    <div className="timer" aria-label="Optional call timer">
      <TimerIcon size={16} />
      <span className={remaining === 0 ? "timer-ended" : ""} role="timer">
        {Math.floor(remaining / 60)
          .toString()
          .padStart(2, "0")}
        :{(remaining % 60).toString().padStart(2, "0")}
      </span>
      <button
        type="button"
        className="icon-button"
        aria-label={
          t.runningSince === null ? "Start call timer" : "Pause call timer"
        }
        disabled={remaining === 0 && t.runningSince === null}
        onClick={() => {
          setNow(Date.now());
          update({
            ...t,
            remainingSeconds: remaining,
            runningSince: t.runningSince === null ? Date.now() : null,
          });
        }}
      >
        {t.runningSince === null ? <Play size={14} /> : <Pause size={14} />}
      </button>
      <button
        className="icon-button"
        aria-label="Reset call timer"
        onClick={() => {
          if (confirm("Reset the call timer to 30 minutes?"))
            update({ ...t, remainingSeconds: 1800, runningSince: null });
        }}
      >
        <RotateCcw size={14} />
      </button>
      <button
        className="text-button"
        onClick={() => update({ ...t, visible: false })}
      >
        Hide
      </button>
      {remaining === 0 && <small>Time complete</small>}
    </div>
  );
}
