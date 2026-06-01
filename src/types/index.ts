export interface Artist {
  id: string;
  name: string;
  images: { url: string; width: number; height: number }[];
  popularity: number;
}

export interface Playlist {
  id: string;
  name: string;
  images: { url: string; width: number; height: number }[] | null;
  owner: { display_name: string };
  tracks: { total: number };
}

export interface Album {
  id: string;
  name: string;
  images: { url: string; width: number; height: number }[];
  artists: { id: string; name: string }[];
  release_date: string;
}

export type SearchResult = Artist | Playlist | Album;
export type SearchType = 'artist' | 'playlist' | 'album';

export interface Track {
  id: string;
  name: string;
  preview_url: string | null;
  duration_ms: number;
  artists: { id: string; name: string }[];
}

export interface GameRound {
  roundNumber: number;
  correctTrack: Track;
  options: Track[];
  selectedTrackId: string | null;
  isCorrect: boolean | null;
  totalTimeMs: number;
  listenTimeMs: number;
}

export interface GameState {
  status: 'idle' | 'loading' | 'playing' | 'finished';
  selectedItem: SearchResult | null;
  searchType: SearchType;
  rounds: GameRound[];
  currentRoundIndex: number;
  score: number;
  error: string | null;
}

export type GameAction =
  | { type: 'START_GAME'; payload: { item: SearchResult; searchType: SearchType } }
  | { type: 'SET_ROUNDS'; payload: GameRound[] }
  | { type: 'SELECT_ANSWER'; payload: string }
  | { type: 'NEXT_ROUND' }
  | { type: 'FINISH_GAME' }
  | { type: 'SET_ERROR'; payload: string }
  | { type: 'RESET' }
  | { type: 'RECORD_TIMING'; payload: { roundIndex: number; totalTimeMs: number; listenTimeMs: number } };