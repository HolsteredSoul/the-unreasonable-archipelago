import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { Anchor, ArrowRight, Bell, Check, ChevronDown, CircleHelp, Compass, Copy, Eye, EyeOff, Flag, Heart, Leaf, Menu, Move, Plus, RotateCcw, Settings2, Shield, Sparkles, Sprout, Trees, Undo2, Volume2, VolumeX, Waves, Wind, X } from 'lucide-react';
import { applyCommand, createGame, forecastTide, getIslandStats, getLegalTowTargets, getWeather, resolveTide } from './game';
import type { Building, Command, Hex, Island } from './game/types';
import World from './world/World';
import { initialSession, persistSession, updateSeedUrl, type Settings } from './ui/storage';
import { playChime } from './ui/audio';
import './styles.css';

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
  const [modal, setModal] = useState<'intro' | 'help' | 'settings' | 'restart' | null>(() => session.seenIntro ? null : 'intro');
  const [resultOpen, setResultOpen] = useState(game.status !== 'playing');
  const [showIslands, setShowIslands] = useState(false);
  const [seedDraft, setSeedDraft] = useState(game.seed);
  const [copied, setCopied] = useState(false);
  const [toast, setToast] = useState('');
  const [saveFailed, setSaveFailed] = useState(false);
  const [advancing, setAdvancing] = useState(false);
  const advanceTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const forecast = useMemo(() => forecastTide(game), [game]);
  const selected = game.islands.find(island => island.id === selectedId) || null;
  const stats = selected ? getIslandStats(game, selected.id) : null;
  const nextSelected = selected ? forecast.state.islands.find(island => island.id === selected.id) : null;
  const weather = getWeather(game);
  const bell = game.islands.find(island => island.kind === 'bell')!;
  const bellStats = getIslandStats(game, bell.id);
  const active = game.status === 'playing' && !advancing;
  const towTargets = useMemo(() => mode === 'tow' && selected && active ? getLegalTowTargets(game, selected.id) : [], [game, selected, mode, active]);
  const canCommand = (command: Command) => active && !applyCommand(game, command).error;
  const canTow = !!selected && active && selected.kind !== 'heart' && game.actions > 0 && game.food >= 1 && getLegalTowTargets(game, selected.id).length > 0;
  const canBuild = !!selected && BUILDINGS.some(building => canCommand({ type: 'build', id: selected.id, building: building.id }));
  const canAnchor = !!selected && canCommand({ type: 'anchor', id: selected.id });
  const canNourish = !!selected && canCommand({ type: 'nourish', id: selected.id });

  useEffect(() => { setSaveFailed(!persistSession(session)); }, [session]);
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
  function selectIsland(id: string) { setSelectedId(id); setMode(null); playChime('select', session.settings.sound); }
  function execute(command: Command) {
    if (!active || modal || resultOpen) return;
    const result = applyCommand(game, command);
    if (result.error) { announce(result.error); playChime('error', session.settings.sound); return; }
    setSession(previous => ({ ...previous, state: result.state, undo: [...previous.undo, game] }));
    setMode(null); playChime('action', session.settings.sound);
  }
  function undo() {
    if (!active || !session.undo.length || modal || resultOpen) return;
    const previous = session.undo.at(-1)!;
    setSession(current => ({ ...current, state: previous, undo: current.undo.slice(0, -1) }));
    setMode(null); playChime('select', session.settings.sound);
  }
  function advance() {
    if (!active || modal || resultOpen) return;
    setMode(null); setAdvancing(true); playChime('tide', session.settings.sound);
    advanceTimer.current = setTimeout(() => {
      const result = resolveTide(game);
      setSession(previous => ({ ...previous, state: result.state, undo: [] }));
      setAdvancing(false);
      if (result.state.status !== 'playing') { setResultOpen(true); playChime(result.state.status === 'won' ? 'win' : 'error', session.settings.sound); }
      else announce(result.events[0] || 'The sea has rearranged a few things.');
      advanceTimer.current = null;
    }, session.settings.reducedMotion ? 80 : 500);
  }
  function newVoyage(seed?: string) {
    if (advanceTimer.current) clearTimeout(advanceTimer.current);
    const state = createGame(seed?.trim().slice(0, 100) || ('tide-' + crypto.randomUUID().slice(0, 8)));
    setSession(previous => ({ ...previous, state, undo: [], seenIntro: true }));
    setSelectedId(state.islands.find(island => island.kind === 'bell')?.id || null);
    setSeedDraft(state.seed); setModal(null); setResultOpen(false); setMode(null); setPreview(false); setAdvancing(false); setToast('');
    updateSeedUrl(state.seed); playChime('tide', session.settings.sound);
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
      if (modal || resultOpen || advancing) return;
      if (event.key === 'Escape') { setMode(null); setShowIslands(false); return; }
      if (event.key.toLowerCase() === 'p' && !event.ctrlKey && !event.metaKey) { event.preventDefault(); setPreview(value => !value); }
      if (event.key.toLowerCase() === 'z' && (event.ctrlKey || event.metaKey)) { event.preventDefault(); undo(); }
      if (/^[1-7]$/.test(event.key)) { const island = game.islands[Number(event.key) - 1]; if (island) selectIsland(island.id); }
      if (event.key === 'Enter' && !(event.target instanceof HTMLElement && ['BUTTON', 'A', 'SUMMARY'].includes(event.target.tagName))) { event.preventDefault(); advance(); }
    };
    window.addEventListener('keydown', handle);
    return () => window.removeEventListener('keydown', handle);
  });

  const shortage = forecast.state.food === 0 && forecast.foodDelta < 0;
  const atRisk = forecast.state.integrity < game.integrity;
  const mature = bell.growth === 3;
  const flourishing = game.islands.filter(island => island.kind === 'ordinary').reduce((sum, island) => sum + island.growth, 0);
  const flourishTitle = flourishing >= 6 ? 'Unreasonably splendid' : flourishing >= 3 ? 'A thriving little town' : 'A safe little harbor';
  const helpContent = <>
    <div className="modal-emblem"><Compass size={30} strokeWidth={1.2} /></div>
    <p className="eyebrow">A small guide to unreasonable seas</p>
    <h2>Keep your islands.<br /><em>Find your footing.</em></h2>
    <p className="modal-lead">The sea is alive, the islands are drifting, and a very small bell has something important to say.</p>
    <div className="guide-steps">
      <div><span>01</span><div><h3>Make three thoughtful moves</h3><p>Select an island. Tow it, build something useful, anchor it for one tide, or nourish its next stage of growth.</p></div></div>
      <div><span>02</span><div><h3>Read the water</h3><p>Preview the next tide before you commit. Open water feeds gardens; neighbors help groves; breakwaters provide shelter.</p></div></div>
      <div><span>03</span><div><h3>Bring the bell home</h3><p>Nourish the bell to reach all three growth stages. On the eighth tide, it must be mature and connected to the heart through touching islands.</p></div></div>
    </div>
    <div className="guide-note"><Wind size={17} /><span>Anchors last one tide. The town eats 2 food each tide. At 3 stress, production pauses; shelter lets islands recover. Nourishment waits for a safe, fed tide.</span></div>
    {modal === 'help' && <p className="keyboard-help">Keyboard: <kbd>1–7</kbd> select an island · <kbd>P</kbd> preview · <kbd>Ctrl Z</kbd> undo · <kbd>Enter</kbd> advance · <kbd>Esc</kbd> cancel</p>}
    <button className="primary-button wide" onClick={modal === 'intro' ? finishIntro : () => setModal(null)}>{modal === 'intro' ? 'Let’s make a little landfall' : 'Back to the archipelago'}<ArrowRight size={18} /></button>
  </>;

  return <main className={`game-app ${session.settings.reducedMotion ? 'reduced-motion' : ''} ${advancing ? 'is-advancing' : ''}`}>
    <div className="world-stage" aria-label="Interactive three-dimensional archipelago">
      <World state={game} forecast={forecast} selectedId={selectedId} onSelectIsland={id => { if (!advancing && !modal && !resultOpen) selectIsland(id); }} towTargets={towTargets} onSelectHex={hex => { if (selected && mode === 'tow') execute({ type: 'tow', id: selected.id, to: hex }); }} preview={preview} reducedMotion={session.settings.reducedMotion} quality={session.settings.quality} />
    </div>
    <div className="screen-grain" aria-hidden="true" />
    <div className="hud">
      <header className="topbar">
        <div className="brand"><div className="brand-mark"><Waves size={23} strokeWidth={1.35} /></div><div><p className="eyebrow">An exercise in staying afloat</p><h1>The Unreasonable<br /><em>Archipelago</em><span className="edition">FIRST LANDFALL</span></h1></div></div>
        <div className="tide-tracker"><div className="tide-label"><span>TIDE</span><strong>{String(game.tide).padStart(2, '0')}</strong><span>/ {String(game.maxTides).padStart(2, '0')}</span></div><div className="tide-dots" aria-label={`Tide ${game.tide} of ${game.maxTides}`}>{Array.from({ length: game.maxTides }, (_, index) => <span key={index} className={`${index + 1 < game.tide ? 'complete' : ''} ${index + 1 === game.tide ? 'current' : ''}`} />)}</div><p>{game.tide === game.maxTides ? 'The great tide is here' : `${game.maxTides - game.tide} tides until the great tide`}</p></div>
        <div className="top-right"><div className="resources" aria-label="Resources"><div className="resource"><Leaf size={20} /><span><strong>{game.food}</strong><small>FOOD</small></span></div><span className="resource-divider" /><div className="resource"><Trees size={20} /><span><strong>{game.timber}</strong><small>TIMBER</small></span></div><span className="resource-divider" /><div className={`resource heart-resource ${game.integrity < 3 ? 'danger' : ''}`}><Heart size={20} /><span><strong>{game.integrity}<small className="inline-small"> / 5</small></strong><small>HEART</small></span></div></div>
          <nav className="utility-nav" aria-label="Game controls"><button className="icon-button" onClick={() => setModal('help')} aria-label="How to play" title="How to play"><CircleHelp size={18} /></button><button className={`icon-button ${session.settings.sound ? 'is-on' : ''}`} onClick={() => { setting('sound', !session.settings.sound); playChime('action', !session.settings.sound); }} aria-label={session.settings.sound ? 'Mute sound' : 'Enable sound'} title={session.settings.sound ? 'Mute sound' : 'Enable sound'}>{session.settings.sound ? <Volume2 size={18} /> : <VolumeX size={18} />}</button><button className="icon-button" onClick={() => { setSeedDraft(game.seed); setModal('settings'); }} aria-label="Settings and voyage seed" title="Settings"><Settings2 size={18} /></button></nav>
        </div>
      </header>

      <div className="objective-stack">
      <aside className="objective-panel panel"><div className="panel-heading"><span className="eyebrow">THE LITTLE GRAND PLAN</span><Bell size={16} /></div><h2>A bell against<br />the impossible.</h2><p>Grow the bell. Bring it home.<br />Weather the final tide together.</p><button className="bell-progress" onClick={() => selectIsland(bell.id)} aria-label={`Select ${bell.name}. Growth ${bell.growth} of 3.`}><span className="bell-symbol"><Bell size={22} strokeWidth={1.4} /></span><span><strong>{bell.name}</strong><span className="growth-steps">{[1, 2, 3].map(level => <span key={level} className={bell.growth >= level ? 'filled' : ''}>{bell.growth >= level ? <Check size={10} /> : level}</span>)}<small>{mature ? 'In full voice' : `${bell.growth}/3 grown`}</small></span></span></button><div className={`connection-status ${bellStats.connected ? 'connected' : ''}`}><span className="status-dot" />{bellStats.connected ? 'Connected to the heart' : 'A little too far from home'}</div><div className="flourishing-progress"><span><Sprout size={12} />Flourishing shores</span><strong>{flourishing}<small> / 6</small></strong><div><i style={{ width: `${Math.min(100, flourishing / 6 * 100)}%` }} /></div></div><div className="objective-bottom"><span>{mature && bellStats.connected ? 'Ready for the last tide' : 'Stay curious. Stay afloat.'}</span><Sparkles size={13} /></div></aside>
      <div className="island-browser"><button className={`island-browser-toggle ${showIslands ? 'open' : ''}`} onClick={() => setShowIslands(value => !value)} aria-expanded={showIslands}><Menu size={15} /><span>Your seven little islands</span><ChevronDown size={14} /></button>{showIslands && <div className="island-list panel" aria-label="Select an island">{game.islands.map((island, index) => <button key={island.id} onClick={() => selectIsland(island.id)} className={selectedId === island.id ? 'selected' : ''}><span className="island-number">{index + 1}</span>{island.kind === 'bell' ? <Bell size={15} /> : island.kind === 'heart' ? <Heart size={15} /> : <Sprout size={15} />}<span>{island.name}</span>{selectedId === island.id && <Check size={14} />}</button>)}</div>}</div>
      </div>

      <aside className={`weather-panel panel ${weather.storm ? 'storm-weather' : ''}`}><div className="panel-heading"><span className="eyebrow">THE SEA’S CURRENT MOOD</span><Wind size={17} /></div><h2>{weather.name}</h2><p>{weather.description}</p><div className="weather-meta"><span><Waves size={14} />{weather.storm ? 'Heavy seas' : 'A passing tide'}</span><span>{forecast.moves.filter(move => !move.blocked && (move.from.q !== move.to.q || move.from.r !== move.to.r)).length} islands drifting</span></div><button className={`preview-button ${preview ? 'active' : ''}`} onClick={() => setPreview(value => !value)} aria-pressed={preview}>{preview ? <EyeOff size={16} /> : <Eye size={16} />}<span>{preview ? 'Return to the present' : 'Peek at the next tide'}</span><kbd>P</kbd></button></aside>


      {preview && <div className="preview-banner"><Eye size={15} /><span>Tomorrow, for a moment.</span><span className="preview-banner-detail">Ghosts show the next tide. Nothing has moved yet.</span></div>}
      {mode === 'tow' && <div className="mode-banner"><Move size={16} /><span>Choose a lit patch of water</span><button onClick={() => setMode(null)} aria-label="Cancel towing"><X size={15} /></button></div>}
      {toast && <div className="toast" role="status"><Sparkles size={15} /><span>{toast}</span><button onClick={() => setToast('')} aria-label="Dismiss notification"><X size={14} /></button></div>}

      <div className="bottom-hud">
        <section className="selected-panel panel" aria-label="Selected island">
          {selected && stats ? <><div className="selected-title"><div><p className="eyebrow">{islandLabel(selected)}</p><h2>{selected.name}</h2></div><div className={`selected-kind ${selected.kind}`}>{selected.kind === 'bell' ? <Bell size={23} strokeWidth={1.4} /> : selected.kind === 'heart' ? <Heart size={23} strokeWidth={1.4} /> : <Sprout size={23} strokeWidth={1.4} />}</div></div>
            <div className="selected-traits"><span className={stats.sheltered ? 'good' : ''}><Shield size={12} />{stats.sheltered ? 'Sheltered' : 'Exposed'}</span><span><Wind size={12} />{selected.kind === 'heart' ? 'Steadfast' : selected.anchored ? 'Anchored' : directionName(stats.current)}</span><span className={selected.stress >= 3 ? 'danger' : ''} title="Production pauses at 3 stress"><Waves size={12} />Stress {selected.stress}/5</span></div>
            <div className="selected-stats"><span><Leaf size={13} /><strong>{stats.food}</strong><small>food / tide</small></span><span><Trees size={13} /><strong>{stats.timber}</strong><small>timber / tide</small></span><span className="mini-growth" title={`Growth ${selected.growth} of 3`}><Sprout size={13} />{[1, 2, 3].map(value => <i key={value} className={selected.growth >= value ? 'filled' : ''} />)}</span></div>
            {selected.nourished && <div className="nourished-note"><Sparkles size={12} />Nourished · waiting for a gentle tide</div>}
            {preview && nextSelected && <div className="next-position">Next tide: ({nextSelected.q}, {nextSelected.r}) · growth {nextSelected.growth}/3</div>}
            {mode === 'tow' && <div className="tow-directions" aria-label="Keyboard accessible tow destinations">{towTargets.map(target => <button key={`${target.q},${target.r}`} onClick={() => execute({ type: 'tow', id: selected.id, to: target })}>{directionName({ q: target.q - selected.q, r: target.r - selected.r })}<span>{target.q}, {target.r}</span></button>)}</div>}
          </> : <p className="empty-selection">Choose an island.<br /><em>They all have their reasons.</em></p>}
        </section>

        <section className="action-area" aria-label="Island actions">
          {mode === 'build' && selected && <div className="build-menu panel"><div className="panel-heading"><span className="eyebrow">A LITTLE ROOM FOR SOMETHING</span><button className="icon-button" onClick={() => setMode(null)} aria-label="Close building choices"><X size={15} /></button></div>{BUILDINGS.map(building => <button key={building.id} disabled={!canCommand({ type: 'build', id: selected.id, building: building.id })} onClick={() => execute({ type: 'build', id: selected.id, building: building.id })}><span className="build-icon"><building.icon size={22} strokeWidth={1.4} /></span><span><strong>{building.name}</strong><small>{building.description}</small></span><span className="build-cost">3<Trees size={13} /></span></button>)}</div>}
          <div className="action-heading"><span className="eyebrow">ACTIONS THIS TIDE</span><div className="action-pips" aria-label={`${game.actions} of 3 actions remaining`}>{[1, 2, 3].map(value => <i key={value} className={game.actions >= value ? 'available' : ''} />)}<span>{game.actions} / 3</span></div><button className="undo-button" onClick={undo} disabled={!active || session.undo.length === 0} title="Undo last action (Ctrl Z)" aria-label="Undo last action"><Undo2 size={15} /></button></div>
          <div className="action-dock">
            <button className={`action-button ${mode === 'tow' ? 'active' : ''}`} aria-label="Tow island" disabled={!canTow} onClick={() => setMode(value => value === 'tow' ? null : 'tow')} title={selected?.kind === 'heart' ? 'The heart stays in place' : 'Move this island to neighboring empty water'}><Move size={25} strokeWidth={1.3} /><strong>Tow</strong><span>1<Leaf size={12} /></span></button>
            <button className={`action-button ${mode === 'build' ? 'active' : ''}`} aria-label="Build structure" disabled={!canBuild} onClick={() => setMode(value => value === 'build' ? null : 'build')} title="Build or replace a structure on an ordinary island"><Plus size={25} strokeWidth={1.3} /><strong>Build</strong><span>3<Trees size={12} /></span></button>
            <button aria-label="Anchor island" className="action-button" disabled={!canAnchor} onClick={() => selected && execute({ type: 'anchor', id: selected.id })} title="Hold this island still for the next tide"><Anchor size={25} strokeWidth={1.3} /><strong>Anchor</strong><span>1<Trees size={12} /></span></button>
            <button className={`action-button ${selected?.nourished ? 'is-nourished' : ''}`} aria-label="Nourish island" disabled={!canNourish} onClick={() => selected && execute({ type: 'nourish', id: selected.id })} title={selected?.growth === 3 ? 'This island is fully grown' : selected?.nourished ? 'Already nourished; waiting for growth conditions' : 'Prepare a new growth stage for a sheltered tide'}><Sprout size={25} strokeWidth={1.3} /><strong>{selected?.nourished ? 'Nourished' : 'Nourish'}</strong><span>{selected?.nourished ? <Check size={13} /> : <>2<Leaf size={12} /></>}</span></button>
          </div><p className="action-footnote">{game.actions === 0 ? 'A good day’s work. Let the tide come in.' : 'Every small decision makes a different shore.'}</p>
        </section>

        <section className="advance-area" aria-label="Advance tide"><div className="forecast-resources"><span className="eyebrow">AFTER THE TIDE</span><span className={forecast.foodDelta < 0 ? 'negative' : ''}><Leaf size={13} />{forecast.state.food}<small>({signed(forecast.foodDelta)})</small></span><span className={forecast.timberDelta < 0 ? 'negative' : ''}><Trees size={13} />{forecast.state.timber}<small>({signed(forecast.timberDelta)})</small></span></div>
          {(atRisk || shortage) && <p className="forecast-warning"><Heart size={12} />{atRisk ? 'The heart will take damage' : 'Food reserves will run out'}</p>}
          {game.status === 'playing' ? <button className="advance-button" onClick={advance} disabled={!active}><span><small>{advancing ? 'A MOMENT, PLEASE' : game.tide === game.maxTides ? 'HERE COMES THE GREAT TIDE' : 'WHEN YOU’RE READY'}</small><strong>{advancing ? 'The sea is thinking…' : 'Advance tide'}</strong></span><ArrowRight size={25} strokeWidth={1.3} /></button> : <button className="advance-button" onClick={() => setResultOpen(true)}><span><small>THE VOYAGE IS COMPLETE</small><strong>{game.status === 'won' ? 'Hear the bell' : 'A new beginning'}</strong></span><Flag size={22} /></button>}
          <p className="advance-footnote">{game.status === 'playing' ? <>The sea will have its say. <kbd>↵</kbd></> : 'Every ending is another possible shore.'}</p>
        </section>
      </div>
      <footer className="footer"><span><span className="live-dot" />{saveFailed ? 'Local saving unavailable · this voyage stays in this tab' : 'Your voyage is saved on this browser'}</span><button onClick={copySeed} title="Copy voyage seed"><span>SEED</span>{game.seed}{copied ? <Check size={11} /> : <Copy size={11} />}</button><span className="footer-poem">The sea is mostly water. Mostly.</span></footer>
    </div>

    {(modal === 'intro' || modal === 'help') && <Modal label={modal === 'intro' ? 'Welcome to the Unreasonable Archipelago' : 'How to play'} onClose={modal === 'intro' ? undefined : () => setModal(null)} className="guide-modal">{helpContent}</Modal>}
    {modal === 'settings' && <Modal label="Settings" onClose={() => setModal(null)}><p className="eyebrow">MAKE YOURSELF AT SEA</p><h2>A few small<br /><em>adjustments.</em></h2><div className="setting-row"><div><strong>Sound</strong><p>Soft, original chimes for small decisions.</p></div><button className={`switch ${session.settings.sound ? 'on' : ''}`} role="switch" aria-checked={session.settings.sound} aria-label="Sound" onClick={() => { setting('sound', !session.settings.sound); playChime('select', !session.settings.sound); }}><span /></button></div><div className="setting-row"><div><strong>Gentler motion</strong><p>Still water and shorter transitions.</p></div><button className={`switch ${session.settings.reducedMotion ? 'on' : ''}`} role="switch" aria-checked={session.settings.reducedMotion} aria-label="Reduced motion" onClick={() => setting('reducedMotion', !session.settings.reducedMotion)}><span /></button></div><div className="setting-row"><div><strong>Lighter rendering</strong><p>A little easier on older computers.</p></div><button className={`switch ${session.settings.quality === 'low' ? 'on' : ''}`} role="switch" aria-checked={session.settings.quality === 'low'} aria-label="Low graphics quality" onClick={() => setting('quality', session.settings.quality === 'low' ? 'high' : 'low')}><span /></button></div><div className="seed-setting"><label className="eyebrow" htmlFor="voyage-seed">EVERY VOYAGE HAS A SEED</label><div><input id="voyage-seed" value={seedDraft} maxLength={100} onChange={event => setSeedDraft(event.target.value)} spellCheck={false} autoComplete="off" /><button className="icon-button" onClick={copySeed} aria-label="Copy current seed">{copied ? <Check size={16} /> : <Copy size={16} />}</button></div><p>Use the same seed to return to the same starting world.</p></div><div className="settings-buttons"><button className="secondary-button" onClick={() => { setSeedDraft(game.seed); setModal('restart'); }}><RotateCcw size={15} />Restart this voyage</button><button className="primary-button" disabled={!seedDraft.trim()} onClick={() => setModal('restart')}>Sail with this seed<ArrowRight size={16} /></button></div><button className="text-button" onClick={() => { setSeedDraft(''); setModal('restart'); }}>Find an entirely new archipelago</button></Modal>}
    {modal === 'restart' && <Modal label="Start a new voyage" onClose={() => setModal('settings')}><div className="modal-emblem"><Compass size={30} strokeWidth={1.2} /></div><p className="eyebrow">ANOTHER POSSIBLE SHORE</p><h2>Set sail<br /><em>once more?</em></h2><p className="modal-lead">This replaces the current voyage and its saved progress. {seedDraft.trim() === game.seed ? 'You’ll return to the beginning of this same archipelago.' : seedDraft.trim() ? 'Your chosen seed will become a new voyage.' : 'A fresh, unexpected archipelago awaits.'}</p><div className="dialog-buttons"><button className="secondary-button" onClick={() => setModal('settings')}>Stay a little longer</button><button className="primary-button" onClick={() => newVoyage(seedDraft)}>Set sail<ArrowRight size={17} /></button></div></Modal>}
    {resultOpen && !modal && <Modal label={game.status === 'won' ? 'Voyage complete: victory' : 'Voyage complete'} onClose={() => setResultOpen(false)} className="result-modal"><div className={`modal-emblem ${game.status === 'won' ? 'victory' : ''}`}>{game.status === 'won' ? <Bell size={34} strokeWidth={1.2} /> : <Waves size={34} strokeWidth={1.2} />}</div><p className="eyebrow">{game.status === 'won' ? 'A VERY SMALL, VERY GREAT ACHIEVEMENT' : 'THE SEA HAD OTHER IDEAS'}</p><h2>{game.status === 'won' ? <>And the bell<br /><em>answered.</em></> : <>Nothing is lost.<br /><em>Except the plan.</em></>}</h2><p className="modal-lead">{game.status === 'won' ? 'Seven little islands, one impossible sea. Your bell grew, found its way home, and rang through the great tide.' : game.integrity === 0 ? 'The heart could weather no more. A different arrangement, a little more food, and the next voyage could sound quite different.' : 'The final tide arrived before the bell was fully grown and connected. The sea will gladly entertain another attempt.'}</p><p className="flourish-title"><Sprout size={14} />{flourishTitle}<span>{flourishing} shore growth</span></p><div className="result-stats"><span><Bell size={18} /><strong>{bell.growth}/3</strong><small>BELL GROWTH</small></span><span><Heart size={18} /><strong>{game.integrity}/5</strong><small>HEART INTEGRITY</small></span><span><Compass size={18} /><strong>{bellStats.connected ? 'Home' : 'Adrift'}</strong><small>CONNECTION</small></span></div><div className="dialog-buttons"><button className="secondary-button" onClick={() => newVoyage(game.seed)}><RotateCcw size={15} />Try this seed again</button><button className="primary-button" onClick={() => newVoyage()}>A new voyage<ArrowRight size={16} /></button></div><button className="text-button" onClick={() => setResultOpen(false)}>Linger over the islands</button></Modal>}
    <div className="sr-only" aria-live="polite">Tide {game.tide} of {game.maxTides}. {game.actions} actions remaining. {game.food} food and {game.timber} timber. Heart integrity {game.integrity}. {game.status !== 'playing' ? `Voyage ${game.status}.` : ''}</div>
  </main>;
}
