import React from 'react';
import { Track } from '../types';
import './DraggableSong.css';

interface DraggableSongProps {
  track: Track | null;
  isPlaying: boolean;
  canDrag: boolean;
  isRanked: boolean;
}

export const DraggableSong: React.FC<DraggableSongProps> = ({
  track,
  isPlaying,
  canDrag,
  isRanked,
}) => {
  if (!track) {
    return (
      <div className="draggable-song" style={{ opacity: 0.5, cursor: 'default' }}>
        <div className="song-content">
          <span className="song-icon">🎵</span>
          <div className="song-info">
            <span className="song-name">No track loaded</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      className={`draggable-song ${isPlaying ? 'playing' : ''} ${isRanked ? 'ranked' : ''}`}
      draggable={canDrag && !isRanked}
      style={{ cursor: canDrag && !isRanked ? 'grab' : 'default', opacity: isRanked ? 0.5 : 1 }}
    >
      <div className="song-content">
        <span className="song-icon">{isPlaying ? '🔊' : '🎵'}</span>
        <div className="song-info">
          <span className="song-name">{track.name}</span>
          <span className="song-artist">
            {track.artists.map((a) => a.name).join(', ')}
          </span>
        </div>
        {!canDrag && <span className="song-drag-hint">Song locked</span>}
        {isRanked && <span className="song-drag-hint">Ranked!</span>}
      </div>
    </div>
  );
};