import { Check, X, ArrowRight, Bell } from 'lucide-react';
import type { GameState, Command } from '../game/types';
import type { getFinaleAdvice } from '../game/finaleAdvice';
import './finale.css';

export function FinaleCheck({ state, advice, warning, onPlan }: {
  state: GameState; advice: ReturnType<typeof getFinaleAdvice>; warning: boolean; onPlan: (command: Command) => void;
}) {
  const moonwake = state.voyageRules === 'moonwake';
  return <>
    <p className="eyebrow">{warning ? 'A MOMENT BEFORE THE LAST WAVE' : `AFTER TIDE ${state.tide} · BELL CHECK`}</p>
    <h2>{warning ? <>Advancing now<br /><em>will lose this voyage.</em></> : <>Will your bells<br /><em>be ready to ring?</em></>}</h2>
    <p className="modal-lead">{moonwake ? 'At the end of tide 8, every bell needs all four checks. A full Heart and a grown bell still need a sheltered harbour.' : 'At the end of tide 8, every bell needs full growth and a chain of touching islands to the Heart.'}</p>
    <div className="finale-checks">{advice.map(info => <section key={info.bellId}>
      <h3><Bell size={16} />{info.name}</h3>
      <ul>{[
        { ok: info.grown, label: 'Grown to 3/3' },
        { ok: info.connected, label: 'Linked to the Heart' },
        ...(moonwake ? [{ ok: info.sheltered, label: 'Sheltered from this wind' }, { ok: info.rested, label: `Stress ${info.stress} → ${info.forecastStress} · must stay below 3` }] : []),
      ].map(check => <li className={check.ok ? 'ready' : 'not-ready'} key={check.label}>{check.ok ? <Check size={14} /> : <X size={14} />}<span>{check.label}</span></li>)}</ul>
      <p>{info.hint}</p>
      {state.status === 'playing' && info.rescue && <button className="secondary-button" onClick={() => onPlan(info.rescue!)}>Show this move<ArrowRight size={14} /></button>}
    </section>)}</div>
    {moonwake && <p className="finale-rule">Shelter blocks the wind and removes 1 stress each tide. Exposure adds storm stress. Anchors stop movement; they provide no shelter.</p>}
    {state.actions === 0 && state.status === 'playing' && <p className="finale-rule">No actions left: Undo a planning action to make room for a rescue.</p>}
  </>;
}
