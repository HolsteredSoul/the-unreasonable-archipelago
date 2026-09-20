import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { Anchor, ArrowRight, Bell, Check, ChevronDown, CircleHelp, Compass, Copy, Eye, EyeOff, Flag, Heart, Leaf, Menu, Move, Plus, RotateCcw, Settings2, Shield, Sparkles, Sprout, Trees, Undo2, Volume2, VolumeX, Waves, Wind, X } from 'lucide-react';
import { applyCommand, createGame, forecastTide, getIslandStats, getLegalTowTargets, getWeather, getWhaleEncounter, getVictoryConditions, getActionBudget, resolveTide } from './game';
import type { Building, Command, Hex, Island } from './game/types';
import World from './world/World';
import { initialSession, persistSession, updateSeedUrl, type Settings } from './ui/storage';
import { playChime } from './ui/audio';
import { updateMusic, unlockMusic, duckMusic, stopMusic, type MusicMood } from './ui/music';
import { describeOpening } from './game/generation';
import { TideChart } from './ui/TideChart';
import { Maximize2, Minimize2, Award } from 'lucide-react';
import { ACTION_COPY, balanceChange, type ActionName } from './ui/feedback';
import { growthTotal, loadAchievements, medalName, recordVictory, saveAchievements, voyageRecordKey } from './ui/achievements';
import { CAMPAIGN_MAPS, createCampaignGame } from './game/campaign';
import { CampaignScreen } from './ui/CampaignScreen';
import { OutcomeEffect } from './ui/OutcomeEffect';
import { recordCampaignWin, lossExplanation } from './ui/campaignProgress';
import { getFinaleAdvice } from './game/finaleAdvice';
import { finalTideCheckpoint, replanFinalTide } from './ui/finaleRecovery';
import { FinaleCheck } from './ui/FinaleCheck';
import './styles.css';
import './ui/roadmap.css';
import './ui/campaign.css';

const BUILDINGS: { id: Building; name: string; icon: typeof Leaf; description: string }[] = [
  { id: 'garden', name: 'Tide garden', icon: Leaf, description: 'A little room to breathe. Earns more food beside open water.' },
  { id: 'grove', name: 'Driftwood grove', icon: Trees, description: 'Trees enjoy company. Earns more timber beside other islands.' },
  { id: 'breakwater', name: 'Breakwater', icon: Shield, description: 'Shelters itself and two hexes downstream. Growth extends its reach.' },
];
const directionName = ({ q, r }: Hex) => q === 1 && r === 0 ? 'East' : q === 1 && r === -1 ? 'Northeast' : q === 0 && r === -1 ? 'Northwest' : q === -1 && r === 0 ? 'West' : q === -1 && r === 1 ? 'Southwest' : q === 0 && r === 1 ? 'Southeast' : 'Still';
const signed = (number: number) => `${number >= 0 ? '+' : ''}${number}`;
const islandLabel = (island: Island) => island.kind === 'heart' ? 'The heart of the fleet' : island.kind === 'bell' ? 'A bell waiting to bloom' : BUILDINGS.find(item => item.id === island.building)?.name || 'A little possibility';

function Modal({ children, onClose, label, className = '' }: { children: ReactNode; onClose?: () => void; label: string; className?: string }) {
  const panel = useRef<HTMLDivElement>(null);
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;
  useEffect(() => {
    const prior = document.activeElement as HTMLElement | null;
    const focusable = () => [...(panel.current?.querySelectorAll<HTMLElement>('button:not(:disabled), input, select, [tabindex="0"]') || [])];
    focusable()[0]?.focus();
    const handle = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && onCloseRef.current) { event.preventDefault(); onCloseRef.current(); }
      if (event.key !== 'Tab') return;
      const elements = focusable(); const first = elements[0]; const last = elements.at(-1);
      if (!first) { event.preventDefault(); return; }
      if (event.shiftKey && (document.activeElement === first || !panel.current?.contains(document.activeElement))) { event.preventDefault(); last?.focus(); }
      else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
    };
    document.addEventListener('keydown', handle);
    return () => { document.removeEventListener('keydown', handle); prior?.focus(); };
  }, []);
  return <div className="modal-backdrop"><div className={`modal ${className}`} role="dialog" aria-modal="true" aria-label={label} ref={panel}>
    {onClose && <button className="icon-button modal-close" onClick={onClose} aria-label="Close dialog"><X size={18} /></button>}{children}
  </div></div>;
}

