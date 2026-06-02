import React from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
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
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: track?.id || 'no-track',
    disabled: !canDrag || isRanked || !track,
    data: { type: 'sortable' },
  });

  const style = track ? {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : isRanked ? 0.5 : 1,
    touchAction: 'none',
  } : { opacity: 0.5, cursor: 'default' };

  if (!track) {
    return (
      <div ref={setNodeRef} className="draggable-song" style={style}>
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
      ref={setNodeRef}
      className={`draggable-song ${isPlaying ? 'playing' : ''} ${isRanked ? 'ranked' : ''} ${isDragging ? 'dragging' : ''}`}
      style={{
        ...style,
        cursor: canDrag && !isRanked ? 'grab' : 'default',
      }}
      {...attributes}
      {...listeners}
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