import { getWeather, DIRECTIONS } from '../game';
import type { GameState } from '../game/types';

const bearings = ['east', 'northeast', 'northwest', 'west', 'southwest', 'southeast'];

export function TideChart({ state }: { state: GameState }) {
  const crosswind = getWeather({ ...state, tide: 7 });
  const finalWind = getWeather({ ...state, tide: 8 });
  const moonwake = state.voyageRules === 'moonwake';
  const upstream = (finalWind.direction + DIRECTIONS.length / 2) % DIRECTIONS.length;
  return <>
    <p className="eyebrow">THE MOON HAS A SCHEDULE</p>
    <h2>A little foresight.<br /><em>A different shore.</em></h2>
    <p className="modal-lead">Currents move islands first. Then shelter, stress, production, rations, and growth resolve. The on-water forecast shows this tide’s exact outcome.</p>
    {moonwake ? <ol className="tide-chart">
      <li className={state.tide === 4 ? 'current' : ''}><span>04</span><div><strong>A still-water intermission</strong><p>Grow, build, or arrange the fleet before the outward surge. Timber buys anchors; food buys a return journey.</p></div></li>
      <li className={state.tide === 5 ? 'current' : ''}><span>05</span><div><strong>The Moon Exhales · outward</strong><p>Every unanchored island drifts one hex away from the Heart. Anchor key islands, block a current, or ride it and reconnect later. Exposed islands gain 1 stress.</p></div></li>
      <li className={state.tide === 6 ? 'current' : ''}><span>06</span><div><strong>A calm tide to recover</strong><p>Inward streams return. Nourish or reposition while the sea is gentle; plan for the next crosscurrent.</p></div></li>
      <li className={state.tide === 7 ? 'current' : ''}><span>07</span><div><strong>The Sideways Sea · {bearings[crosswind.direction]}</strong><p>The whole unanchored fleet follows one current. The Heart stays rooted. Exposed islands gain 1 stress. One anchor may hold a chain; the whale can help you move.</p></div></li>
      <li className={state.tide === 8 ? 'current' : ''}><span>08</span><div><strong>A sheltered bell, a way home</strong><p>No drift. Finish with growth 3, a Heart connection, shelter, and less than 3 stress. Place an island one hex {bearings[upstream]} of the bell, or use a breakwater’s longer wake. Anchors do not stop storm stress.</p></div></li>
    </ol> : <p className="opening-summary">This saved voyage keeps the original currents and final rule: a mature bell connected to the Heart. Restarting begins a voyage with the revised late currents and sheltered finale.</p>}
  </>;
}
