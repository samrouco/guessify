import React, { useState, useEffect } from 'react';
import { GameProvider, useGame } from './context/GameContext';
import { TierListProvider, useTierList } from './context/TierListContext';
import {
  SearchPage, GamePage, ResultsPage, SelectionPage, LandingPage,
  TierListSelectionPage, TierListSearchPage, TierListGamePage, TierListResultsPage
} from './pages';
import { TopBar } from './components';
import { getTokenFromUrl, clearTokenFromUrl, isAuthenticated, exchangeCodeForToken } from './services/auth';
import { initializePlayer } from './services/spotifyPlayer';
import { SearchType, SearchResult } from './types';
import './App.css';

type GuessPage = 'landing' | 'selection' | 'search' | 'game' | 'results';
type TierListPage = 'tierlist-selection' | 'tierlist-search' | 'tierlist-game' | 'tierlist-results';
type Page = GuessPage | TierListPage;

const AppContent: React.FC = () => {
  const { state, startGame, reset } = useGame();
  const { startTierList } = useTierList();
  const [page, setPage] = useState<Page>('landing');
  const [tierlistSearchType, setTierlistSearchType] = useState<SearchType>('artist');
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
    setTierlistSearchType(type);
    setPage('search');
  };

  const handleSelectGuess = () => {
    setPage('selection');
  };

  const handleSelectTierList = () => {
    setPage('tierlist-selection');
  };

  const handleSelectItem = (item: SearchResult) => {
    startGame(item, tierlistSearchType);
    setPendingItem(item);
  };

  const handleFinishGame = () => {
    setPage('results');
  };

  const handlePlayAgain = () => {
    reset();
    setPage('landing');
  };

  const handleBackToSelection = () => {
    reset();
    setPage('landing');
  };

  const handleLogoClick = () => {
    reset();
    setPage('landing');
  };

  const handleTierlistSelectType = (type: SearchType) => {
    setTierlistSearchType(type);
    setPage('tierlist-search');
  };

  const handleTierlistBackToSelection = () => {
    setPage('tierlist-selection');
  };

  const handleTierlistSelectItem = async (item: SearchResult) => {
    await startTierList(item, tierlistSearchType);
    setPage('tierlist-game');
  };

  if (!isAuthenticated()) {
    return <SearchPage onSelectItem={handleSelectItem} searchType={tierlistSearchType} />;
  }

  if (page === 'landing') {
    return <><TopBar onLogoClick={handleLogoClick} /><LandingPage onSelectGuess={handleSelectGuess} onSelectTierList={handleSelectTierList} /></>;
  }

  if (page === 'selection') {
    return <><TopBar onLogoClick={handleLogoClick} /><SelectionPage onSelectType={handleSelectType} /></>;
  }

  if (page === 'search') {
    return <><TopBar onLogoClick={handleLogoClick} /><SearchPage onSelectItem={handleSelectItem} searchType={tierlistSearchType} mode="guess" /></>;
  }

  if (page === 'game' || pendingItem) {
    return <><TopBar onLogoClick={handleLogoClick} /><GamePage onFinish={handleFinishGame} onBackToSelection={handleBackToSelection} /></>;
  }

  if (page === 'results') {
    return <><TopBar onLogoClick={handleLogoClick} /><ResultsPage onPlayAgain={handlePlayAgain} /></>;
  }

  if (page === 'tierlist-selection') {
    return <><TopBar onLogoClick={handleLogoClick} /><TierListSelectionPage onSelectType={handleTierlistSelectType} onBack={handleBackToSelection} /></>;
  }

  if (page === 'tierlist-search') {
    return <><TopBar onLogoClick={handleLogoClick} /><TierListSearchPage searchType={tierlistSearchType} onSelectItem={handleTierlistSelectItem} onBack={handleTierlistBackToSelection} /></>;
  }

  if (page === 'tierlist-game') {
    return <><TopBar onLogoClick={handleLogoClick} /><TierListGamePage onFinish={() => setPage('tierlist-results')} onBackToSelection={handleTierlistBackToSelection} /></>;
  }

  if (page === 'tierlist-results') {
    return <><TopBar onLogoClick={handleLogoClick} /><TierListResultsPage onPlayAgain={handlePlayAgain} onBack={() => setPage('tierlist-selection')} /></>;
  }

  return <><TopBar onLogoClick={handleLogoClick} /><SearchPage onSelectItem={handleSelectItem} searchType={tierlistSearchType} /></>;
};

const App: React.FC = () => {
  return (
    <GameProvider>
      <TierListProvider>
        <AppContent />
      </TierListProvider>
    </GameProvider>
  );
};

export default App;