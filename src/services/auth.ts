const CLIENT_ID = import.meta.env.VITE_SPOTIFY_CLIENT_ID || '';
const REDIRECT_URI = import.meta.env.VITE_REDIRECT_URI || window.location.origin;
const SCOPES = ['streaming', 'user-read-email', 'user-read-private', 'user-library-modify'];

const generateCodeVerifier = () => {
  const array = new Uint8Array(32);
  crypto.getRandomValues(array);
  return btoa(String.fromCharCode(...array))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=/g, '');
};

const generateCodeChallenge = async (verifier: string) => {
  const encoder = new TextEncoder();
  const data = encoder.encode(verifier);
  const digest = await crypto.subtle.digest('SHA-256', data);
  return btoa(String.fromCharCode(...new Uint8Array(digest)))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=/g, '');
};

export const getAuthUrl = async () => {
  const verifier = generateCodeVerifier();
  const challenge = await generateCodeChallenge(verifier);
  sessionStorage.setItem('pkce_verifier', verifier);

  const params = new URLSearchParams({
    client_id: CLIENT_ID,
    response_type: 'code',
    redirect_uri: REDIRECT_URI,
    scope: SCOPES.join(' '),
    show_dialog: 'true',
    code_challenge_method: 'S256',
    code_challenge: challenge,
  });
  return `https://accounts.spotify.com/authorize?${params.toString()}`;
};

export const getTokenFromUrl = () => {
  const params = new URLSearchParams(window.location.search);
  return params.get('code');
};

export const clearTokenFromUrl = () => {
  window.history.replaceState(null, '', window.location.pathname);
};

export const exchangeCodeForToken = async (code: string) => {
  const verifier = sessionStorage.getItem('pkce_verifier');
  if (!verifier) throw new Error('No PKCE verifier found');

  const response = await fetch('https://accounts.spotify.com/api/token', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams({
      client_id: CLIENT_ID,
      grant_type: 'authorization_code',
      code,
      redirect_uri: REDIRECT_URI,
      code_verifier: verifier,
    }),
  });

  if (!response.ok) throw new Error('Failed to exchange code for token');
  const data = await response.json();

  localStorage.setItem('spotify_token', data.access_token);
  localStorage.setItem('spotify_token_expires', (Date.now() + data.expires_in * 1000).toString());
  localStorage.setItem('spotify_refresh_token', data.refresh_token);

  sessionStorage.removeItem('pkce_verifier');
  return data.access_token;
};

export const isAuthenticated = () => {
  const token = localStorage.getItem('spotify_token');
  if (!token) return false;
  const expiresAt = localStorage.getItem('spotify_token_expires');
  if (!expiresAt) return false;
  return Date.now() < parseInt(expiresAt, 10);
};

export const logout = () => {
  localStorage.removeItem('spotify_token');
  localStorage.removeItem('spotify_token_expires');
  localStorage.removeItem('spotify_refresh_token');
};