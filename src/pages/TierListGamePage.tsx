import React, { useEffect, useState, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { DndContext, DragEndEvent, PointerSensor, useSensor, useSensors } from '@dnd-kit/core';
import { useTierList } from '../context/TierListContext';
import { TierBoard, DraggableSong } from '../components';
import { playTrack, getPlayer, getDeviceId, pauseTrack as pauseTrackPlayer, resumeTrack as resumeTrackPlayer, setVolume, seekTrack } from '../services/spotifyPlayer';
import { setTrackLiked } from '../services/spotifyApi';
import { Artist, Playlist, Album } from '../types';
import './TierListGamePage.css';
import { ROUTES } from '../routes';

interface TierListGamePageProps {
  onFinish: () => void;
  onBackToSelection: () => void;
}

export const TierListGamePage: React.FC<TierListGamePageProps> = ({ onFinish, onBackToSelection }) => {
  const navigate = useNavigate();
  const { state, currentTrack, rankedCount, canReRank, setRanking, unrank, lockCurrentRanking, nextTrack, setPlayback } = useTierList();
  const [isPaused, setIsPaused] = useState(false);
  const [playerReady, setPlayerReady] = useState(false);
  const [playerInitialized, setPlayerInitialized] = useState(false);
  const [volume, setVolumeState] = useState(0.5);
  const [currentPosition, setCurrentPosition] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isLiked, setIsLiked] = useState(false);
  const positionIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const hasPlayedRef = useRef(false);

  useEffect(() => {
    if (!state.selectedItem) {
      navigate(ROUTES.TIERLIST_SELECTION);
    }
  }, [state.selectedItem, navigate]);

  useEffect(() => {
    const checkPlayer = () => {
      const p = getPlayer();
      const d = getDeviceId();
      if (p && d) {
        setPlayerReady(true);
        setPlayerInitialized(true);
      }
    };
    checkPlayer();
    const interval = setInterval(checkPlayer, 500);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    hasPlayedRef.current = false;
    setIsPaused(false);
    setIsLiked(false);
    setCurrentPosition(0);
    if (positionIntervalRef.current) {
      clearInterval(positionIntervalRef.current);
      positionIntervalRef.current = null;
    }
  }, [state.currentTrackIndex]);

  useEffect(() => {
    if (positionIntervalRef.current) {
      clearInterval(positionIntervalRef.current);
      positionIntervalRef.current = null;
    }

    const playCurrentTrack = async () => {
      if (!playerReady || !currentTrack || hasPlayedRef.current) {
        return;
      }
      hasPlayedRef.current = true;
      setIsPaused(false);

      try {
        await playTrack(`spotify:track:${currentTrack.id}`);
        setDuration(currentTrack.duration_ms);
        setIsPaused(false);

        positionIntervalRef.current = setInterval(async () => {
          const player = getPlayer();
          if (player) {
            const state = await player.getCurrentState();
            if (state) {
              setCurrentPosition(state.position);
              setDuration(state.duration);
              setPlayback({ currentTime: state.position, duration: state.duration });
            }
          }
        }, 500);
      } catch (err) {
        console.error('Error playing track:', err);
      }
    };
    playCurrentTrack();

    return () => {
      if (positionIntervalRef.current) {
        clearInterval(positionIntervalRef.current);
      }
    };
  }, [currentTrack, playerReady]);

  useEffect(() => {
    if (state.status === 'finished') {
      onFinish();
    }
  }, [state.status, onFinish]);

  const handleRank = useCallback((trackId: string, rank: number) => {
    setRanking(trackId, rank);
  }, [setRanking]);

  const handleUnrank = useCallback((trackId: string) => {
    unrank(trackId);
  }, [unrank]);

  const togglePause = useCallback(async () => {
    try {
      if (isPaused) {
        await resumeTrackPlayer();
        setIsPaused(false);
        setPlayback({ isPlaying: true });
      } else {
        await pauseTrackPlayer();
        setIsPaused(true);
        setPlayback({ isPlaying: false });
      }
    } catch (err) {
      console.error('Pause toggle error:', err);
    }
  }, [isPaused, setPlayback]);

  const handleVolumeChange = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!playerInitialized) return;
    const newVolume = parseFloat(e.target.value);
    setVolumeState(newVolume);
    await setVolume(newVolume);
  }, [playerInitialized]);

  const handleSeek = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const newPosition = parseFloat(e.target.value);
    setCurrentPosition(newPosition);
    await seekTrack(newPosition);
  }, []);

  const handleLike = useCallback(async () => {
    if (!currentTrack) return;
    const success = await setTrackLiked(currentTrack.id);
    if (success) {
      setIsLiked(true);
    }
  }, [currentTrack]);

  const handleNextTrack = useCallback(() => {
    lockCurrentRanking();
    nextTrack();
  }, [lockCurrentRanking, nextTrack]);

  const handleBackToSelection = useCallback(async () => {
    const player = getPlayer();
    if (player) {
      player.pause();
    }
    if (positionIntervalRef.current) {
      clearInterval(positionIntervalRef.current);
    }
    onBackToSelection();
  }, [onBackToSelection]);

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

  const getItemName = () => state.selectedItem?.name || '';

  const currentTrackRanked = currentTrack ? state.rankings[currentTrack.id] !== undefined : false;
  const isCurrentTrackLocked = currentTrack ? state.lockedRankings[currentTrack.id] !== undefined : false;
  const allRanked = rankedCount === state.tracks.length;

  const formatTime = (ms: number) => {
    const seconds = Math.floor(ms / 1000);
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  if (state.status === 'loading') {
    return (
      <div className="tierlist-game-page">
        <div className="loading">Loading tracks...</div>
      </div>
    );
  }

  if (state.error) {
    return (
      <div className="tierlist-game-page">
        <div className="error-message">{state.error}</div>
        <button onClick={() => window.location.reload()} className="spotify-button">
          Try Again
        </button>
      </div>
    );
  }

  if (!currentTrack) return null;

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    })
  );

  const handleDragEnd = useCallback((event: DragEndEvent) => {
    const { active, over } = event;
    if (!over) return;

    const overId = over.id as string;
    if (!overId.startsWith('slot-')) return;

    const slot = parseInt(overId.replace('slot-', ''), 10);
    if (isNaN(slot)) return;

    const trackId = active.id as string;
    if (trackId === 'no-track') return;

    handleRank(trackId, slot);
  }, [handleRank]);

  return (
    <DndContext sensors={sensors} onDragEnd={handleDragEnd}>
      <div className="tierlist-game-page">
        <div className="game-header">
          <button className="back-button" onClick={handleBackToSelection} title="Back to selection">
            ←
          </button>
          <img src={getItemImage()} alt={getItemName()} className="artist-avatar" />
          <h2 className="artist-title">{getItemName()}</h2>
          <div className="tierlist-progress">
            <span className="progress-text">{rankedCount}/5</span>
          </div>
        </div>

        <div className="main-content">
          <div className="tier-section">
            <TierBoard
              rankings={state.rankings}
              lockedRankings={state.lockedRankings}
              tracks={state.tracks}
              currentTrackId={currentTrack.id}
              canReRank={canReRank}
              onRank={handleRank}
              onUnrank={handleUnrank}
            />
          </div>

          <div className="controls-section">
            <div className="now-playing">
              <button className="pause-button" onClick={togglePause} disabled={!playerReady}>
                {isPaused ? '▶' : '⏸'}
              </button>
              <button
                className={`like-button ${isLiked ? 'liked' : ''}`}
                onClick={handleLike}
                disabled={!playerReady || isLiked}
                title="Add to Liked Songs"
              >
                {isLiked ? '♥' : '♡'}
              </button>
              <span className="listening-text">{isPaused ? 'Paused' : 'Now Playing'}</span>
              <div className="seek-row">
                <span className="time-display">{formatTime(currentPosition)}</span>
                <input
                  type="range"
                  min="0"
                  max={duration || 100}
                  value={currentPosition}
                  onChange={handleSeek}
                  className="seek-slider"
                  disabled={!playerReady}
                />
                <span className="time-display">{formatTime(duration)}</span>
              </div>
              <div className="volume-row">
                <span className="volume-icon">🔊</span>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.01"
                  value={volume}
                  onChange={handleVolumeChange}
                  className="volume-slider"
                  title="Volume"
                  disabled={!playerReady}
                />
              </div>
            </div>

            <div className="draggable-area">
              <DraggableSong
                track={currentTrack}
                isPlaying={!isPaused}
                canDrag={canReRank}
                isRanked={currentTrackRanked}
              />
              {!currentTrackRanked && (
                <p className="drag-hint">Drag to rank</p>
              )}
              {currentTrackRanked && !isCurrentTrackLocked && (
                <p className="drag-hint">Click slot to unrank</p>
              )}
            </div>

            <button
              className="next-track-button"
              onClick={handleNextTrack}
              disabled={state.currentTrackIndex >= state.tracks.length - 1 ? !allRanked : !currentTrackRanked}
            >
              {state.currentTrackIndex >= state.tracks.length - 1 ? (allRanked ? 'See Results' : 'Rank All') : 'Next Song'}
            </button>
          </div>
        </div>
      </div>
    </DndContext>
  );
};