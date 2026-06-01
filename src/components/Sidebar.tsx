import React, { useState, useEffect } from 'react';
import './Sidebar.css';

export type ListenTime = 'infinite' | 1 | 3 | 5 | 10;

const LISTEN_TIMES: { value: ListenTime; label: string }[] = [
  { value: 'infinite', label: 'Infinite' },
  { value: 1, label: '1 second' },
  { value: 3, label: '3 seconds' },
  { value: 5, label: '5 seconds' },
  { value: 10, label: '10 seconds' },
];

const STORAGE_KEY = 'guessify_settings';

interface Settings {
  listenTime: ListenTime;
  randomStart: boolean;
}

const loadSettings = (): Settings => {
  try {
    const saved = sessionStorage.getItem(STORAGE_KEY);
    if (saved) {
      return JSON.parse(saved);
    }
  } catch {}
  return { listenTime: 'infinite', randomStart: false };
};

const saveSettings = (settings: Settings) => {
  try {
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
  } catch {}
};

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ isOpen, onClose }) => {
  const [settings, setSettings] = useState<Settings>(loadSettings);

  useEffect(() => {
    saveSettings(settings);
  }, [settings]);

  const handleListenTimeChange = (value: ListenTime) => {
    setSettings((prev) => ({ ...prev, listenTime: value }));
  };

  const handleRandomStartChange = (value: boolean) => {
    setSettings((prev) => ({ ...prev, randomStart: value }));
  };

  return (
    <>
      <div className={`sidebar-overlay ${isOpen ? 'open' : ''}`} onClick={onClose} />
      <div className={`sidebar ${isOpen ? 'open' : ''}`}>
        <div className="sidebar-header">
          <h2 className="sidebar-title">Settings</h2>
          <button className="sidebar-close" onClick={onClose}>×</button>
        </div>
        <div className="sidebar-content">
          <div className="settings-section">
            <h3 className="settings-section-title">Listen Time</h3>
            <div className="settings-options">
              {LISTEN_TIMES.map((option) => (
                <button
                  key={option.value}
                  className={`settings-option ${settings.listenTime === option.value ? 'selected' : ''}`}
                  onClick={() => handleListenTimeChange(option.value)}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </div>
          <div className="settings-section">
            <h3 className="settings-section-title">Random Start</h3>
            <button
              className={`settings-option toggle ${settings.randomStart ? 'selected' : ''}`}
              onClick={() => handleRandomStartChange(!settings.randomStart)}
            >
              {settings.randomStart ? 'On' : 'Off'}
            </button>
          </div>
        </div>
      </div>
    </>
  );
};

export const getListenTime = (): ListenTime => {
  return loadSettings().listenTime;
};

export const getRandomStart = (): boolean => {
  return loadSettings().randomStart;
};