import { ArrowRight, Award, Bell, Check, Compass, Lock, Waves } from 'lucide-react';
import { CAMPAIGN_COPY } from '../content/campaignCopy';
import { CAMPAIGN_MAPS } from '../game/campaign';
import type { GameState } from '../game/types';
import { medalName, voyageRecordKey, type Achievements } from './achievements';

type Props = {
  state: GameState;
  completed: number;
  resumable: boolean;
  onResume: () => void;
  /** Requests a fresh attempt; the parent confirms replacement of an active voyage. */
  onMap: (map: number) => void;
  /** Requests a free voyage; the parent owns replacement confirmation. */
  onFreeVoyage: () => void;
  achievements?: Achievements;
  onViewMedals?: () => void;
};

export function CampaignScreen({ state, completed, resumable, onResume, onMap, onFreeVoyage, achievements, onViewMedals }: Props) {
  const medalForMap = (map: number) => {
    const key = voyageRecordKey({ ...state, campaignMap: map });
    return achievements && Object.hasOwn(achievements, key) ? achievements[key] : undefined;
  };
  const replayMap = CAMPAIGN_MAPS.find(map => map.id <= completed && (medalForMap(map.id)?.rank ?? 3) < 3);
  const replayMedal = replayMap && medalForMap(replayMap.id);
  const nextMedalGrowth = replayMedal?.rank === 1 ? 3 : 6;
  return <div className="campaign-screen">
    <section className="campaign-intro">
      <div className="campaign-seal"><Waves size={32} strokeWidth={1} /></div>
      <p className="eyebrow">EIGHT MAPS. ONE UNREASONABLE SEA.</p>
      <h2>The Unreasonable<br /><em>Archipelago.</em></h2>
      <p className="campaign-premise">The Moon wants its sea back.<br />Convince it to stay a little longer.</p>
      <p className="campaign-instructions">Move a floating town. Feed its sleeping bells. When the eighth tide comes, every bell must be grown, connected to the Heart, sheltered, and calm enough to sing.</p>
      <div className="campaign-primer"><span><strong>Plan</strong>Spend actions to tow, build, or nourish.</span><span><strong>Advance</strong>Currents move. Gardens grow. Towns eat.</span><span><strong>Endure</strong>Bring every bell safely through tide 8.</span></div>
      {resumable ? <button className="primary-button wide" onClick={onResume}>{state.status === 'playing' ? `Continue ${state.campaignMap ? `map ${state.campaignMap}` : 'voyage'} · tide ${state.tide}` : 'View voyage outcome'}<ArrowRight size={18} /></button> : <button className="primary-button wide" onClick={() => onMap(1)}>Begin the campaign<ArrowRight size={18} /></button>}
      <button className="text-button" onClick={onFreeVoyage} aria-describedby="free-voyage-description"><Compass size={14} />Explore a free voyage</button>
      <p className="campaign-free-note" id="free-voyage-description">One bell · seven islands · three actions per tide.</p>
    </section>
    <section className="campaign-chart" aria-label="Eight-map campaign">
      <div className="campaign-chart-heading"><span className="eyebrow">YOUR CHART OF POSSIBLE SHORES</span><strong>{completed} / 8 won</strong></div>
      <p className="campaign-progression">Every two maps won: another bell, two more islands, and one extra action each tide.</p>
      {[0, 1, 2, 3].map(chapter => <div className="campaign-pair" key={chapter}>
        <p><Bell size={13} />{chapter + 1} {chapter ? 'bells' : 'bell'}<span>{7 + chapter * 2} islands · {3 + chapter} actions / tide</span></p>
        <div>{CAMPAIGN_MAPS.slice(chapter * 2, chapter * 2 + 2).map(map => {
          const won = map.id <= completed;
          const locked = map.id > completed + 1;
          const current = state.campaignMap === map.id;
          const continuing = !locked && current && resumable && state.status === 'playing';
          const action = continuing ? 'Continue' : won ? 'Replay' : 'Start';
          const medal = !locked && medalForMap(map.id);
          const descriptionId = `campaign-map-${map.id}-description`;
          return <button key={map.id} type="button" disabled={locked} className={`campaign-map ${won ? 'won' : ''} ${current ? 'current' : ''}`}
            onClick={() => { if (!locked) { if (continuing) onResume(); else onMap(map.id); } }}
            aria-label={`${action} map ${map.id}: ${map.title}${continuing ? `. Tide ${state.tide}` : ''}${locked ? '. Locked' : ''}`}
            aria-describedby={descriptionId} aria-current={continuing ? 'step' : undefined}>
            <span className="campaign-map-number" aria-hidden="true">{locked ? <Lock size={15} /> : continuing ? <ArrowRight size={18} /> : won ? <Check size={18} /> : String(map.id).padStart(2, '0')}</span>
            <span className="campaign-map-copy"><strong>{map.title}</strong>
              {!locked && <span className="campaign-map-action">{continuing ? `Continue · tide ${state.tide}` : won ? 'Replay this map' : 'Start this map'}</span>}
              <span id={descriptionId}>
                <small>{locked ? `Win map ${map.id - 1} to unlock` : CAMPAIGN_COPY[map.id]?.chartSubtitle ?? map.subtitle}</small>
                {medal && <small className="campaign-map-medal"><Award size={12} aria-hidden="true" /><span>Best: {medalName(medal.rank)} · {medal.growth} shore growth</span></small>}
              </span>
            </span>
          </button>;
        })}</div>
      </div>)}
      {completed > 0 && <div className="campaign-replay-note">
        {replayMap && replayMedal
          ? <p>Optional replay · {replayMap.title}: {medalName(replayMedal.rank + 1)} requires a win with {nextMedalGrowth} ordinary shore growth, {nextMedalGrowth - replayMedal.growth} above your best.</p>
          : <p>{completed === 8 ? 'The whole archipelago sings. Revisit a favourite shore, linger, or explore a smaller sea.' : 'Replay a favourite shore to grow more of its town. Higher medals are optional; win a new map to continue.'}</p>}
        {onViewMedals && <button className="text-button campaign-medal-help" onClick={onViewMedals}><Award size={13} aria-hidden="true" />How medals work</button>}
      </div>}
      <p className="campaign-save-note">Each map starts a fresh town. Victories and best medals stay saved. {resumable && state.status === 'playing' && 'Continue keeps this voyage; a fresh attempt replaces it.'}</p>
    </section>
  </div>;
}
