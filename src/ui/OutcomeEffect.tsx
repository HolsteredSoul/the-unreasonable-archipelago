import { useEffect, useRef, type CSSProperties } from 'react';
import { Bell, BellOff } from 'lucide-react';
import './outcome.css';

export interface OutcomeEffectProps {
  status: 'won' | 'lost';
  reducedMotion: boolean;
  onComplete: () => void;
}

export const OUTCOME_DURATION_MS = 2900;

const sparks = Array.from({ length: 22 }, (_, index) => ({
  '--spark-angle': `${index * (360 / 22) + 7}deg`,
  '--spark-distance': `${175 + (index % 4) * 38}px`,
  '--spark-delay': `${420 + (index % 6) * 75}ms`,
} as CSSProperties));

/** Decorative interlude; the result dialog owns focus and announces the outcome. */
export function OutcomeEffect({ status, reducedMotion, onComplete }: OutcomeEffectProps) {
  const complete = useRef(onComplete);
  useEffect(() => { complete.current = onComplete; }, [onComplete]);
  useEffect(() => {
    const motionPreference = window.matchMedia('(prefers-reduced-motion: reduce)');
    const duration = reducedMotion || motionPreference.matches ? 150 : OUTCOME_DURATION_MS;
    const timer = window.setTimeout(() => complete.current(), duration);
    return () => window.clearTimeout(timer);
  }, [status, reducedMotion]);

  const won = status === 'won';
  const Emblem = won ? Bell : BellOff;
  return <div className={`outcome-effect outcome-${status}${reducedMotion ? ' outcome-still' : ''}`} aria-hidden="true">
    <div className="outcome-scrim" />
    <div className="outcome-frame" />
    {won ? <>
      <div className="outcome-ripples"><i /><i /><i /></div>
      <div className="outcome-sparks">{sparks.map((style, index) => <i key={index} style={style} />)}</div>
    </> : <div className="outcome-dark-tides"><i /><i /><i /></div>}
    <div className="outcome-copy">
      <span className="outcome-kicker">{won ? 'A HOME AGAINST THE SEA' : 'THE VOYAGE HAS ENDED'}</span>
      <div className="outcome-emblem"><Emblem size={48} strokeWidth={1.1} /><span /></div>
      <strong className="outcome-title">{won ? 'Victory' : 'Defeat'}</strong>
      <span className="outcome-rule"><i /><b>✦</b><i /></span>
      <p>{won ? 'The bells answer. The islands are home.' : 'The sea falls quiet. Your bells could not answer.'}</p>
      <small>{won ? 'Every little kindness carried this far.' : 'The journey ends here. The next begins with what you learned.'}</small>
    </div>
  </div>;
}
