import React, { useState, useEffect, useRef } from 'react';
import { search } from '../services/spotifyApi';
import { SearchResult, SearchType, Artist, Playlist, Album } from '../types';
import './SearchInput.css';

interface SearchInputProps {
  onSelectItem: (item: SearchResult) => void;
  searchType: SearchType;
  disabled: boolean;
}

const PLACEHOLDERS: Record<SearchType, string> = {
  artist: 'Search for an artist...',
  playlist: 'Search for a playlist...',
  album: 'Search for an album...',
};

export const SearchInput: React.FC<SearchInputProps> = ({ onSelectItem, searchType, disabled }) => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (query.length < 2) {
      setResults([]);
      setShowResults(false);
      return;
    }
    setIsLoading(true);
    debounceRef.current = setTimeout(async () => {
      try {
        const searchResults = await search(query, searchType);
        setResults(searchResults);
        setShowResults(true);
      } catch {
        setResults([]);
      } finally {
        setIsLoading(false);
      }
    }, 300);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [query, searchType]);

  const handleSelect = (item: SearchResult) => {
    onSelectItem(item);
    setQuery('');
    setShowResults(false);
  };

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (inputRef.current && !inputRef.current.contains(e.target as Node)) {
        setShowResults(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const renderResultCard = (item: SearchResult) => {
    if (searchType === 'artist') {
      const artist = item as Artist;
      return (
        <>
          <img
            src={artist.images[0]?.url}
            alt={artist.name}
            className="result-image"
          />
          <span className="result-name">{artist.name}</span>
        </>
      );
    } else if (searchType === 'playlist') {
      const playlist = item as Playlist;
      return (
        <>
          <img
            src={playlist.images?.[0]?.url}
            alt={playlist.name}
            className="result-image"
          />
          <span className="result-name">{playlist.name}</span>
        </>
      );
    } else {
      const album = item as Album;
      return (
        <>
          <img
            src={album.images[0]?.url}
            alt={album.name}
            className="result-image"
          />
          <span className="result-name">{album.name}</span>
        </>
      );
    }
  };

  return (
    <div className="search-container" ref={inputRef}>
      <div className="search-input-wrapper">
        <input
          type="text"
          className="search-input"
          placeholder={PLACEHOLDERS[searchType]}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          disabled={disabled}
        />
        {isLoading && <div className="search-loader" />}
      </div>
      {showResults && results.length > 0 && (
        <div className="search-results">
          {results.map((item) => (
            <button
              key={item.id}
              className="result-card"
              onClick={() => handleSelect(item)}
              disabled={disabled}
            >
              {renderResultCard(item)}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};