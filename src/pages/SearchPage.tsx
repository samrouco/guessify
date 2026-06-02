import React, { useState, useEffect, useCallback } from 'react';
import { SearchInput } from '../components';
import { SearchResult, SearchType } from '../types';
import { isAuthenticated, getAuthUrl, logout } from '../services/auth';
import './SearchPage.css';

interface SearchPageProps {
  onSelectItem: (item: SearchResult) => void;
  searchType: SearchType;
  mode?: 'guess' | 'tierlist';
}

export const SearchPage: React.FC<SearchPageProps> = ({ onSelectItem, searchType, mode: _mode = 'guess' }) => {
  const [authChecked, setAuthChecked] = useState(false);
  const [isAuth, setIsAuth] = useState(false);

  useEffect(() => {
    setIsAuth(isAuthenticated());
    setAuthChecked(true);
  }, []);

  const handleConnect = useCallback(async () => {
    const url = await getAuthUrl();
    window.location.href = url;
  }, []);

  const handleSelectItem = useCallback((item: SearchResult) => {
    if (isAuthenticated()) {
      onSelectItem(item);
    } else {
      handleConnect();
    }
  }, [onSelectItem, handleConnect]);

  const handleLogout = useCallback(() => {
    logout();
    setIsAuth(false);
  }, []);

  if (!authChecked) {
    return (
      <div className="search-page">
        <div className="loading">Checking auth...</div>
      </div>
    );
  }

  if (!isAuth) {
    return (
      <div className="search-page">
        <div className="auth-required">
          <h2>Welcome to Guessify</h2>
          <p>Connect your Spotify account to play</p>
          <button onClick={handleConnect} className="spotify-button">
            Connect with Spotify
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="search-page">
      <div className="search-content">
        <div className="header-row">
          <h1 className="title">Guessify</h1>
          <button onClick={handleLogout} className="logout-button">Logout</button>
        </div>
        <p className="subtitle">Guess the song. Prove your music knowledge.</p>
        <SearchInput onSelectItem={handleSelectItem} searchType={searchType} disabled={false} />
      </div>
    </div>
  );
};