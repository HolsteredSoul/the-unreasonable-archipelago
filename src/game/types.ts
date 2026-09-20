export type Hex = { q: number; r: number };
export type Building = 'garden' | 'grove' | 'breakwater';
export type Island = Hex & {
  id: string; name: string; kind: 'heart' | 'bell' | 'ordinary';
  building: Building | null; growth: number; stress: number;
  nourished: boolean; anchored: boolean;
};
export type GameState = {
  version: 1; seed: string; tide: number; maxTides: number;
  food: number; timber: number; integrity: number; actions: number;
  status: 'playing' | 'won' | 'lost'; islands: Island[]; log: string[];
  currentRotation?: number; whaleTowedId?: string | null;
};
export type Command =
  | { type: 'tow'; id: string; to: Hex }
  | { type: 'whaleTow'; id: string }
  | { type: 'build'; id: string; building: Building }
  | { type: 'anchor'; id: string }
  | { type: 'nourish'; id: string };
export type Weather = {
  name: string; description: string; direction: number; storm: boolean;
  strength: number;
};
export type IslandStats = {
  food: number; timber: number; sheltered: boolean; connected: boolean;
  growthReady: boolean; openSides: number; current: Hex;
};
export type Forecast = {
  state: GameState;
  moves: { id: string; from: Hex; to: Hex; blocked: boolean }[];
  foodDelta: number; timberDelta: number; weather: Weather;
  production: { food: number; timber: number }; rations: number;
  shelteredIds: string[]; connectedIds: string[]; events: string[];
};
export type CommandResult = { state: GameState; error?: string };
export type WorldProps = {
  state: GameState; forecast: Forecast; selectedId: string | null;
  onSelectIsland: (id: string) => void;
  towTargets: Hex[]; onSelectHex: (hex: Hex) => void;
  preview: boolean; reducedMotion: boolean; quality: 'high' | 'low';
};
