import React from 'react';
import './ScoreDisplay.css';

interface ScoreDisplayProps {
  score: number;
  totalRounds: number;
  currentRound: number;
}

export const ScoreDisplay: React.FC<ScoreDisplayProps> = ({ score, totalRounds, currentRound }) => {
  return (
    <div className="score-display">
      <div className="score-main">
        <span className="score-value">{score}</span>
        <span className="score-divider">/</span>
        <span className="score-total">{totalRounds}</span>
      </div>
      <div className="round-indicator">
        Round {Math.min(currentRound, totalRounds)} of {totalRounds}
      </div>
    </div>
  );
};