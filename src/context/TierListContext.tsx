import React, { createContext, useContext, useReducer, ReactNode } from 'react';
import { SearchResult, SearchType, Track } from '../types';
import { shuffleArray } from '../utils/shuffle';
import { getTracksForItem } from '../services/spotifyApi';

const TOTAL_TRACKS = 5;
const MINIMUM_TRACKS = 5;

interface TierListState {
  status: 'idle' | 'loading' | 'playing' | 'finished';
  selectedItem: SearchResult | null;
  searchType: SearchType;
  tracks: Track[];
  currentTrackIndex: number;
  rankings: Record<string, number>;
  lockedRankings: Record<string, number>;
  playback: {
    isPlaying: boolean;
    currentTime: number;
    duration: number;
  };
  error: string | null;
}

type TierListAction =
  | { type: 'START_GAME'; payload: { item: SearchResult; searchType: SearchType } }
  | { type: 'SET_TRACKS'; payload: Track[] }
  | { type: 'SET_RANKING'; payload: { trackId: string; rank: number } }
  | { type: 'UNRANK'; payload: { trackId: string } }
  | { type: 'LOCK_RANKING' }
  | { type: 'NEXT_TRACK' }
  | { type: 'SET_PLAYBACK'; payload: { isPlaying?: boolean; currentTime?: number; duration?: number } }
  | { type: 'SET_ERROR'; payload: string }
  | { type: 'RESET' };

const initialState: TierListState = {
  status: 'idle',
  selectedItem: null,
  searchType: 'artist',
  tracks: [],
  currentTrackIndex: 0,
  rankings: {},
  lockedRankings: {},
  playback: {
    isPlaying: false,
    currentTime: 0,
    duration: 0,
  },
  error: null,
};

const tierListReducer = (state: TierListState, action: TierListAction): TierListState => {
  switch (action.type) {
    case 'START_GAME':
      return {
        ...state,
        status: 'loading',
        selectedItem: action.payload.item,
        searchType: action.payload.searchType,
        error: null,
      };
    case 'SET_TRACKS':
      return {
        ...state,
        status: 'playing',
        tracks: action.payload,
        currentTrackIndex: 0,
        rankings: {},
        lockedRankings: {},
      };
    case 'SET_RANKING': {
      const newRankings = { ...state.rankings };
      const trackId = action.payload.trackId;
      const targetRank = action.payload.rank;

      const existingTrackId = Object.entries(newRankings).find(([, rank]) => rank === targetRank)?.[0];

      if (existingTrackId && existingTrackId !== trackId) {
        return state;
      }

      newRankings[trackId] = targetRank;
      return { ...state, rankings: newRankings };
    }
    case 'UNRANK': {
      const newRankings = { ...state.rankings };
      delete newRankings[action.payload.trackId];
      return { ...state, rankings: newRankings };
    }
    case 'LOCK_RANKING': {
      const currentTrack = state.tracks[state.currentTrackIndex];
      if (!currentTrack) return state;
      const rank = state.rankings[currentTrack.id];
      if (!rank) return state;
      const newLocked = { ...state.lockedRankings };
      newLocked[currentTrack.id] = rank;
      return { ...state, lockedRankings: newLocked };
    }
    case 'NEXT_TRACK': {
      const nextIndex = state.currentTrackIndex + 1;
      if (nextIndex >= state.tracks.length) {
        return { ...state, status: 'finished' };
      }
      return { ...state, currentTrackIndex: nextIndex };
    }
    case 'SET_PLAYBACK':
      return {
        ...state,
        playback: {
          ...state.playback,
          ...action.payload,
        },
      };
    case 'SET_ERROR':
      return { ...state, error: action.payload, status: 'idle' };
    case 'RESET':
      return initialState;
    default:
      return state;
  }
};

interface TierListContextType {
  state: TierListState;
  startTierList: (item: SearchResult, searchType: SearchType) => Promise<void>;
  setRanking: (trackId: string, rank: number) => void;
  unrank: (trackId: string) => void;
  lockCurrentRanking: () => void;
  nextTrack: () => void;
  setPlayback: (data: { isPlaying?: boolean; currentTime?: number; duration?: number }) => void;
  reset: () => void;
  currentTrack: Track | null;
  rankedCount: number;
  canReRank: boolean;
}

const TierListContext = createContext<TierListContextType | null>(null);

export const TierListProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [state, dispatch] = useReducer(tierListReducer, initialState);

  const startTierList = async (item: SearchResult, searchType: SearchType) => {
    dispatch({ type: 'START_GAME', payload: { item, searchType } });
    try {
      const tracks = await getTracksForItem(item, searchType);
      if (tracks.length < MINIMUM_TRACKS) {
        dispatch({ type: 'SET_ERROR', payload: `This item only has ${tracks.length} songs. Try a more popular one.` });
        return;
      }
      const shuffled = shuffleArray(tracks).slice(0, TOTAL_TRACKS);
      dispatch({ type: 'SET_TRACKS', payload: shuffled });
    } catch {
      dispatch({ type: 'SET_ERROR', payload: 'Failed to load tracks' });
    }
  };

  const setRanking = (trackId: string, rank: number) => {
    dispatch({ type: 'SET_RANKING', payload: { trackId, rank } });
  };

  const unrank = (trackId: string) => {
    dispatch({ type: 'UNRANK', payload: { trackId } });
  };

  const lockCurrentRanking = () => {
    dispatch({ type: 'LOCK_RANKING' });
  };

  const nextTrack = () => {
    dispatch({ type: 'NEXT_TRACK' });
  };

  const setPlayback = (data: { isPlaying?: boolean; currentTime?: number; duration?: number }) => {
    dispatch({ type: 'SET_PLAYBACK', payload: data });
  };

  const reset = () => {
    dispatch({ type: 'RESET' });
  };

  const currentTrack = state.tracks[state.currentTrackIndex] || null;
  const rankedCount = Object.keys(state.rankings).length;
  const currentTrackId = currentTrack?.id;
  const canReRank = currentTrackId ? !state.lockedRankings[currentTrackId] : false;

  return (
    <TierListContext.Provider
      value={{
        state,
        startTierList,
        setRanking,
        unrank,
        lockCurrentRanking,
        nextTrack,
        setPlayback,
        reset,
        currentTrack,
        rankedCount,
        canReRank,
      }}
    >
      {children}
    </TierListContext.Provider>
  );
};

export const useTierList = () => {
  const context = useContext(TierListContext);
  if (!context) throw new Error('useTierList must be used within TierListProvider');
  return context;
};