declare global {
  interface Window {
    onSpotifyWebPlaybackSDKReady: () => void;
    Spotify: {
      Player: new (options: {
        name: string;
        getOAuthToken: (cb: (token: string) => void) => void;
        volume: number;
      }) => SpotifyPlayer;
    };
  }
}

export interface SpotifyPlayer {
  connect: () => Promise<boolean>;
  disconnect: () => void;
  addListener: (event: string, cb: (info: unknown) => void) => void;
  removeListener: (event: string) => void;
  getCurrentState: () => Promise<{ position: number; duration: number } | null>;
  setVolume: (volume: number) => Promise<void>;
  pause: () => Promise<void>;
  resume: () => Promise<void>;
  seek: (positionMs: number) => Promise<void>;
  togglePlay: () => Promise<void>;
}

let player: SpotifyPlayer | null = null;
let deviceId: string | null = null;

export const initializePlayer = (onReady: () => void) => {
  return new Promise<void>((resolve) => {
    const script = document.createElement('script');
    script.src = 'https://sdk.scdn.co/spotify-player.js';
    document.head.appendChild(script);

    window.onSpotifyWebPlaybackSDKReady = () => {
      const token = localStorage.getItem('spotify_token');
      if (!token) {
        resolve();
        return;
      }

      player = new window.Spotify.Player({
        name: 'Guessify',
        getOAuthToken: (cb) => cb(token),
        volume: 0.5,
      });

      player.addListener('ready', (info: unknown) => {
        const { device_id } = info as { device_id: string };
        deviceId = device_id;
        onReady();
        resolve();
      });

      player.addListener('not_ready', () => {
        resolve();
      });

      player.addListener('initialization_error', (info: unknown) => {
        const { message } = info as { message: string };
        console.error('Initialization error:', message);
      });

      player.addListener('authentication_error', (info: unknown) => {
        const { message } = info as { message: string };
        console.error('Authentication error:', message);
      });

      player.addListener('account_error', (info: unknown) => {
        const { message } = info as { message: string };
        console.error('Account error:', message);
      });

      player.connect();
    };
  });
};

const getToken = () => localStorage.getItem('spotify_token');

const transferPlayback = async (targetDeviceId: string) => {
  const token = getToken();
  if (!token) return;

  await fetch('https://api.spotify.com/v1/me/player', {
    method: 'PUT',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      device_ids: [targetDeviceId],
      play: true,
    }),
  });
};

export const playTrack = async (uri: string, startPositionMs?: number) => {
  if (!player || !deviceId) return;
  const token = getToken();
  if (!token) return;

  await transferPlayback(deviceId);

  const body: { uris: string[]; position_ms?: number } = { uris: [uri] };
  if (startPositionMs !== undefined) {
    body.position_ms = startPositionMs;
  }

  await fetch(`https://api.spotify.com/v1/me/player/play?device_id=${deviceId}`, {
    method: 'PUT',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  });
};

export const seekTrack = async (positionMs: number) => {
  if (!player) return;
  await player.seek(positionMs);
};

export const pauseTrack = async () => {
  if (!player) return;
  await player.pause();
};

export const resumeTrack = async () => {
  if (!player) return;
  await player.resume();
};

export const setVolume = async (volume: number) => {
  if (!deviceId) return;
  const token = getToken();
  if (!token) return;
  await fetch(`https://api.spotify.com/v1/me/player/volume?volume_percent=${Math.round(volume * 100)}&device_id=${deviceId}`, {
    method: 'PUT',
    headers: { Authorization: `Bearer ${token}` },
  });
};

export const getPlayer = () => player;
export const getDeviceId = () => deviceId;