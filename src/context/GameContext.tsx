import React, { createContext, useContext, useReducer, ReactNode } from 'react';
import { GameState, GameAction, SearchResult, SearchType, Track, GameRound } from '../types';
import { shuffleArray } from '../utils/shuffle';
import { getTracksForItem } from '../services/spotifyApi';

const TOTAL_ROUNDS = 5;
const MINIMUM_TRACKS = 5;

const initialState: GameState = {
  status: 'idle',
  selectedItem: null,
  searchType: 'artist',
  rounds: [],
  currentRoundIndex: 0,
  score: 0,
  error: null,
};

const generateRounds = (tracks: Track[], numRounds: number): GameRound[] => {
  const shuffledTracks = shuffleArray(tracks);
  const rounds: GameRound[] = [];
  const usedTrackIds = new Set<string>();

  const tracksToUse = shuffledTracks.slice(0, Math.min(numRounds, shuffledTracks.length));

  for (let i = 0; i < tracksToUse.length; i++) {
    const correctTrack = tracksToUse[i];
    usedTrackIds.add(correctTrack.id);
    const availableWrongTracks = tracks.filter((t) => !usedTrackIds.has(t.id));
    const wrongOptions = shuffleArray(availableWrongTracks).slice(0, 4);
    const options = shuffleArray([correctTrack, ...wrongOptions]);

    rounds.push({
      roundNumber: i + 1,
      correctTrack,
      options,
      selectedTrackId: null,
      isCorrect: null,
      totalTimeMs: 0,
      listenTimeMs: 0,
    });
  }

  return rounds;
};

const gameReducer = (state: GameState, action: GameAction): GameState => {
  switch (action.type) {
    case 'START_GAME':
      return {
        ...state,
        status: 'loading',
        selectedItem: action.payload.item,
        searchType: action.payload.searchType,
        error: null,
      };
    case 'SET_ROUNDS':
      return {
        ...state,
        status: 'playing',
        rounds: action.payload,
        currentRoundIndex: 0,
        score: 0,
      };
    case 'SELECT_ANSWER': {
      const currentRound = state.rounds[state.currentRoundIndex];
      const isCorrect = action.payload === currentRound.correctTrack.id;
      const updatedRounds = state.rounds.map((round, idx) =>
        idx === state.currentRoundIndex
          ? { ...round, selectedTrackId: action.payload, isCorrect }
          : round
      );
      return {
        ...state,
        rounds: updatedRounds,
        score: isCorrect ? state.score + 1 : state.score,
      };
    }
    case 'NEXT_ROUND':
      return {
        ...state,
        currentRoundIndex: state.currentRoundIndex + 1,
        status: state.currentRoundIndex + 1 >= state.rounds.length ? 'finished' : 'playing',
      };
    case 'FINISH_GAME':
      return { ...state, status: 'finished' };
    case 'SET_ERROR':
      return { ...state, error: action.payload, status: 'idle' };
    case 'RESET':
      return initialState;
    case 'RECORD_TIMING': {
      const updatedRounds = state.rounds.map((round, idx) =>
        idx === action.payload.roundIndex
          ? {
              ...round,
              totalTimeMs: action.payload.totalTimeMs,
              listenTimeMs: action.payload.listenTimeMs,
            }
          : round
      );
      return { ...state, rounds: updatedRounds };
    }
    default:
      return state;
  }
};

interface GameContextType {
  state: GameState;
  startGame: (item: SearchResult, searchType: SearchType) => Promise<void>;
  selectAnswer: (trackId: string) => void;
  nextRound: () => void;
  reset: () => void;
  recordTiming: (roundIndex: number, totalTimeMs: number, listenTimeMs: number) => void;
  currentRound: GameRound | null;
}

const GameContext = createContext<GameContextType | null>(null);

export const GameProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [state, dispatch] = useReducer(gameReducer, initialState);

  const startGame = async (item: SearchResult, searchType: SearchType) => {
    dispatch({ type: 'START_GAME', payload: { item, searchType } });
    try {
      const tracks = await getTracksForItem(item, searchType);
      const numRounds = Math.min(tracks.length, TOTAL_ROUNDS);
      if (tracks.length < MINIMUM_TRACKS) {
        dispatch({ type: 'SET_ERROR', payload: `This item only has ${tracks.length} songs. Try a more popular one.` });
        return;
      }
      const rounds = generateRounds(tracks, numRounds);
      dispatch({ type: 'SET_ROUNDS', payload: rounds });
    } catch {
      dispatch({ type: 'SET_ERROR', payload: 'Failed to load tracks' });
    }
  };

  const selectAnswer = (trackId: string) => {
    dispatch({ type: 'SELECT_ANSWER', payload: trackId });
  };

  const nextRound = () => {
    dispatch({ type: 'NEXT_ROUND' });
  };

  const reset = () => {
    dispatch({ type: 'RESET' });
  };

  const recordTiming = (roundIndex: number, totalTimeMs: number, listenTimeMs: number) => {
    dispatch({ type: 'RECORD_TIMING', payload: { roundIndex, totalTimeMs, listenTimeMs } });
  };

  const currentRound = state.rounds[state.currentRoundIndex] || null;

  return (
    <GameContext.Provider value={{ state, startGame, selectAnswer, nextRound, reset, recordTiming, currentRound }}>
      {children}
    </GameContext.Provider>
  );
};

export const useGame = () => {
  const context = useContext(GameContext);
  if (!context) throw new Error('useGame must be used within GameProvider');
  return context;
};