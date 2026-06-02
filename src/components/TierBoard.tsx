import React, { useState } from 'react';
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
  currentTrackId,
  canReRank,
  onRank,
  onUnrank,
}) => {
  const [dragOverSlot, setDragOverSlot] = useState<number | null>(null);

  const tracksById = new Map(tracks.map((t) => [t.id, t]));

  const getTrackForSlot = (slot: number): Track | null => {
    const entry = Object.entries(rankings).find(([, rank]) => rank === slot);
    if (!entry) return null;
    return tracksById.get(entry[0]) || null;
  };

  const isTrackLocked = (trackId: string): boolean => {
    return lockedRankings[trackId] !== undefined;
  };

  const handleDragOver = (e: React.DragEvent, slot: number) => {
    e.preventDefault();
    e.stopPropagation();
    if (!canReRank) return;
    const track = getTrackForSlot(slot);
    if (track) return;
    setDragOverSlot(slot);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.stopPropagation();
    if (e.currentTarget.contains(e.relatedTarget as Node)) return;
    setDragOverSlot(null);
  };

  const handleDrop = (e: React.DragEvent, slot: number) => {
    e.preventDefault();
    e.stopPropagation();
    setDragOverSlot(null);
    if (!canReRank) return;
    const track = getTrackForSlot(slot);
    if (track) return;
    if (!currentTrackId) return;
    onRank(currentTrackId, slot);
  };

  return (
    <div className="tier-board">
      {[1, 2, 3, 4, 5].map((slot) => {
        const track = getTrackForSlot(slot);
        const isLocked = track ? isTrackLocked(track.id) : false;
        const isDragOver = dragOverSlot === slot && !track && canReRank;

        return (
          <div
            key={slot}
            className={`tier-slot ${isDragOver ? 'drag-over' : ''} ${isLocked ? 'locked' : ''}`}
            onDragOver={(e) => handleDragOver(e, slot)}
            onDragLeave={handleDragLeave}
            onDrop={(e) => handleDrop(e, slot)}
            onClick={() => {
              if (!track || isLocked) return;
              onUnrank(track.id);
            }}
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
                <span className="slot-empty">Drop here</span>
              )}
            </div>
            {isLocked && <span className="locked-indicator">🔒</span>}
          </div>
        );
      })}
    </div>
  );
};