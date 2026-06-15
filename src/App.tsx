import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, useNavigate, useLocation } from 'react-router-dom';
import { GameProvider, useGame } from './context/GameContext';
import { TierListProvider, useTierList } from './context/TierListContext';
import {
  SearchPage, GamePage, ResultsPage, SelectionPage, LandingPage,
  TierListSelectionPage, TierListSearchPage, TierListGamePage, TierListResultsPage
} from './pages';
import { TopBar } from './components';
import { getTokenFromUrl, clearTokenFromUrl, isAuthenticated, exchangeCodeForToken } from './services/auth';
import { initializePlayer } from './services/spotifyPlayer';
import { ROUTES } from './routes';
import { SearchType } from './types';
import './App.css';

const AppContent: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { state, startGame, reset } = useGame();
  const { startTierList } = useTierList();
  const [tierlistSearchType, setTierlistSearchType] = useState<SearchType>('artist');
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
    if (state.status === 'playing' && location.pathname === ROUTES.SEARCH) {
      navigate(ROUTES.GAME);
    }
  }, [state.status, location.pathname, navigate]);

  const handleLogoClick = () => {
    reset();
    navigate(ROUTES.LANDING);
  };

  if (!isAuthenticated()) {
    return <SearchPage onSelectItem={() => {}} searchType={tierlistSearchType} />;
  }

  return (
    <div className="app">
      <TopBar onLogoClick={handleLogoClick} />
      <main className="app-main">
        <Routes>
          <Route
            path={ROUTES.LANDING}
            element={
              <LandingPage
                onSelectGuess={() => navigate(ROUTES.SELECTION)}
                onSelectTierList={() => navigate(ROUTES.TIERLIST_SELECTION)}
              />
            }
          />
          <Route
            path={ROUTES.SELECTION}
            element={
              <SelectionPage
                onSelectType={(type) => {
                  setTierlistSearchType(type);
                  navigate(ROUTES.SEARCH);
                }}
              />
            }
          />
          <Route
            path={ROUTES.SEARCH}
            element={
              <SearchPage
                onSelectItem={(item) => {
                  startGame(item, tierlistSearchType);
                  navigate(ROUTES.GAME);
                }}
                searchType={tierlistSearchType}
                mode="guess"
              />
            }
          />
          <Route
            path={ROUTES.GAME}
            element={
              <GamePage
                onFinish={() => navigate(ROUTES.RESULTS)}
                onBackToSelection={() => {
                  reset();
                  navigate(ROUTES.SELECTION);
                }}
              />
            }
          />
          <Route
            path={ROUTES.RESULTS}
            element={
              <ResultsPage
                onPlayAgain={() => {
                  reset();
                  navigate(ROUTES.LANDING);
                }}
              />
            }
          />
          <Route
            path={ROUTES.TIERLIST_SELECTION}
            element={
              <TierListSelectionPage
                onSelectType={(type) => {
                  setTierlistSearchType(type);
                  navigate(ROUTES.TIERLIST_SEARCH);
                }}
                onBack={() => navigate(ROUTES.LANDING)}
              />
            }
          />
          <Route
            path={ROUTES.TIERLIST_SEARCH}
            element={
              <TierListSearchPage
                searchType={tierlistSearchType}
                onSelectItem={async (item) => {
                  await startTierList(item, tierlistSearchType);
                  navigate(ROUTES.TIERLIST_GAME);
                }}
                onBack={() => navigate(ROUTES.TIERLIST_SELECTION)}
              />
            }
          />
          <Route
            path={ROUTES.TIERLIST_GAME}
            element={
              <TierListGamePage
                onFinish={() => navigate(ROUTES.TIERLIST_RESULTS)}
                onBackToSelection={() => navigate(ROUTES.TIERLIST_SELECTION)}
              />
            }
          />
          <Route
            path={ROUTES.TIERLIST_RESULTS}
            element={
              <TierListResultsPage
                onPlayAgain={() => {
                  reset();
                  navigate(ROUTES.LANDING);
                }}
                onBack={() => navigate(ROUTES.TIERLIST_SELECTION)}
              />
            }
          />
        </Routes>
      </main>
    </div>
  );
};

const App: React.FC = () => {
  return (
    <BrowserRouter>
      <GameProvider>
        <TierListProvider>
          <AppContent />
        </TierListProvider>
      </GameProvider>
    </BrowserRouter>
  );
};

export default App;