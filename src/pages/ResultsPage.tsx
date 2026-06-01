import React from 'react';
import { useGame } from '../context/GameContext';
import { Artist, Playlist, Album, Track } from '../types';
import { getListenTime } from '../components';
import './ResultsPage.css';

interface ResultsPageProps {
  onPlayAgain: () => void;
}

const formatTime = (ms: number): string => {
  const totalSeconds = Math.floor(ms / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${seconds.toString().padStart(2, '0')}`;
};

export const ResultsPage: React.FC<ResultsPageProps> = ({ onPlayAgain }) => {
  const { state, reset } = useGame();
  const percentage = Math.round((state.score / state.rounds.length) * 100);

  const getMessage = () => {
    if (percentage === 100) return 'Perfect Score!';
    if (percentage >= 80) return 'Excellent!';
    if (percentage >= 60) return 'Good Job!';
    if (percentage >= 40) return 'Not Bad';
    return 'Keep Practicing';
  };

  const getEmoji = () => {
    if (percentage === 100) return '🏆';
    if (percentage >= 80) return '🌟';
    if (percentage >= 60) return '👏';
    if (percentage >= 40) return '🎵';
    return '🎧';
  };

  const handlePlayAgain = () => {
    reset();
    onPlayAgain();
  };

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
    return state.selectedItem?.name || '';
  };

  const getArtistNames = (track: Track) => {
    return track.artists.map((a) => a.name).join(', ');
  };

  const formatMaxListenTime = (trackDurationMs: number) => {
    const listenTime = getListenTime();
    if (listenTime === 'infinite') return formatTime(trackDurationMs);
    return `${listenTime}s`;
  };

  return (
    <div className="results-page">
      <div className="results-header">
        <span className="result-emoji">{getEmoji()}</span>
        <h1 className="result-title">{getMessage()}</h1>
        <div className="score-row">
          <div className="score-circle-mini">
            <span className="final-score">{state.score}</span>
            <span className="score-separator">/</span>
            <span className="final-total">{state.rounds.length}</span>
          </div>
          <span className="score-percentage">{percentage}%</span>
        </div>
        {state.selectedItem && (
          <div className="artist-info">
            <img src={getItemImage()} alt={getItemName()} className="artist-image" />
            <span className="artist-name">{getItemName()}</span>
          </div>
        )}
      </div>

      <div className="recap-container">
        <h2 className="recap-title">Game Recap</h2>
        <div className="recap-list">
          {state.rounds.map((round) => {
            const selectedTrack = round.options.find((t) => t.id === round.selectedTrackId);
            const isCorrect = round.isCorrect;
            return (
              <div key={round.roundNumber} className={`recap-item ${isCorrect ? 'correct' : 'wrong'}`}>
                <div className="recap-round-badge">{round.roundNumber}</div>
                <div className="recap-track-info">
                  <div className="recap-song-name">{round.correctTrack.name}</div>
                  <div className="recap-artist-name">{getArtistNames(round.correctTrack)}</div>
                </div>
                <div className="recap-answer">
                  {selectedTrack && (
                    <span className={`recap-choice ${isCorrect ? 'correct' : 'wrong'}`}>
                      {selectedTrack.name}
                    </span>
                  )}
                  {!isCorrect && selectedTrack && (
                    <span className="recap-correct-label">✓ {round.correctTrack.name}</span>
                  )}
                </div>
                <div className="recap-timing">
                  <span className="recap-time-total">{formatTime(round.totalTimeMs)}</span>
                  <span className="recap-time-listen">{formatTime(round.listenTimeMs)} / {formatMaxListenTime(round.correctTrack.duration_ms)}</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="results-actions">
        <button className="primary-button" onClick={handlePlayAgain}>Play Again</button>
      </div>
    </div>
  );
};