import React, { useState, useEffect } from 'react';
import { GameProvider, useGame } from './context/GameContext';
import { SearchPage, GamePage, ResultsPage, SelectionPage } from './pages';
import { getTokenFromUrl, clearTokenFromUrl, isAuthenticated, exchangeCodeForToken } from './services/auth';
import { initializePlayer } from './services/spotifyPlayer';
import { SearchType, SearchResult } from './types';
import './App.css';

const AppContent: React.FC = () => {
  const { state, startGame, reset } = useGame();
  const [page, setPage] = useState<'selection' | 'search' | 'game' | 'results'>('selection');
  const [searchType, setSearchType] = useState<SearchType>('artist');
  const [pendingItem, setPendingItem] = useState<SearchResult | null>(null);
  const [, setIsPlayerReady] = useState(false);

  useEffect(() => {
    const code = getTokenFromUrl();
    const init = async () => {
      if (code) {
        try {
          await exchangeCodeForToken(code);
          clearTokenFromUrl();
        } catch (e) {
          console.error('Token exchange failed:', e);
        }
      }
      if (isAuthenticated()) {
        try {
          await initializePlayer(() => setIsPlayerReady(true));
        } catch (e) {
          console.error('Player init failed:', e);
        }
      }
    };
    init();
  }, []);

  useEffect(() => {
    if (pendingItem && state.status === 'playing') {
      setPage('game');
      setPendingItem(null);
    }
  }, [pendingItem, state.status]);

  const handleSelectType = (type: SearchType) => {
    setSearchType(type);
    setPage('search');
  };

  const handleSelectItem = (item: SearchResult) => {
    startGame(item, searchType);
    setPendingItem(item);
  };

  const handleFinishGame = () => {
    setPage('results');
  };

  const handlePlayAgain = () => {
    setPage('selection');
  };

  const handleBackToSelection = () => {
    reset();
    setPage('selection');
  };

  if (!isAuthenticated()) {
    return <SearchPage onSelectItem={handleSelectItem} searchType={searchType} />;
  }

  if (page === 'selection') {
    return <SelectionPage onSelectType={handleSelectType} />;
  }

  if (page === 'results') {
    return <ResultsPage onPlayAgain={handlePlayAgain} />;
  }

  if (page === 'game' || pendingItem) {
    return <GamePage onFinish={handleFinishGame} onBackToSelection={handleBackToSelection} />;
  }

  return <SearchPage onSelectItem={handleSelectItem} searchType={searchType} />;
};

const App: React.FC = () => {
  return (
    <GameProvider>
      <AppContent />
    </GameProvider>
  );
};

export default App;