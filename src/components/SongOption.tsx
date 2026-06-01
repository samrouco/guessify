import React from 'react';
import { Track } from '../types';
import './SongOption.css';

interface SongOptionProps {
  track: Track;
  onClick: () => void;
  isSelected: boolean | null;
  isCorrect: boolean | null;
  disabled: boolean;
}

export const SongOption: React.FC<SongOptionProps> = ({
  track,
  onClick,
  isSelected,
  isCorrect,
  disabled,
}) => {
  const getClassName = () => {
    const classes = ['song-option'];
    if (isCorrect === true) classes.push('correct');
    else if (isSelected === true && isCorrect === false) classes.push('incorrect');
    return classes.join(' ');
  };

  return (
    <button
      className={getClassName()}
      onClick={onClick}
      disabled={disabled}
    >
      <span className="song-name">{track.name}</span>
      <span className="song-artist">{track.artists.map((a) => a.name).join(', ')}</span>
    </button>
  );
};