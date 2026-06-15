import React, { useState } from 'react';
import { Sidebar } from '../components';
import './LandingPage.css';

interface LandingPageProps {
  onSelectGuess: () => void;
  onSelectTierList: () => void;
}

export const LandingPage: React.FC<LandingPageProps> = ({ onSelectGuess, onSelectTierList }) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="landing-page">
      <button className="settings-button" onClick={() => setSidebarOpen(true)}>
        ⚙
      </button>
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <h1 className="landing-title">Guessify</h1>
      <p className="landing-subtitle">Choose your game mode</p>
      <div className="mode-cards">
        <button className="mode-card mode-card--guess" onClick={onSelectGuess}>
          <span className="mode-icon">🎵</span>
          <span className="mode-label">Guess</span>
          <span className="mode-description">Identify songs from snippets</span>
        </button>
        <button className="mode-card mode-card--tierlist" onClick={onSelectTierList}>
          <span className="mode-icon">📊</span>
          <span className="mode-label">Tier List</span>
          <span className="mode-description">Rank your favorite tracks</span>
        </button>
      </div>
    </div>
  );
};