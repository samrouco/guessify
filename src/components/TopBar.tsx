import { logout } from '../services/auth';
import './TopBar.css';

const LogoIcon = () => (
  <svg viewBox="0 0 24 24" fill="currentColor">
    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
  </svg>
);

interface TopBarProps {
  onLogoClick?: () => void;
}

export const TopBar: React.FC<TopBarProps> = ({ onLogoClick }) => {
  return (
    <div className="topbar">
      <button className="topbar-logo" onClick={onLogoClick}>
        <LogoIcon />
        GUESSIFY
      </button>
      <div className="topbar-user">
        <div className="user-placeholder">
          <span className="user-icon">🎮</span>
          <span className="user-name">Player</span>
        </div>
        <button onClick={logout} className="logout-btn" title="Logout">
          ⏻
        </button>
      </div>
    </div>
  );
};