export default function App() {
  const [session, setSession] = useState(initialSession);
  const game = session.state;
  const [selectedId, setSelectedId] = useState<string | null>(() => game.islands.find(island => island.kind === 'bell')?.id || null);
  const [mode, setMode] = useState<'tow' | 'build' | null>(null);
  const [preview, setPreview] = useState(false);
  const [modal, setModal] = useState<'start' | 'intro' | 'help' | 'settings' | 'restart' | 'medals' | 'tides' | 'whale' | 'finale' | 'finalWarning' | null>('start');
  const [resultOpen, setResultOpen] = useState(game.status !== 'playing');
  const [outcome, setOutcome] = useState<'won' | 'lost' | null>(null);
  const campaignCompleted = session.campaignCompleted ?? 0;
  const campaignMap = game.campaignMap ? CAMPAIGN_MAPS[game.campaignMap - 1] : null;
  const actionBudget = getActionBudget(game);
  const [showIslands, setShowIslands] = useState(false);
  const [seedDraft, setSeedDraft] = useState(game.seed);
  const [copied, setCopied] = useState(false);
  const [openingSummary, setOpeningSummary] = useState(() => describeOpening(game));
  const [toast, setToast] = useState('');
  const [saveFailed, setSaveFailed] = useState(false);
  const [advancing, setAdvancing] = useState(false);
  const [achievements, setAchievements] = useState(loadAchievements);
  const [focusPanel, setFocusPanel] = useState<'objective' | 'islands' | 'weather' | 'selected' | null>(null);
  const [feedback, setFeedback] = useState<{ key: number; x: number; y: number; title: string; detail: string; balance: string } | null>(null);
  const inputOrigin = useRef<{ x: number; y: number } | null>(null);
  const taught = useRef(new Set<string>());
  const seaFocus = session.settings.seaFocus ?? false;
  const medalKey = voyageRecordKey(game);
  const currentMedal = Object.hasOwn(achievements, medalKey) ? achievements[medalKey] : undefined;
  const bestMedal = Object.values(achievements).sort((a, b) => b.rank - a.rank || b.growth - a.growth)[0];
  const advanceTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const forecast = useMemo(() => forecastTide(game), [game]);
  const selected = game.islands.find(island => island.id === selectedId) || null;
  const stats = selected ? getIslandStats(game, selected.id) : null;
  const nextSelected = selected ? forecast.state.islands.find(island => island.id === selected.id) : null;
  const weather = getWeather(game);
  const bells = game.islands.filter(island => island.kind === 'bell');
  const bellGrowth = bells.reduce((total, island) => total + island.growth, 0);
  const connectedBells = bells.filter(island => getIslandStats(game, island.id).connected).length;
  const allConnected = connectedBells === bells.length;
  const moonwake = game.voyageRules === 'moonwake';
  const finalConditions = getVictoryConditions(forecast.state);
  const finaleAdvice = useMemo(() => getFinaleAdvice(game), [game]);
  const suggestedRescue = finaleAdvice.find(info => info.rescue?.id === selectedId)?.rescue;
  const finalNeeds = [!finalConditions.grown && 'growth 3', !finalConditions.connected && 'a Heart link', !finalConditions.sheltered && 'shelter', !finalConditions.rested && 'less stress', forecast.state.integrity === 0 && 'a surviving Heart'].filter(Boolean).join(' · ');
  const active = game.status === 'playing' && !advancing && !outcome;
  const encounter = getWhaleEncounter(game);
  const offer = encounter?.offers.find(item => item.id === selectedId);
  const nextWhaleTide = [2, 5, 7].find(tide => tide > game.tide);
  const whaleReturn = nextWhaleTide ? `Next visit: tide ${nextWhaleTide}.` : 'No more visits this voyage.';
  const whaleReason = game.status !== 'playing' ? 'This voyage is complete.'
    : !encounter ? whaleReturn
    : encounter.used ? `Tow used. ${whaleReturn}`
    : game.actions < 1 ? 'No actions left. Undo an action to make room for a tow.'
    : selected?.kind === 'heart' ? 'The Heart cannot move. Choose another island.'
    : !offer ? selected ? `No empty water ${directionName(encounter.direction).toLowerCase()} of this island. Choose another.` : 'Choose an island for the whale to tow.'
    : `${selected?.name} → ${directionName(encounter.direction)} (${offer.to.q}, ${offer.to.r}).`;
  const whalePurpose = game.status !== 'playing' ? 'Voyage complete' : encounter?.used ? 'Used this visit' : !encounter ? nextWhaleTide ? `Returns tide ${nextWhaleTide}` : 'No more visits' : game.actions < 1 ? 'No actions left' : offer ? `${directionName(encounter.direction)} · 1 hex` : 'Choose an island';
  const musicEnabled = session.settings.musicEnabled ?? true;
  const musicVolume = session.settings.musicVolume ?? 0.35;
  const effectsVolume = session.settings.effectsVolume ?? 0.8;
  const audioSettings = useRef(session.settings);
  audioSettings.current = session.settings;
  const musicMood: MusicMood = game.tide === 8 || game.status === 'won' ? 'finale' : weather.storm ? 'storm' : !allConnected ? 'disconnected' : 'calm';
  const towTargets = useMemo(() => mode === 'tow' && selected && active ? getLegalTowTargets(game, selected.id) : [], [game, selected, mode, active]);
  const canCommand = (command: Command) => active && !applyCommand(game, command).error;
  const canTow = !!selected && active && selected.kind !== 'heart' && game.actions > 0 && game.food >= 1 && getLegalTowTargets(game, selected.id).length > 0;
  const canBuild = !!selected && BUILDINGS.some(building => canCommand({ type: 'build', id: selected.id, building: building.id }));
  const canAnchor = !!selected && canCommand({ type: 'anchor', id: selected.id });
  const canNourish = !!selected && canCommand({ type: 'nourish', id: selected.id });
  const canWhaleTow = !!selected && canCommand({ type: 'whaleTow', id: selected.id });

  useEffect(() => { setSaveFailed(!persistSession(session)); }, [session]);
  useEffect(() => { updateMusic({ enabled: session.settings.sound && musicEnabled, volume: musicVolume, mood: musicMood }); }, [session.settings.sound, musicEnabled, musicVolume, musicMood]);
  useEffect(() => () => stopMusic(), []);
  useEffect(() => {
    if (modal !== 'settings' && modal !== 'restart') return;
    setOpeningSummary('Charting the opening…');
    const descriptor = game.campaignMap && seedDraft.trim() === game.seed ? CAMPAIGN_MAPS[game.campaignMap - 1] : null;
    const timeout = setTimeout(() => setOpeningSummary(descriptor ? `Campaign map ${descriptor.id}: ${descriptor.title}. ${descriptor.bells} bells, ${descriptor.islands} islands, ${getActionBudget(game)} actions each tide. Restarting keeps your campaign victories.` : describeOpening(createGame(seedDraft.trim() || game.seed))), 180);
    return () => clearTimeout(timeout);
  }, [seedDraft, modal, game.seed, game.campaignMap]);
  useEffect(() => { setAchievements(previous => recordVictory(previous, game)); }, [game]);
  useEffect(() => { saveAchievements(achievements); }, [achievements]);
  useEffect(() => {
    if (!feedback) return;
    const timeout = setTimeout(() => setFeedback(null), game.tide <= 3 ? 6000 : 3500);
    return () => clearTimeout(timeout);
  }, [feedback]);
  useEffect(() => {
    if (!toast) return;
    const timeout = setTimeout(() => setToast(''), 4500);
    return () => clearTimeout(timeout);
  }, [toast]);
  useEffect(() => () => { if (advanceTimer.current) clearTimeout(advanceTimer.current); }, []);
  useEffect(() => {
    const preference = window.matchMedia('(prefers-reduced-motion: reduce)');
    const change = () => setSession(previous => ({ ...previous, settings: { ...previous.settings, reducedMotion: preference.matches } }));
    preference.addEventListener('change', change);
    return () => preference.removeEventListener('change', change);
  }, []);

  function announce(message: string) { setToast(message); }
  function chime(kind: Parameters<typeof playChime>[0]) {
    const sound = audioSettings.current.sound;
    const volume = audioSettings.current.effectsVolume ?? 0.8;
    if (sound && volume > 0) duckMusic(kind === 'win' || kind === 'loss' || kind === 'error' ? 3.5 : 0.6, kind === 'win' || kind === 'loss' || kind === 'error' ? 0.2 : 0.65);
    playChime(kind, sound, volume);
  }
  function toggleSound() {
    const enabled = !session.settings.sound;
    setting('sound', enabled);
    updateMusic({ enabled: enabled && musicEnabled, volume: musicVolume, mood: musicMood });
    unlockMusic();
    playChime('select', enabled, effectsVolume);
  }
  function toggleMusic() {
    setting('musicEnabled', !musicEnabled);
    updateMusic({ enabled: session.settings.sound && !musicEnabled, volume: musicVolume, mood: musicMood });
    unlockMusic();
  }
  function proposeNewVoyage() { setSeedDraft('tide-' + crypto.randomUUID().slice(0, 8)); setModal('restart'); }
  function showSpend(action: ActionName, before: typeof game, after: typeof game) {
    const target = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    const rect = target?.getBoundingClientRect();
    const origin = inputOrigin.current || (rect && rect.width > 0 && target?.tagName === 'BUTTON' ? { x: rect.left + rect.width / 2, y: rect.top } : { x: innerWidth / 2, y: innerHeight - 190 });
    const lessonKey = `${game.seed}:${action}`;
    const explain = game.tide <= 3 && !taught.current.has(lessonKey);
    taught.current.add(lessonKey);
    const queued = action !== 'advance' ? forecastTide(after) : null;
    setFeedback({ key: performance.now(), x: Math.max(12, Math.min(innerWidth - 310, origin.x - 145)), y: Math.max(12, Math.min(innerHeight - 160, origin.y - 148)), title: ACTION_COPY[action].title, detail: explain ? ACTION_COPY[action].detail : action === 'advance' ? `Gardens +${forecast.production.food} food, then town rations −2.` : ACTION_COPY[action].detail, balance: `${balanceChange(before, after)}${queued ? ` · After tide: ${queued.state.food} food` : ''}` });
  }
  function toggleSeaFocus() {
    setting('seaFocus', !seaFocus); setFocusPanel(null); setShowIslands(false);
    requestAnimationFrame(() => document.querySelector<HTMLButtonElement>('[aria-label="Toggle sea focus"]')?.focus());
  }
  function selectIsland(id: string) { setSelectedId(id); setMode(null); chime('select'); }
  function execute(command: Command) {
    if (!active || modal || resultOpen) return;
    const result = applyCommand(game, command);
    if (result.error) { announce(result.error); chime('error'); return; }
    showSpend(command.type, game, result.state);
    setSession(previous => ({ ...previous, state: result.state, undo: [...previous.undo, game] }));
    setMode(null); chime('action');
  }
  function undo() {
    if (!active || !session.undo.length || modal || resultOpen) return;
    const previous = session.undo.at(-1)!;
    setFeedback(null);
    setSession(current => ({ ...current, state: previous, undo: current.undo.slice(0, -1) }));
    setMode(null); chime('select');
  }
  function advance() {
    if (!active || modal || resultOpen) return;
    if (game.tide === game.maxTides && forecast.state.status === 'lost') { setModal('finalWarning'); return; }
    commitTide();
  }
  function commitTide() {
    if (!active || resultOpen) return;
    setModal(null);
    showSpend('advance', game, forecast.state);
    setMode(null); setAdvancing(true); chime('tide');
    advanceTimer.current = setTimeout(() => {
      const result = resolveTide(game);
      setSession(previous => ({ ...previous, state: result.state, undo: [], finaleCheckpoint: finalTideCheckpoint(previous, result.state), campaignCompleted: recordCampaignWin(previous.campaignCompleted ?? 0, result.state) }));
      setAdvancing(false);
      if (result.state.status !== 'playing') { setFeedback(null); setToast(''); setOutcome(result.state.status); chime(result.state.status === 'won' ? 'win' : 'loss'); }
      else announce(result.events[0] || 'The sea has rearranged a few things.');
      advanceTimer.current = null;
    }, session.settings.reducedMotion ? 80 : 500);
  }
  function newVoyage(seed?: string) {
    const chosen = seed?.trim().slice(0, 100) || ('tide-' + crypto.randomUUID().slice(0, 8));
    startVoyage(game.campaignMap && chosen === game.seed ? createCampaignGame(game.campaignMap) : createGame(chosen));
  }
  function startCampaignMap(map: number) {
    if (map > campaignCompleted + 1) return;
    startVoyage(createCampaignGame(map));
  }
  function startVoyage(state: typeof game) {
    if (advanceTimer.current) clearTimeout(advanceTimer.current);
    setOutcome(null);
    setSession(previous => ({ ...previous, state, undo: [], seenIntro: true, finaleCheckpoint: undefined }));
    setSelectedId(state.islands.find(island => island.kind === 'bell')?.id || null);
    setSeedDraft(state.seed); setModal(null); setResultOpen(false); setMode(null); setPreview(false); setAdvancing(false); setToast('');
    setFeedback(null); setFocusPanel(null); taught.current.clear();
    updateSeedUrl(state.campaignMap ? '' : state.seed); chime('tide');
  }
  function retryFinalTide() {
    const restored = replanFinalTide(session);
    if (!restored) return;
    setSession(restored); setResultOpen(false); setOutcome(null); setModal('finale'); setFeedback(null); setToast(''); setMode(null); setPreview(true);
    setSelectedId(restored.state.islands.find(island => island.kind === 'bell')?.id || null);
  }
  function planRescue(command: Command) {
    setSelectedId(command.id); setModal(null); setMode(command.type === 'tow' ? 'tow' : command.type === 'build' ? 'build' : null); setPreview(false); setShowIslands(false);
    if (seaFocus) setFocusPanel('selected');
  }
  function finishIntro() { setSession(previous => ({ ...previous, seenIntro: true })); setModal(null); }
  function setting<K extends keyof Settings>(key: K, value: Settings[K]) { setSession(previous => ({ ...previous, settings: { ...previous.settings, [key]: value } })); }
  async function copySeed() {
    try { await navigator.clipboard.writeText(game.seed); setCopied(true); setTimeout(() => setCopied(false), 2200); }
    catch { setSeedDraft(game.seed); setModal('settings'); announce('Your voyage seed is ready to select and copy.'); }
  }

  useEffect(() => {
    const handle = (event: KeyboardEvent) => {
      if (event.target instanceof HTMLElement && (event.target.isContentEditable || ['INPUT', 'SELECT', 'TEXTAREA'].includes(event.target.tagName))) return;
      if (modal || resultOpen || advancing || outcome) return;
      if (event.key === 'Escape') { setMode(null); setShowIslands(false); setFeedback(null); if (focusPanel) { const chip = document.querySelector<HTMLButtonElement>(`[data-panel="${focusPanel}"]`); setFocusPanel(null); requestAnimationFrame(() => chip?.focus()); } else if (seaFocus) toggleSeaFocus(); return; }
      if (event.key.toLowerCase() === 'f' && !event.ctrlKey && !event.metaKey) { event.preventDefault(); toggleSeaFocus(); }
      if (event.key.toLowerCase() === 'p' && !event.ctrlKey && !event.metaKey) { event.preventDefault(); setPreview(value => !value); }
      if (event.key.toLowerCase() === 'z' && (event.ctrlKey || event.metaKey)) { event.preventDefault(); undo(); }
      if (/^[1-9]$/.test(event.key)) { const island = game.islands[Number(event.key) - 1]; if (island) selectIsland(island.id); }
      if (event.key === 'Enter' && !(event.target instanceof HTMLElement && ['BUTTON', 'A', 'SUMMARY'].includes(event.target.tagName))) { event.preventDefault(); advance(); }
    };
    window.addEventListener('keydown', handle);
    return () => window.removeEventListener('keydown', handle);
  });

  const shortage = forecast.state.food === 0 && forecast.foodDelta < 0;
  const atRisk = forecast.state.integrity < game.integrity;
  const flourishing = growthTotal(game);
  const flourishTitle = medalName(flourishing >= 6 ? 3 : flourishing >= 3 ? 2 : 1);
  const helpContent = <>
    <div className="modal-emblem"><Compass size={30} strokeWidth={1.2} /></div>
    <p className="eyebrow">A small guide to unreasonable seas</p>
    <h2>Keep your islands.<br /><em>Find your footing.</em></h2>
    <p className="modal-lead">The sea is alive, the islands are drifting, and a very small bell has something important to say.</p>
    <div className="guide-steps">
      <div><span>01</span><div><h3>Spend now, eat at the tide</h3><p>You have {actionBudget} actions each tide. Nourish spends 2 food now to queue growth. The town eats another 2 food when you advance the tide, after gardens produce.</p></div></div>
      <div><span>02</span><div><h3>Give each island a job</h3><p>Build gardens for food, groves for timber, or breakwaters for storm shelter. Tow costs 1 food; an anchor costs 1 timber and stops one tide's drift. Preview the water before committing.</p></div></div>
      <div><span>03</span><div><h3>Bring every bell home</h3><p>{moonwake ? 'Nourish every bell to growth 3. Ride or resist the outward surge on tide 5 and crosscurrent on tide 7. Every bell must finish tide 8 connected to the Heart, sheltered, and below 3 stress.' : 'Nourish the bell to reach all three growth stages. On the eighth tide, it must be mature and connected to the Heart through touching islands.'}</p></div></div>
    </div>
    <div className="guide-note"><Wind size={17} /><span>Anchors last one tide. The whale visits on tides 2, 5, and 7: one action buys a food-free tow in its direction, with currents still to come. The town eats 2 food each tide. At 3 stress, production pauses; shelter lets islands recover. Nourishment waits for a safe, fed tide.</span></div>
    {modal === 'help' && <p className="keyboard-help">Keyboard: <kbd>1–9</kbd> select an island · <kbd>P</kbd> preview · <kbd>F</kbd> sea focus · <kbd>Ctrl Z</kbd> undo · <kbd>Enter</kbd> advance · <kbd>Esc</kbd> cancel or restore panels</p>}
    <button className="primary-button wide" onClick={modal === 'intro' ? finishIntro : () => setModal(null)}>{modal === 'intro' ? 'Let’s make a little landfall' : 'Back to the archipelago'}<ArrowRight size={18} /></button>
  </>;

  return <main onPointerDownCapture={event => { unlockMusic(); inputOrigin.current = { x: event.clientX, y: event.clientY }; }} onKeyDownCapture={() => { unlockMusic(); inputOrigin.current = null; }} className={`game-app voyage-${game.status} ${modal === 'start' ? 'is-splash' : ''} ${session.settings.reducedMotion ? 'reduced-motion' : ''} ${advancing ? 'is-advancing' : ''} ${seaFocus ? 'sea-focus' : ''} ${focusPanel ? `reveal-${focusPanel}` : ''} ${mode === 'tow' ? 'is-towing' : ''}`}>
    <div className="world-stage" inert={!!modal || !!outcome || resultOpen} aria-label="Interactive three-dimensional archipelago">
      <World state={game} forecast={forecast} selectedId={selectedId} onSelectIsland={id => { if (!advancing && !modal && !resultOpen && !outcome) selectIsland(id); }} towTargets={towTargets} onSelectHex={hex => { if (selected && mode === 'tow') execute({ type: 'tow', id: selected.id, to: hex }); }} preview={preview} reducedMotion={session.settings.reducedMotion} quality={session.settings.quality} />
    </div>
    <div className="screen-grain" aria-hidden="true" />
    <div className="hud" inert={!!modal || !!outcome || resultOpen}>
      <header className="topbar">
        <div className="brand"><div className="brand-mark"><Waves size={23} strokeWidth={1.35} /></div><div><p className="eyebrow">An exercise in staying afloat</p><h1>The Unreasonable<br /><em>Archipelago</em><span className="edition">{campaignMap ? `MAP ${campaignMap.id} / 8 · ${campaignMap.title}` : 'FREE VOYAGE'}</span></h1></div></div>
        <div className="tide-tracker"><div className="tide-label"><span>TIDE</span><strong>{String(game.tide).padStart(2, '0')}</strong><span>/ {String(game.maxTides).padStart(2, '0')}</span></div><div className="tide-dots" aria-label={`Tide ${game.tide} of ${game.maxTides}`}>{Array.from({ length: game.maxTides }, (_, index) => <span key={index} className={`${index + 1 < game.tide ? 'complete' : ''} ${index + 1 === game.tide ? 'current' : ''}`} />)}</div><p>{game.tide === game.maxTides ? 'The great tide is here' : `${game.maxTides - game.tide} tides until the great tide`}</p></div>
        <div className="top-right"><div className="resources" aria-label="Resources"><div className="resource"><Leaf size={20} /><span><strong>{game.food}</strong><small>FOOD</small></span></div><span className="resource-divider" /><div className="resource"><Trees size={20} /><span><strong>{game.timber}</strong><small>TIMBER</small></span></div><span className="resource-divider" /><div className={`resource heart-resource ${game.integrity < 3 ? 'danger' : ''}`}><Heart size={20} /><span><strong>{game.integrity}<small className="inline-small"> / 5</small></strong><small>HEART</small></span></div></div>
          <nav className="utility-nav" aria-label="Game controls"><button className="icon-button" onClick={() => setModal('start')} aria-label="Open campaign chart" title="Campaign chart"><Compass size={18} /></button><button className="icon-button" onClick={() => setModal('help')} aria-label="How to play" title="How to play"><CircleHelp size={18} /></button><button className={`icon-button ${session.settings.sound ? 'is-on' : ''}`} onClick={toggleSound} aria-label={session.settings.sound ? 'Mute sound' : 'Enable sound'} title={session.settings.sound ? 'Mute sound' : 'Enable sound'}>{session.settings.sound ? <Volume2 size={18} /> : <VolumeX size={18} />}</button><button className="icon-button" onClick={() => { setSeedDraft(game.seed); setModal('settings'); }} aria-label="Settings and voyage seed" title="Settings"><Settings2 size={18} /></button></nav>
        </div>
      </header>

      <div className="sea-toolbar" aria-label="View controls">
        <button onClick={() => setModal('tides')} aria-label="Open tide chart"><Compass size={15} /><span>Tide chart</span></button>
        <button onClick={toggleSeaFocus} aria-label="Toggle sea focus" aria-pressed={seaFocus}>{seaFocus ? <Minimize2 size={15} /> : <Maximize2 size={15} />}<span>{seaFocus ? 'Full view' : 'Sea focus'}</span><kbd>F</kbd></button>
        <button onClick={() => setPreview(value => !value)} aria-label="Toggle tide preview" aria-pressed={preview}><Eye size={15} /><span>{preview ? 'Present' : 'Forecast'}</span><kbd>P</kbd></button>
      </div>
      {seaFocus && <nav className="sea-chips" aria-label="Collapsed sea panels">
        <button data-panel="objective" onClick={() => setFocusPanel(value => value === 'objective' ? null : 'objective')} aria-expanded={focusPanel === 'objective'}><Bell size={15} />{bells.length} {bells.length === 1 ? 'bell' : 'bells'} · {bellGrowth}/{bells.length * 3} grown · {connectedBells} home{moonwake && ' · shelter by 8'}</button>
        <button data-panel="islands" onClick={() => { setFocusPanel(value => value === 'islands' ? null : 'islands'); setShowIslands(true); }} aria-expanded={focusPanel === 'islands'}><Menu size={15} />{game.islands.length} islands</button>
        <button data-panel="selected" onClick={() => setFocusPanel(value => value === 'selected' ? null : 'selected')} aria-expanded={focusPanel === 'selected'}><Sprout size={15} />{selected?.name || 'Choose an island'}</button>
        <button data-panel="weather" className="weather-chip" onClick={() => setFocusPanel(value => value === 'weather' ? null : 'weather')} aria-expanded={focusPanel === 'weather'}><Wind size={15} />{weather.name}</button>
      </nav>}

      <div className="objective-stack">
      <aside className={`objective-panel panel ${bells.length > 1 ? 'campaign-objective' : ''}`}>
        <div className="panel-heading"><span className="eyebrow">{campaignMap ? `MAP ${campaignMap.id} · THE GRAND PLAN` : 'THE LITTLE GRAND PLAN'}</span><Bell size={16} /></div>
        <h2>{bells.length === 1 ? <>A bell against<br />the impossible.</> : <>A choir of {bells.length}.</>}</h2><p>Grow {bells.length === 1 ? 'the bell' : 'every bell'}. Bring {bells.length === 1 ? 'it' : 'them'} home.<br />{moonwake ? 'Shelter every voice on tide 8.' : 'Weather the final tide together.'}</p>
        <div className="campaign-objectives">{bells.map(island => { const info = finaleAdvice.find(item => item.bellId === island.id)!; const safe = (!moonwake || info.sheltered && info.rested) && info.connected; return <button className={`campaign-bell ${selectedId === island.id ? 'selected' : ''} ${safe ? '' : 'needs-shelter'}`} key={island.id} onClick={() => selectIsland(island.id)} aria-label={`Select ${island.name}. Growth ${island.growth} of 3.${island.nourished ? ' Growth queued.' : ''} ${moonwake ? `After tide: ${info.sheltered ? 'sheltered' : 'exposed'}, stress ${info.forecastStress}.` : ''}`}><Bell size={17} /><span>{island.name}<small>{info.connected ? 'Home' : 'Adrift'}{moonwake && ` · ${info.sheltered ? 'sheltered' : 'EXPOSED'} · stress ${info.forecastStress}`}</small></span><strong>{island.growth}/3{island.nourished && <small className="queued-growth">+ queued</small>}</strong></button>; })}</div>
        <div className="flourishing-progress"><span><Sprout size={12} />Flourishing shores</span><strong>{flourishing}<small> / 6</small></strong><div><i style={{ width: `${Math.min(100, flourishing / 6 * 100)}%` }} /></div></div>
        <div className="objective-bottom"><button className="finale-inspector" onClick={() => setModal('finale')}>After-tide bell checks<ArrowRight size={12} /></button></div>
      </aside>
      <div className="island-browser"><button className={`island-browser-toggle ${showIslands ? 'open' : ''}`} onClick={() => setShowIslands(value => !value)} aria-expanded={showIslands}><Menu size={15} /><span>Your {game.islands.length} little islands</span><ChevronDown size={14} /></button>{showIslands && <div className="island-list panel" aria-label="Select an island">{game.islands.map((island, index) => <button key={island.id} onClick={() => selectIsland(island.id)} className={selectedId === island.id ? 'selected' : ''}><span className="island-number">{index + 1}</span>{island.kind === 'bell' ? <Bell size={15} /> : island.kind === 'heart' ? <Heart size={15} /> : <Sprout size={15} />}<span>{island.name}</span>{selectedId === island.id && <Check size={14} />}</button>)}</div>}</div>
      </div>

      <div className="weather-stack"><aside className={`weather-panel panel ${weather.storm ? 'storm-weather' : ''}`}><div className="panel-heading"><span className="eyebrow">THE SEA’S CURRENT MOOD</span><Wind size={17} /></div><h2>{weather.name}</h2><p>{weather.description}</p><div className="weather-meta"><span><Waves size={14} />{weather.storm ? 'Heavy seas' : 'A passing tide'}</span><span>{forecast.moves.filter(move => !move.blocked && (move.from.q !== move.to.q || move.from.r !== move.to.r)).length} islands drifting</span></div><button className={`preview-button ${preview ? 'active' : ''}`} onClick={() => setPreview(value => !value)} aria-pressed={preview}>{preview ? <EyeOff size={16} /> : <Eye size={16} />}<span>{preview ? 'Return to the present' : 'Peek at the next tide'}</span><kbd>P</kbd></button></aside>


      {game.status === 'playing' && <aside className="whale-encounter panel" aria-label="Whale encounter">
        <div className="whale-card-heading"><strong>{encounter && !encounter.used ? `Whale Tow · ${directionName(encounter.direction)}` : 'Whale Tow · visits 2, 5, 7'}</strong><button aria-label="How Whale Tow works" onClick={() => setModal('whale')} title="How Whale Tow works"><CircleHelp size={17} /></button></div>
        <p id="whale-reason" aria-live="polite">{whaleReason}</p>
        {encounter && !encounter.used && encounter.offers.length > 0 && game.actions > 0 && <><label className="sr-only" htmlFor="whale-island">Choose island for Whale Tow</label><select id="whale-island" value={offer ? selectedId! : ''} disabled={!active} onChange={event => selectIsland(event.target.value)}><option value="" disabled>Choose an eligible island…</option>{encounter.offers.map(item => <option key={item.id} value={item.id}>{game.islands.find(island => island.id === item.id)?.name}</option>)}</select></>}
      </aside>}</div>
      {preview && <div className="preview-banner"><Eye size={15} /><span>Tomorrow, for a moment.</span><span className="preview-banner-detail">Ghosts show the next tide. Nothing has moved yet.</span></div>}
      {mode === 'tow' && <div className="mode-banner"><Move size={16} /><span>{suggestedRescue?.type === 'tow' && selected ? `Suggested: ${directionName({ q: suggestedRescue.to.q - selected.q, r: suggestedRescue.to.r - selected.r })} (${suggestedRescue.to.q}, ${suggestedRescue.to.r}) · 1 food` : 'Choose a lit patch of water'}</span><button onClick={() => setMode(null)} aria-label="Cancel towing"><X size={15} /></button></div>}
      {toast && <div className="toast" role="status"><Sparkles size={15} /><span>{toast}</span><button onClick={() => setToast('')} aria-label="Dismiss notification"><X size={14} /></button></div>}
      {feedback && !modal && !resultOpen && !outcome && <div key={feedback.key} className="resource-callout" role="status" style={{ left: feedback.x, top: feedback.y }}><button aria-label="Dismiss resource feedback" onClick={() => setFeedback(null)}><X size={13} /></button><strong>{feedback.title}</strong><span>{feedback.detail}</span><small>{feedback.balance}</small></div>}

      <div className="bottom-hud">
        <section className="selected-panel panel" aria-label="Selected island">
          {selected && stats ? <><div className="selected-title"><div><p className="eyebrow">{islandLabel(selected)}</p><h2>{selected.name}</h2></div><div className={`selected-kind ${selected.kind}`}>{selected.kind === 'bell' ? <Bell size={23} strokeWidth={1.4} /> : selected.kind === 'heart' ? <Heart size={23} strokeWidth={1.4} /> : <Sprout size={23} strokeWidth={1.4} />}</div></div>
            <div className="selected-traits"><span className={stats.sheltered ? 'good' : ''}><Shield size={12} />{stats.sheltered ? 'Sheltered' : 'Exposed'}</span><span><Wind size={12} />{selected.kind === 'heart' ? 'Steadfast' : selected.anchored ? 'Anchored' : directionName(stats.current)}</span><span className={selected.stress >= 3 ? 'danger' : ''} title="Production pauses at 3 stress"><Waves size={12} />Stress {selected.stress}/5</span></div>
            <div className="selected-stats"><span><Leaf size={13} /><strong>{stats.food}</strong><small>food / tide</small></span><span><Trees size={13} /><strong>{stats.timber}</strong><small>timber / tide</small></span><span className="mini-growth" title={`Growth ${selected.growth} of 3`}><Sprout size={13} />{[1, 2, 3].map(value => <i key={value} className={selected.growth >= value ? 'filled' : ''} />)}</span></div>
            {selected.nourished && <div className="nourished-note"><Sparkles size={12} />Nourished · waiting for a gentle tide</div>}
            {preview && nextSelected && <div className="next-position">Next tide: ({nextSelected.q}, {nextSelected.r}) · growth {nextSelected.growth}/3</div>}
            {mode === 'tow' && <div className="tow-directions" aria-label="Keyboard accessible tow destinations">{towTargets.map(target => <button className={suggestedRescue?.type === 'tow' && suggestedRescue.to.q === target.q && suggestedRescue.to.r === target.r ? 'suggested-rescue' : undefined} key={`${target.q},${target.r}`} onClick={() => execute({ type: 'tow', id: selected.id, to: target })}>{directionName({ q: target.q - selected.q, r: target.r - selected.r })}<span>{target.q}, {target.r}</span></button>)}</div>}
          </> : <p className="empty-selection">Choose an island.<br /><em>They all have their reasons.</em></p>}
        </section>

        <section className="action-area" aria-label="Island actions">
          {mode === 'build' && selected && <div className="build-menu panel"><div className="panel-heading"><span className="eyebrow">A LITTLE ROOM FOR SOMETHING</span><button className="icon-button" onClick={() => setMode(null)} aria-label="Close building choices"><X size={15} /></button></div>{BUILDINGS.map(building => <button className={suggestedRescue?.type === 'build' && suggestedRescue.building === building.id ? 'suggested-rescue' : undefined} key={building.id} disabled={!canCommand({ type: 'build', id: selected.id, building: building.id })} onClick={() => execute({ type: 'build', id: selected.id, building: building.id })}><span className="build-icon"><building.icon size={22} strokeWidth={1.4} /></span><span><strong>{building.name}{suggestedRescue?.type === 'build' && suggestedRescue.building === building.id ? ' · suggested' : ''}</strong><small>{building.description}</small></span><span className="build-cost">3<Trees size={13} /></span></button>)}</div>}
          <div className="action-heading"><span className="eyebrow">ACTIONS THIS TIDE</span><div className="action-pips" aria-label={`${game.actions} of ${actionBudget} actions remaining`}>{Array.from({ length: actionBudget }, (_, index) => index + 1).map(value => <i key={value} className={game.actions >= value ? 'available' : ''} />)}<span>{game.actions} / {actionBudget}</span></div><button className="undo-button" onClick={undo} disabled={!active || session.undo.length === 0} title="Undo last action (Ctrl Z)" aria-label="Undo last action"><Undo2 size={15} /></button></div>
          <div className="action-dock with-whale">
            <button className={`action-button ${mode === 'tow' ? 'active' : ''}`} aria-label="Tow island" aria-describedby="tow-cost tow-purpose" disabled={!canTow} onClick={() => setMode(value => value === 'tow' ? null : 'tow')} title={selected?.kind === 'heart' ? 'The heart stays in place' : ACTION_COPY.tow.detail}><Move size={22} strokeWidth={1.3} /><strong>Tow</strong><span id="tow-cost">−1 food now</span><small id="tow-purpose">Move one hex</small></button>
            <button className={`action-button whale-action ${canWhaleTow ? 'whale-available' : ''}`} aria-label="Whale Tow" aria-describedby={`whale-cost whale-purpose whale-drift${game.status === 'playing' ? ' whale-reason' : ''}`} disabled={!canWhaleTow} onClick={() => selected && execute({ type: 'whaleTow', id: selected.id })} title={whaleReason}><Waves size={22} strokeWidth={1.3} /><strong>Whale Tow</strong><span id="whale-cost">1 action · 0 food</span><small id="whale-purpose">{whalePurpose}</small></button>
            <button className={`action-button ${mode === 'build' ? 'active' : ''}`} aria-label="Build structure" aria-describedby="build-cost build-purpose" disabled={!canBuild} onClick={() => setMode(value => value === 'build' ? null : 'build')} title={ACTION_COPY.build.detail}><Plus size={22} strokeWidth={1.3} /><strong>Build</strong><span id="build-cost">−3 timber now</span><small id="build-purpose">Produce or shelter</small></button>
            <button aria-label="Anchor island" aria-describedby="anchor-cost anchor-purpose" className="action-button" disabled={!canAnchor} onClick={() => selected && execute({ type: 'anchor', id: selected.id })} title={ACTION_COPY.anchor.detail}><Anchor size={22} strokeWidth={1.3} /><strong>Anchor</strong><span id="anchor-cost">−1 timber now</span><small id="anchor-purpose">Stop one tide's drift</small></button>
            <button className={`action-button ${selected?.nourished ? 'is-nourished' : ''}`} aria-label="Nourish island" aria-describedby="nourish-cost nourish-purpose" disabled={!canNourish} onClick={() => selected && execute({ type: 'nourish', id: selected.id })} title={selected?.growth === 3 ? 'This island is fully grown' : selected?.nourished ? 'Already nourished; waiting for growth conditions' : ACTION_COPY.nourish.detail}><Sprout size={22} strokeWidth={1.3} /><strong>{selected?.nourished ? 'Nourished' : 'Nourish'}</strong><span id="nourish-cost">{selected?.nourished ? 'Growth queued' : '−2 food now'}</span><small id="nourish-purpose">Grow after a safe tide</small></button>
          </div><p id="whale-drift" className="action-footnote">{encounter && !encounter.used ? 'One whale tow this visit. Moves now; the tide can move it again.' : game.actions === 0 ? 'A good day’s work. Let the tide come in.' : 'Every small decision makes a different shore.'}</p>
        </section>

        <section className="advance-area" aria-label="Advance tide"><div className="forecast-resources"><span className="eyebrow">AFTER THE TIDE</span><span className={forecast.foodDelta < 0 ? 'negative' : ''}><Leaf size={13} />{forecast.state.food}<small>({signed(forecast.foodDelta)})</small></span><span className={forecast.timberDelta < 0 ? 'negative' : ''}><Trees size={13} />{forecast.state.timber}<small>({signed(forecast.timberDelta)})</small></span></div>
          {(atRisk || shortage) && <p className="forecast-warning"><Heart size={12} />{atRisk ? 'The heart will take damage' : 'Food reserves will run out'}</p>}
          {game.status === 'playing' && <div className="tide-economy" aria-label="Food after the tide"><span>{game.food} stored + {forecast.production.food} grown <strong>−2 rations</strong></span><span>= {forecast.state.food} food after tide</span></div>}
          {moonwake && game.status === 'playing' && game.tide >= 4 && <button onClick={() => setModal('finale')} className={`bell-outlook ${game.tide === 8 ? finalConditions.ready ? 'ready' : 'needs-care' : !bells.every(island => forecast.connectedIds.includes(island.id)) ? 'needs-care' : ''}`}>{game.tide === 8 ? finalConditions.ready ? 'Final tide: every bell will ring' : `DEFEAT forecast · check ${finalNeeds}` : `After tide: ${bells.filter(island => forecast.connectedIds.includes(island.id)).length}/${bells.length} bells linked to the Heart`}</button>}
          {game.status === 'playing' ? <button className="advance-button" aria-describedby="rations-cost" onClick={advance} disabled={!active}><span><small>{advancing ? 'A MOMENT, PLEASE' : game.tide === game.maxTides ? 'HERE COMES THE GREAT TIDE' : 'WHEN YOU’RE READY'}</small><strong>{advancing ? 'The sea is thinking…' : 'Advance tide'}</strong></span><ArrowRight size={25} strokeWidth={1.3} /></button> : <button className="advance-button" disabled={!!outcome} onClick={() => setResultOpen(true)}><span><small>THE VOYAGE IS COMPLETE</small><strong>{game.status === 'won' ? 'Victory · view result' : 'Defeat · view result'}</strong></span><Flag size={22} /></button>}
          <p id="rations-cost" className="advance-footnote">{game.status === 'playing' ? <>−2 food when the tide ends · town rations <kbd>↵</kbd></> : 'Every ending is another possible shore.'}</p>
        </section>
      </div>
      <footer className="footer"><span><span className="live-dot" />{saveFailed ? 'Local saving unavailable · this voyage stays in this tab' : 'Voyage saved on this browser'}</span><div className="seed-and-medal"><button onClick={campaignMap ? () => setModal('start') : copySeed} title={campaignMap ? 'Open campaign chart' : 'Copy voyage seed'}><span>{campaignMap ? 'MAP' : 'SEED'}</span>{campaignMap ? `${campaignMap.id} / 8 · ${campaignMap.title}` : game.seed}{campaignMap ? <Compass size={11} /> : copied ? <Check size={11} /> : <Copy size={11} />}</button><button className="medal-chip" onClick={() => setModal('medals')} aria-label="View voyage medals"><Award size={13} />{currentMedal ? medalName(currentMedal.rank) : 'First medal awaits'}</button></div><span className="footer-poem">The sea is mostly water. Mostly.</span></footer>
    </div>

    {outcome && <OutcomeEffect status={outcome} reducedMotion={session.settings.reducedMotion} onComplete={() => { setOutcome(null); setResultOpen(true); }} />}
    {modal === 'start' && <Modal label="The Unreasonable Archipelago campaign" className="start-modal"><CampaignScreen state={game} completed={campaignCompleted} resumable={session.seenIntro} onResume={() => { setModal(null); if (game.status !== 'playing') setResultOpen(true); }} onMap={startCampaignMap} onFreeVoyage={() => { setSeedDraft('tide-' + crypto.randomUUID().slice(0, 8)); setModal('restart'); }} /></Modal>}
    {(modal === 'intro' || modal === 'help') && <Modal label={modal === 'intro' ? 'Welcome to the Unreasonable Archipelago' : 'How to play'} onClose={modal === 'intro' ? undefined : () => setModal(null)} className="guide-modal">{helpContent}</Modal>}
    {(modal === 'finale' || modal === 'finalWarning') && <Modal label={modal === 'finalWarning' ? 'Final tide warning' : 'Bell safety check'} onClose={() => setModal(null)} className="finale-check-modal">
      <FinaleCheck state={game} advice={finaleAdvice} warning={modal === 'finalWarning'} onPlan={planRescue} />
      <button className="primary-button wide" onClick={() => { setModal(null); setPreview(true); }}>Keep planning<ArrowRight size={16} /></button>
      {modal === 'finalWarning' && <button className="text-button final-accept" onClick={commitTide}>Advance anyway · accept defeat</button>}
    </Modal>}
    {modal === 'tides' && <Modal label="Tide chart" onClose={() => setModal(null)} className="tide-chart-modal"><TideChart state={game} /><button className="primary-button wide" onClick={() => setModal(null)}>Back to the water<ArrowRight size={16} /></button></Modal>}
    {modal === 'whale' && <Modal label="How Whale Tow works" onClose={() => setModal(null)} className="guide-modal">
      <div className="modal-emblem"><Waves size={30} strokeWidth={1.2} /></div><p className="eyebrow">ONE FAVOUR PER VISIT</p><h2>Whale Tow.<br /><em>A lift towards home.</em></h2>
      <p className="modal-lead"><strong>Costs 1 of your {actionBudget} actions. Costs 0 food.</strong> The tow moves your selected island immediately, one hex in the whale’s direction.</p>
      <div className="guide-steps">
        <div><span>01</span><div><h3>Use it on tides 2, 5, or 7</h3><p>Each visit offers one tow before you advance the tide. It is optional. Unused tows do not carry over.</p></div></div>
        <div><span>02</span><div><h3>Choose an eligible island, then press Whale Tow</h3><p>The whale card lists islands with empty water ahead. The Heart cannot move. The island does not need to be beside the whale. The blue arrow shows its destination.</p></div></div>
        <div><span>03</span><div><h3>Use its direction to help your plan</h3><p>Bring an island closer to home, move a windbreak, or save food. Ordinary Tow also costs one action, plus 1 food, but lets you choose any empty neighboring hex.</p></div></div>
      </div>
      <div className="guide-note"><Wind size={17} /><span>The tow happens now. When you advance, the current may move the island again. Check the forecast afterward; Anchor stops that drift, and Undo restores the whale’s tow.</span></div>
      <button className="primary-button wide" onClick={() => setModal(null)}>Back to the sea<ArrowRight size={16} /></button>
    </Modal>}
    {modal === 'medals' && <Modal label="Voyage medals" onClose={() => setModal(null)}><p className="eyebrow">A REASON TO SAIL AGAIN</p><h2>Your small<br /><em>great achievements.</em></h2><p className="modal-lead">Win the voyage to earn a medal. Nourish ordinary islands for a more flourishing home. Your best result for each campaign map or free-voyage seed stays with you.</p><div className="medal-levels">{[1, 2, 3].map(rank => <div key={rank}><Award size={23} /><strong>{medalName(rank)}</strong><span>{rank === 1 ? 'Win with 0–2 shore growth' : rank === 2 ? 'Win with 3–5 shore growth' : 'Win with 6 or more shore growth'}</span></div>)}</div><p className="medal-record">{campaignMap ? 'This map' : 'This seed'}: {currentMedal ? `${medalName(currentMedal.rank)} · ${currentMedal.growth} growth` : 'Not yet won'}<br />Best overall: {bestMedal ? `${medalName(bestMedal.rank)} · ${bestMedal.growth} growth` : 'A blank page, a wide sea'}</p><button className="primary-button wide" onClick={() => setModal(null)}>Back to the islands<ArrowRight size={17} /></button></Modal>}
    {modal === 'settings' && <Modal label="Settings" onClose={() => setModal(null)}><p className="eyebrow">MAKE YOURSELF AT SEA</p><h2>A few small<br /><em>adjustments.</em></h2><div className="setting-row"><div><strong>Sound</strong><p>Master mute for piano and action chimes.</p></div><button className={`switch ${session.settings.sound ? 'on' : ''}`} role="switch" aria-checked={session.settings.sound} aria-label="Sound" onClick={toggleSound}><span /></button></div><div className="setting-row"><div><strong>A Little Landfall</strong><p>Original piano follows the sea and the bell.</p></div><button className={`switch ${musicEnabled ? 'on' : ''}`} role="switch" aria-checked={musicEnabled} aria-label="Piano music" onClick={toggleMusic}><span /></button></div><label className="volume-control">Music volume<output>{Math.round(musicVolume * 100)}%</output><input aria-label="Music volume" type="range" min="0" max="1" step="0.05" value={musicVolume} onChange={event => setting('musicVolume', Number(event.target.value))} /></label><label className="volume-control">Effects volume<output>{Math.round(effectsVolume * 100)}%</output><input aria-label="Effects volume" type="range" min="0" max="1" step="0.05" value={effectsVolume} onChange={event => setting('effectsVolume', Number(event.target.value))} /></label><div className="setting-row"><div><strong>Gentler motion</strong><p>Still water and shorter transitions.</p></div><button className={`switch ${session.settings.reducedMotion ? 'on' : ''}`} role="switch" aria-checked={session.settings.reducedMotion} aria-label="Reduced motion" onClick={() => setting('reducedMotion', !session.settings.reducedMotion)}><span /></button></div><div className="setting-row"><div><strong>Lighter rendering</strong><p>A little easier on older computers.</p></div><button className={`switch ${session.settings.quality === 'low' ? 'on' : ''}`} role="switch" aria-checked={session.settings.quality === 'low'} aria-label="Low graphics quality" onClick={() => setting('quality', session.settings.quality === 'low' ? 'high' : 'low')}><span /></button></div><div className="seed-setting"><label className="eyebrow" htmlFor="voyage-seed">{campaignMap ? 'CAMPAIGN OR FREE VOYAGE' : 'EVERY VOYAGE HAS A SEED'}</label><div><input id="voyage-seed" value={seedDraft} maxLength={100} onChange={event => setSeedDraft(event.target.value)} spellCheck={false} autoComplete="off" />{!campaignMap && <button className="icon-button" onClick={copySeed} aria-label="Copy current seed">{copied ? <Check size={16} /> : <Copy size={16} />}</button>}</div><p>{campaignMap ? `You are on campaign map ${campaignMap.id}. Keep this value to retry the map, or enter a different seed for a free voyage. Campaign victories stay saved.` : 'Use the same seed to return to the same starting world.'}</p><p className="opening-summary" role="status">{openingSummary}</p></div><div className="settings-buttons"><button className="secondary-button" onClick={() => { setSeedDraft(game.seed); setModal('restart'); }}><RotateCcw size={15} />Restart this voyage</button><button className="primary-button" disabled={!seedDraft.trim()} onClick={() => setModal('restart')}>Sail with this seed<ArrowRight size={16} /></button></div><button className="text-button" onClick={proposeNewVoyage}>Find an entirely new archipelago</button><button className="text-button" onClick={() => setModal('medals')}><Award size={14} /> View medals · {currentMedal ? medalName(currentMedal.rank) : 'First medal awaits'}</button></Modal>}
    {modal === 'restart' && <Modal label="Start a new voyage" onClose={() => setModal('settings')}><div className="modal-emblem"><Compass size={30} strokeWidth={1.2} /></div><p className="eyebrow">ANOTHER POSSIBLE SHORE</p><h2>Set sail<br /><em>once more?</em></h2><p className="modal-lead">This replaces the current voyage and its saved progress. {seedDraft.trim() === game.seed ? 'You’ll return to the beginning of this same archipelago.' : seedDraft.trim() ? 'Your chosen seed will become a new voyage.' : 'A fresh, unexpected archipelago awaits.'}</p><p className="opening-summary">{openingSummary}</p><div className="dialog-buttons"><button className="secondary-button" onClick={() => setModal('settings')}>Stay a little longer</button><button className="primary-button" onClick={() => newVoyage(seedDraft)}>Set sail<ArrowRight size={17} /></button></div></Modal>}
    {resultOpen && !modal && !outcome && <Modal label={game.status === 'won' ? 'Voyage complete: victory' : 'Voyage complete: defeat'} onClose={() => setResultOpen(false)} className={`result-modal result-${game.status}`}>
      <div className={`modal-emblem ${game.status === 'won' ? 'victory' : ''}`}>{game.status === 'won' ? <Bell size={34} strokeWidth={1.2} /> : <Waves size={34} strokeWidth={1.2} />}</div>
      <p className="eyebrow result-verdict">{game.status === 'won' ? 'VICTORY' : 'DEFEAT'}{campaignMap ? ` · MAP ${campaignMap.id} / 8` : ''}</p>
      <h2>{game.status === 'won' ? game.campaignMap === 8 ? <>The whole sea<br /><em>is listening.</em></> : <>The Moon grants<br /><em>another morning.</em></> : <>The bells<br /><em>fell silent.</em></>}</h2>
      <p className="modal-lead">{game.status === 'won' ? game.campaignMap === 8 ? 'Campaign complete. All eight shores saved. Your four bells rang together, and the Moon forgot why it came.' : `You saved ${game.islands.length} islands. ${bells.length === 1 ? 'Your bell' : 'Every bell'} grew and reached ${moonwake ? 'sheltered water, ' : ''}connected to the Heart. This town gets to see another dawn.` : lossExplanation(game)}</p>
      <div className="result-conditions">{bells.map(island => {
        const islandStats = getIslandStats({ ...game, tide: game.maxTides }, island.id);
        const missing = [island.growth < 3 && `growth ${island.growth}/3`, !islandStats.connected && 'no Heart link', moonwake && !islandStats.sheltered && 'no final shelter', moonwake && island.stress >= 3 && `stress ${island.stress}/5`].filter(Boolean);
        return <div key={island.id}><span>{island.name}</span><strong className={missing.length ? 'needs-care' : ''}>{missing.length ? missing.join(' · ') : 'Grown · home · ready'}</strong></div>;
      })}</div>
      <p className="flourish-title"><Sprout size={14} />{game.status === 'won' ? flourishTitle : 'Your flourishing shores'}<span>{flourishing} shore growth · Heart {game.integrity}/5</span></p>
      {game.status === 'won' && game.campaignMap && game.campaignMap < 8 && <p className="campaign-unlock">Map {game.campaignMap + 1} unlocked.{game.campaignMap % 2 === 0 ? ' The fleet grows: +1 bell, +2 islands, +1 action per tide.' : ' A different shore is waiting.'}</p>}
      {game.status === 'lost' && session.finaleCheckpoint && <div className="finale-retry"><p>First Light is a learning sea. Replan tide 8 with your original resources and actions.</p><button className="primary-button wide" onClick={retryFinalTide}><Undo2 size={16} />Replan the final tide</button></div>}
      <div className="dialog-buttons"><button className="secondary-button" onClick={() => newVoyage(game.seed)}><RotateCcw size={15} />{game.campaignMap ? 'Retry this map' : 'Try this seed again'}</button><button className="primary-button" onClick={() => game.status === 'won' && game.campaignMap && game.campaignMap < 8 ? startCampaignMap(game.campaignMap + 1) : setModal('start')}>{game.status === 'won' && game.campaignMap && game.campaignMap < 8 ? `Sail to map ${game.campaignMap + 1}` : 'Campaign chart'}<ArrowRight size={16} /></button></div>
      <button className="text-button" onClick={() => setResultOpen(false)}>Linger over the islands</button>
    </Modal>}
    <div className="sr-only" aria-live="polite">Tide {game.tide} of {game.maxTides}. {game.actions} actions remaining. {game.food} food and {game.timber} timber. Heart integrity {game.integrity}. {game.status !== 'playing' ? `Voyage ${game.status}.` : ''}</div>
  </main>;
}
