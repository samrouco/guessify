import React, { useState } from 'react';
import { Sidebar } from '../components';
import './SelectionPage.css';

type SearchType = 'artist' | 'playlist' | 'album';

interface TierListSelectionPageProps {
  onSelectType: (type: SearchType) => void;
  onBack: () => void;
}

export const TierListSelectionPage: React.FC<TierListSelectionPageProps> = ({ onSelectType, onBack }) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="selection-page">
      <button className="settings-button" onClick={() => setSidebarOpen(true)}>
        ⚙
      </button>
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <button className="back-button" onClick={onBack} title="Back to landing">
        ←
      </button>
      <h1 className="selection-title">Tier List</h1>
      <p className="selection-subtitle">Choose a category to rank</p>
      <div className="selection-cards">
        <button
          className="selection-card"
          onClick={() => onSelectType('artist')}
        >
          <span className="card-icon">🎤</span>
          <span className="card-label">Artists</span>
        </button>
        <button
          className="selection-card"
          onClick={() => onSelectType('playlist')}
        >
          <span className="card-icon">📋</span>
          <span className="card-label">Playlists</span>
        </button>
        <button
          className="selection-card"
          onClick={() => onSelectType('album')}
        >
          <span className="card-icon">💿</span>
          <span className="card-label">Albums</span>
        </button>
        <button
          className="selection-card selection-card--disabled"
          onClick={() => {}}
          disabled
          title="Coming soon"
        >
          <span className="card-icon">🎛</span>
          <span className="card-label">Custom</span>
          <span className="card-soon">Soon</span>
        </button>
      </div>
    </div>
  );
};