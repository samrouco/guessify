import React, { useEffect, useState, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useGame } from '../context/GameContext';
import { SongOption, ScoreDisplay, getListenTime, getRandomStart } from '../components';
import { playTrack, getPlayer, getDeviceId, pauseTrack as pauseTrackPlayer, resumeTrack as resumeTrackPlayer } from '../services/spotifyPlayer';
import { setTrackLiked } from '../services/spotifyApi';
import { Artist, Playlist, Album } from '../types';
import './GamePage.css';
import { ROUTES } from '../routes';

interface GamePageProps {
  onFinish: () => void;
  onBackToSelection: () => void;
}

export const GamePage: React.FC<GamePageProps> = ({ onFinish, onBackToSelection }) => {
  const navigate = useNavigate();
  const { state, currentRound, selectAnswer, nextRound, recordTiming } = useGame();
  const [isPaused, setIsPaused] = useState(false);
  const [playerReady, setPlayerReady] = useState(false);
  const [isLiked, setIsLiked] = useState(false);
  const [autoPausedByTimeLimit, setAutoPausedByTimeLimit] = useState(false);
  const accumulatedListenTimeRef = useRef(0);
  const hasPlayedRef = useRef(false);
  const pauseTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const totalTimeSinceStartRef = useRef<number>(0);

  useEffect(() => {
    if (!state.selectedItem) {
      navigate(ROUTES.LANDING);
    }
  }, [state.selectedItem, navigate]);

  useEffect(() => {
    const checkPlayer = () => {
      const p = getPlayer();
      const d = getDeviceId();
      if (p && d) {
        setPlayerReady(true);
      }
    };
    checkPlayer();
    const interval = setInterval(checkPlayer, 500);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    hasPlayedRef.current = false;
    setIsLiked(false);
    setAutoPausedByTimeLimit(false);
    accumulatedListenTimeRef.current = 0;
    totalTimeSinceStartRef.current = Date.now();
    if (pauseTimeoutRef.current) {
      clearTimeout(pauseTimeoutRef.current);
      pauseTimeoutRef.current = null;
    }
  }, [state.currentRoundIndex]);

  useEffect(() => {
    if (pauseTimeoutRef.current) {
      clearTimeout(pauseTimeoutRef.current);
      pauseTimeoutRef.current = null;
    }

    const playCurrentTrack = async () => {
      if (!playerReady || !currentRound || hasPlayedRef.current || currentRound.selectedTrackId !== null) {
        return;
      }
      hasPlayedRef.current = true;
      setIsPaused(false);
      setAutoPausedByTimeLimit(false);
      accumulatedListenTimeRef.current = 0;

      const randomStart = getRandomStart();
      const listenTime = getListenTime();
      const trackDuration = currentRound.correctTrack.duration_ms;

      let startPositionMs = 0;
      if (randomStart && listenTime !== 'infinite') {
        const minRemaining = listenTime * 1000;
        const maxStart = trackDuration - minRemaining;
        if (maxStart > 0) {
          startPositionMs = Math.floor(Math.random() * maxStart);
        }
      }

      try {
        await playTrack(`spotify:track:${currentRound.correctTrack.id}`, startPositionMs);
      } catch (err) {
        console.error('Error playing track:', err);
      }

      if (listenTime !== 'infinite') {
        pauseTimeoutRef.current = setTimeout(() => {
          accumulatedListenTimeRef.current += listenTime;
          pauseTrackPlayer();
          setAutoPausedByTimeLimit(true);
        }, listenTime * 1000);
      }
    };
    playCurrentTrack();

    return () => {
      if (pauseTimeoutRef.current) {
        clearTimeout(pauseTimeoutRef.current);
      }
    };
  }, [currentRound, playerReady]);

  useEffect(() => {
    if (state.status === 'finished') {
      onFinish();
    }
  }, [state.status, onFinish]);

  const handleSelectAnswer = async (trackId: string) => {
    if (currentRound?.selectedTrackId !== null) return;
    const totalTimeMs = totalTimeSinceStartRef.current > 0
      ? Date.now() - totalTimeSinceStartRef.current
      : 0;
    recordTiming(state.currentRoundIndex, totalTimeMs, accumulatedListenTimeRef.current);
    selectAnswer(trackId);
  };

  const handleNextRound = () => {
    nextRound();
  };

  const handleBackToSelection = useCallback(async () => {
    const player = getPlayer();
    if (player) {
      player.pause();
    }
    onBackToSelection();
  }, [onBackToSelection]);

const togglePause = useCallback(async () => {
    try {
      if (isPaused) {
        if (autoPausedByTimeLimit) {
          await playTrack(`spotify:track:${currentRound!.correctTrack.id}`);
          setAutoPausedByTimeLimit(false);
          const listenTime = getListenTime();

          if (listenTime !== 'infinite') {
            if (pauseTimeoutRef.current) {
              clearTimeout(pauseTimeoutRef.current);
            }
            pauseTimeoutRef.current = setTimeout(() => {
              accumulatedListenTimeRef.current += listenTime;
              pauseTrackPlayer();
              setAutoPausedByTimeLimit(true);
            }, listenTime * 1000);
          }

          setIsPaused(false);
        } else {
          await resumeTrackPlayer();
          setIsPaused(false);
        }
      } else {
        await pauseTrackPlayer();
        setIsPaused(true);
      }
    } catch (err) {
      console.error('Pause toggle error:', err);
    }
  }, [isPaused, autoPausedByTimeLimit, currentRound]);

  const handleLike = useCallback(async () => {
    if (!currentRound) return;
    const success = await setTrackLiked(currentRound.correctTrack.id);
    if (success) {
      setIsLiked(true);
    }
  }, [currentRound]);

  const handleExtendListen = useCallback(async () => {
    if (!autoPausedByTimeLimit || !playerReady) return;

    const listenTime = getListenTime();
    if (listenTime === 'infinite') return;

    try {
      await resumeTrackPlayer();

      setAutoPausedByTimeLimit(false);
      const newAccumulated = accumulatedListenTimeRef.current + listenTime;
      accumulatedListenTimeRef.current = newAccumulated;

      pauseTimeoutRef.current = setTimeout(() => {
        pauseTrackPlayer();
        setAutoPausedByTimeLimit(true);
      }, newAccumulated * 1000);

      setIsPaused(false);
    } catch (err) {
      console.error('Extend listen error:', err);
    }
  }, [autoPausedByTimeLimit, playerReady]);

  if (!state.selectedItem) return null;

  const getItemImage = () => {
    if (!state.selectedItem) return '';
    if (state.searchType === 'artist') {
      return (state.selectedItem as Artist).images[0]?.url;
    } else if (state.searchType === 'playlist') {
      return (state.selectedItem as Playlist).images?.[0]?.url || '';
    } else {
      return (state.selectedItem as Album).images[0]?.url;
    }
  };

  const getItemName = () => {
    return state.selectedItem!.name;
  };

  if (state.status === 'loading') {
    return (
      <div className="game-page">
        <div className="loading">Loading game...</div>
      </div>
    );
  }

  if (state.error) {
    return (
      <div className="game-page">
        <div className="error-message">{state.error}</div>
        <button onClick={() => window.location.reload()} className="spotify-button">
          Try Again
        </button>
      </div>
    );
  }

  if (!currentRound) return null;

  const hasAnswered = currentRound.selectedTrackId !== null;
  const isCorrect = currentRound.isCorrect;

  return (
    <div className="game-page">
      <div className="game-header">
        <button className="back-button" onClick={handleBackToSelection} title="Back to selection">
          ←
        </button>
        <img
          src={getItemImage()}
          alt={getItemName()}
          className="artist-avatar"
        />
        <h2 className="artist-title">{getItemName()}</h2>
      </div>

      <ScoreDisplay
        score={state.score}
        totalRounds={state.rounds.length}
        currentRound={state.currentRoundIndex + 1}
      />

      <div className="options-container">
        {currentRound.options.map((track) => (
          <SongOption
            key={track.id}
            track={track}
            onClick={() => handleSelectAnswer(track.id)}
            isSelected={hasAnswered ? (currentRound.selectedTrackId === track.id ? true : false) : null}
            isCorrect={hasAnswered ? (track.id === currentRound.correctTrack.id ? true : false) : null}
            disabled={hasAnswered}
          />
        ))}
      </div>

      <div className="controls-section">
        <div className="now-playing">
          <button
            className="pause-button"
            onClick={togglePause}
            disabled={!playerReady || hasAnswered}
          >
            {autoPausedByTimeLimit ? '⏮' : isPaused ? '▶' : '⏸'}
          </button>
          <span className="listening-text">{isPaused ? 'Paused' : 'Listening...'}</span>
          {autoPausedByTimeLimit && (
            <button
              className={`extend-button ${!playerReady || hasAnswered ? 'disabled' : ''}`}
              onClick={handleExtendListen}
              disabled={!playerReady || hasAnswered}
              title="Listen more"
            >
              +{getListenTime()}s
            </button>
          )}
          <button
            className={`like-button ${isLiked ? 'liked' : ''}`}
            onClick={handleLike}
            disabled={!playerReady || hasAnswered || isLiked}
            title="Add to Liked Songs"
          >
            {isLiked ? '♥' : '♡'}
          </button>
        </div>

        {hasAnswered && (
          <div className="round-result">
            {isCorrect ? (
              <span className="result-correct">+1</span>
            ) : (
              <span className="result-wrong">Wrong</span>
            )}
            <button className="next-button" onClick={handleNextRound}>
              {state.currentRoundIndex + 1 >= state.rounds.length ? 'Results' : 'Next'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};