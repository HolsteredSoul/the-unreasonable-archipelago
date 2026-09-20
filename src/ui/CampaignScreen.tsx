import { ArrowRight, Bell, Check, Compass, Lock, Waves } from 'lucide-react';
import { CAMPAIGN_MAPS } from '../game/campaign';
import type { GameState } from '../game/types';

type Props = { state: GameState; completed: number; resumable: boolean; onResume: () => void; onMap: (map: number) => void; onFreeVoyage: () => void };

export function CampaignScreen({ state, completed, resumable, onResume, onMap, onFreeVoyage }: Props) {
  return <div className="campaign-screen">
    <section className="campaign-intro">
      <div className="campaign-seal"><Waves size={32} strokeWidth={1} /></div>
      <p className="eyebrow">EIGHT MAPS. ONE UNREASONABLE SEA.</p>
      <h2>The Unreasonable<br /><em>Archipelago.</em></h2>
      <p className="campaign-premise">The Moon wants its sea back.<br />Convince it to stay a little longer.</p>
      <p className="campaign-instructions">Move a floating town. Feed its sleeping bells. When the eighth tide comes, every bell must be grown, connected to the Heart, sheltered, and calm enough to sing.</p>
      <div className="campaign-primer"><span><strong>Plan</strong>Spend actions to tow, build, or nourish.</span><span><strong>Advance</strong>Currents move. Gardens grow. Towns eat.</span><span><strong>Endure</strong>Bring every bell safely through tide 8.</span></div>
      {resumable ? <button className="primary-button wide" onClick={onResume}>{state.status === 'playing' ? `Continue ${state.campaignMap ? `map ${state.campaignMap}` : 'voyage'} · tide ${state.tide}` : 'View voyage outcome'}<ArrowRight size={18} /></button> : <button className="primary-button wide" onClick={() => onMap(1)}>Begin the campaign<ArrowRight size={18} /></button>}
      <button className="text-button" onClick={onFreeVoyage}><Compass size={14} />Explore a free voyage</button>
    </section>
    <section className="campaign-chart" aria-label="Eight-map campaign">
      <div className="campaign-chart-heading"><span className="eyebrow">YOUR CHART OF POSSIBLE SHORES</span><strong>{completed} / 8 won</strong></div>
      <p className="campaign-progression">Every two wins: another bell, two more islands, and one extra action each tide.</p>
      {[0, 1, 2, 3].map(chapter => <div className="campaign-pair" key={chapter}>
        <p><Bell size={13} />{chapter + 1} {chapter ? 'bells' : 'bell'}<span>{7 + chapter * 2} islands · {3 + chapter} actions / tide</span></p>
        <div>{CAMPAIGN_MAPS.slice(chapter * 2, chapter * 2 + 2).map(map => {
          const won = map.id <= completed; const locked = map.id > completed + 1;
          return <button key={map.id} disabled={locked} className={`campaign-map ${won ? 'won' : ''} ${state.campaignMap === map.id ? 'current' : ''}`} onClick={() => onMap(map.id)} aria-label={`${won ? 'Replay' : 'Start'} map ${map.id}: ${map.title}${locked ? '. Locked' : ''}`}>
            <span className="campaign-map-number">{locked ? <Lock size={15} /> : won ? <Check size={18} /> : String(map.id).padStart(2, '0')}</span><span><strong>{map.title}</strong><small>{locked ? `Win map ${map.id - 1} to unlock` : map.subtitle}</small></span>
          </button>;
        })}</div>
      </div>)}
      <p className="campaign-save-note">{completed === 8 ? 'The whole archipelago sings. Replay any map for a more splendid town.' : 'Each map is a fresh town. Your victories unlock the next shore.'} {resumable && 'Choosing a map replaces the active voyage; victories stay saved.'}</p>
    </section>
  </div>;
}
