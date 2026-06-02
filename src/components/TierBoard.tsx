import React from 'react';
import { useDroppable } from '@dnd-kit/core';
import { Track } from '../types';
import './TierBoard.css';

interface TierBoardProps {
  rankings: Record<string, number>;
  lockedRankings: Record<string, number>;
  tracks: Track[];
  currentTrackId: string | null;
  canReRank: boolean;
  onRank: (trackId: string, rank: number) => void;
  onUnrank: (trackId: string) => void;
}

export const TierBoard: React.FC<TierBoardProps> = ({
  rankings,
  lockedRankings,
  tracks,
  currentTrackId: _currentTrackId,
  canReRank,
  onRank: _onRank,
  onUnrank,
}) => {
  const tracksById = new Map(tracks.map((t) => [t.id, t]));

  const getTrackForSlot = (slot: number): Track | null => {
    const entry = Object.entries(rankings).find(([, rank]) => rank === slot);
    if (!entry) return null;
    return tracksById.get(entry[0]) || null;
  };

  const isTrackLocked = (trackId: string): boolean => {
    return lockedRankings[trackId] !== undefined;
  };

  return (
    <div className="tier-board">
      {[1, 2, 3, 4, 5].map((slot) => {
        const track = getTrackForSlot(slot);
        const isLocked = track ? isTrackLocked(track.id) : false;

        return (
          <TierSlot
            key={slot}
            slot={slot}
            track={track}
            isLocked={isLocked}
            canReRank={canReRank}
            onUnrank={onUnrank}
          />
        );
      })}
    </div>
  );
};

interface TierSlotProps {
  slot: number;
  track: Track | null;
  isLocked: boolean;
  canReRank: boolean;
  onUnrank: (trackId: string) => void;
}

const TierSlot: React.FC<TierSlotProps> = ({
  slot,
  track,
  isLocked,
  canReRank,
  onUnrank,
}) => {
  const { isOver, setNodeRef } = useDroppable({
    id: `slot-${slot}`,
    data: { slot },
    disabled: !canReRank,
  });

  const handleClick = () => {
    if (!track || isLocked) return;
    onUnrank(track.id);
  };

  return (
    <div
      ref={setNodeRef}
      className={`tier-slot ${isOver && !track && canReRank ? 'drag-over' : ''} ${isLocked ? 'locked' : ''}`}
      onClick={handleClick}
    >
      <div className="tier-rank">
        {slot}
        <div className="tier-rank-label">
          {slot === 1 ? 'S' : slot === 2 ? 'A' : slot === 3 ? 'B' : slot === 4 ? 'C' : 'D'}
        </div>
      </div>
      <div className="slot-content">
        {track ? (
          <div className="slot-track">
            <span className="slot-track-name">{track.name}</span>
            <span className="slot-track-artist">
              {track.artists.map((a) => a.name).join(', ')}
            </span>
          </div>
        ) : (
          <span className="slot-empty">{isOver ? 'Drop here!' : 'Drop here'}</span>
        )}
      </div>
      {isLocked && <span className="locked-indicator">🔒</span>}
    </div>
  );
};