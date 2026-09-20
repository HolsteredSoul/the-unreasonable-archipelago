import { useEffect, useRef, useState } from 'react';
import { ArrowRight, Waves, Wind, Sprout } from 'lucide-react';
import type { Forecast, GameState, TideStage } from '../game/types';
import './weather-events.css';

export function TideSequence({ state, forecast, reducedMotion, onStage, onComplete }: {
  state: GameState; forecast: Forecast; reducedMotion: boolean;
  onStage: (stage: TideStage) => void; onComplete: () => void;
}) {
  const [phase, setPhase] = useState(0);
  const callbacks = useRef({ onStage, onComplete }); callbacks.current = { onStage, onComplete };
  useEffect(() => {
    callbacks.current.onStage('drift');
    const drift = reducedMotion ? 450 : 850, weather = forecast.weather.storm ? 2000 : 1200, harvest = 1300;
    const timers = [
      setTimeout(() => { setPhase(1); callbacks.current.onStage('weather'); }, drift),
      setTimeout(() => { setPhase(2); callbacks.current.onStage('harvest'); }, drift + weather),
      setTimeout(() => callbacks.current.onComplete(), drift + weather + harvest),
    ];
    return () => timers.forEach(clearTimeout);
  }, [forecast, reducedMotion]);
  const moved = forecast.moves.filter(move => !move.blocked).length;
  const blocked = forecast.moves.filter(move => move.blocked).length;
  const sheltered = forecast.shelteredIds.length;
  const grown = forecast.state.islands.filter(island => island.growth > state.islands.find(before => before.id === island.id)!.growth).length;
  const titles = ['The current moves the fleet', forecast.weather.storm ? 'The storm meets the islands' : 'A quiet tide lets the islands recover', 'The town gathers its harvest'];
  const detail = [
    moved ? `${moved} islands drifting${blocked ? ` · ${blocked} blocked` : ''}. Shelter is checked after they move.` : 'The fleet holds position. Shelter is checked where each island rests.',
    forecast.weather.storm ? `${state.islands.length - sheltered} exposed · +${forecast.weather.strength} stress. ${sheltered} sheltered · the storm is blocked.` : 'Every island loses up to 1 stress. Watch the stress numbers settle.',
    `Gardens +${forecast.production.food} food · groves +${forecast.production.timber} timber · town rations −2 food${grown ? ` · ${grown} growth` : ''}.`,
  ];
  const Icon = [Waves, Wind, Sprout][phase];
  return <section className={`tide-sequence stage-${phase}`} aria-label="Tide unfolding">
    <div className="tide-sequence-copy" role="status" aria-live="polite"><span className="eyebrow">TIDE {state.tide} · {phase + 1} OF 3</span><strong><Icon size={17}/>{titles[phase]}</strong><p>{detail[phase]}</p></div>
    <div className="tide-sequence-steps" aria-hidden="true">{['Drift', 'Weather', 'Harvest'].map((label,index)=><span key={label} className={index===phase?'current':index<phase?'done':''}>{label}</span>)}</div>
    <button onClick={() => callbacks.current.onComplete()} aria-label="Skip tide animation">Skip<ArrowRight size={13}/></button>
  </section>;
}
