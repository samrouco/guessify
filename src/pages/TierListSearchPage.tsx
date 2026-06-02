import React, { useCallback } from 'react';
import { SearchPage } from './SearchPage';
import { SearchResult, SearchType } from '../types';
import './TierListSearchPage.css';

interface TierListSearchPageProps {
  searchType: SearchType;
  onSelectItem: (item: SearchResult) => void;
  onBack: () => void;
}

export const TierListSearchPage: React.FC<TierListSearchPageProps> = ({
  searchType,
  onSelectItem,
  onBack,
}) => {
  const handleBack = useCallback(() => {
    onBack();
  }, [onBack]);

  return (
    <div className="tierlist-search-page">
      <button className="back-to-selection" onClick={handleBack}>
        ← Back to Selection
      </button>
      <SearchPage
        onSelectItem={onSelectItem}
        searchType={searchType}
        mode="tierlist"
      />
    </div>
  );
};