import React, { useState } from 'react';
import { Sidebar } from '../components';
import './SelectionPage.css';

type SearchType = 'artist' | 'playlist' | 'album';

interface SelectionPageProps {
  onSelectType: (type: SearchType) => void;
}

export const SelectionPage: React.FC<SelectionPageProps> = ({ onSelectType }) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="selection-page">
      <button className="settings-button" onClick={() => setSidebarOpen(true)}>
        ⚙
      </button>
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <h1 className="selection-title">Guessify</h1>
      <p className="selection-subtitle">What do you want to play?</p>
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
      </div>
    </div>
  );
};
