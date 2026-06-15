import React from 'react';
import { useTierList } from '../context/TierListContext';
import './TierListResultsPage.css';

interface TierListResultsPageProps {
  onPlayAgain: () => void;
  onBack: () => void;
}

export const TierListResultsPage: React.FC<TierListResultsPageProps> = ({ onPlayAgain, onBack }) => {
  const { state } = useTierList();

  const getRankLabel = (rank: number) => {
    const labels: Record<number, string> = {
      1: 'S',
      2: 'A',
      3: 'B',
      4: 'C',
      5: 'D',
    };
    return labels[rank] || rank.toString();
  };

  const getRankColor = (rank: number) => {
    const colors: Record<number, string> = {
      1: '#FFD700',
      2: '#1DB954',
      3: '#1DB954',
      4: '#1DB954',
      5: '#1DB954',
    };
    return colors[rank] || '#1DB954';
  };

  return (
    <div className="tierlist-results-page">
      <h1 className="results-title">Your Tier List</h1>
      <p className="results-subtitle">{state.selectedItem?.name}</p>

      <div className="tier-results">
        {[1, 2, 3, 4, 5].map((rank) => {
          const entry = Object.entries(state.rankings).find(([, r]) => r === rank);
          const track = entry ? state.tracks.find((t) => t.id === entry[0]) : null;

          return (
            <div key={rank} className="tier-result-row">
              <div
                className="tier-rank-badge"
                style={{ backgroundColor: getRankColor(rank) }}
              >
                {getRankLabel(rank)}
              </div>
              <div className="tier-track-info">
                {track ? (
                  <>
                    <span className="tier-track-name">{track.name}</span>
                    <span className="tier-track-artist">
                      {track.artists.map((a) => a.name).join(', ')}
                    </span>
                  </>
                ) : (
                  <span className="tier-empty">-</span>
                )}
              </div>
            </div>
          );
        })}
      </div>

      <div className="results-actions">
        <button className="action-button secondary" onClick={onBack}>
          ← Back
        </button>
        <button className="action-button primary" onClick={onPlayAgain}>
          Play Again
        </button>
      </div>
    </div>
  );
};