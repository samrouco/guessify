import { Artist, Playlist, Album, Track, SearchType } from '../types';

const BASE_URL = 'https://api.spotify.com/v1';

const getHeaders = () => {
  const token = localStorage.getItem('spotify_token');
  return {
    Authorization: `Bearer ${token}`,
    'Content-Type': 'application/json',
  };
};

export const searchArtists = async (query: string): Promise<Artist[]> => {
  const response = await fetch(
    `${BASE_URL}/search?q=${encodeURIComponent(query)}&type=artist&limit=10`,
    { headers: getHeaders() }
  );
  if (!response.ok) throw new Error('Failed to search artists');
  const data = await response.json();
  return data.artists.items.filter((a: Artist) => a.images.length > 0);
};

export const searchPlaylists = async (query: string): Promise<Playlist[]> => {
  const response = await fetch(
    `${BASE_URL}/search?q=${encodeURIComponent(query)}&type=playlist&limit=10`,
    { headers: getHeaders() }
  );
  if (!response.ok) throw new Error('Failed to search playlists');
  const data = await response.json();
  return data.playlists.items.filter((p: Playlist) => p && p.images?.[0]?.url);
};

export const searchAlbums = async (query: string): Promise<Album[]> => {
  const response = await fetch(
    `${BASE_URL}/search?q=${encodeURIComponent(query)}&type=album&limit=10`,
    { headers: getHeaders() }
  );
  if (!response.ok) throw new Error('Failed to search albums');
  const data = await response.json();
  return data.albums.items.filter((a: Album) => a.images && a.images.length > 0);
};

export const search = async (query: string, type: SearchType): Promise<Artist[] | Playlist[] | Album[]> => {
  if (type === 'artist') return searchArtists(query);
  if (type === 'playlist') return searchPlaylists(query);
  return searchAlbums(query);
};

export const getArtistTopTracks = async (artistId: string): Promise<Track[]> => {
  const response = await fetch(
    `${BASE_URL}/artists/${artistId}/top-tracks?market=US`,
    { headers: getHeaders() }
  );
  if (!response.ok) throw new Error('Failed to get artist top tracks');
  const data = await response.json();
  return data.tracks;
};

export const getPlaylistTracks = async (playlistId: string): Promise<Track[]> => {
  const response = await fetch(
    `${BASE_URL}/playlists/${playlistId}/tracks?market=US`,
    { headers: getHeaders() }
  );
  if (!response.ok) throw new Error('Failed to get playlist tracks');
  const data = await response.json();
  return data.items
    .filter((item: { track: Track | null }) => item.track)
    .map((item: { track: Track }) => item.track);
};

export const getAlbumTracks = async (albumId: string): Promise<Track[]> => {
  const response = await fetch(
    `${BASE_URL}/albums/${albumId}/tracks?market=US`,
    { headers: getHeaders() }
  );
  if (!response.ok) throw new Error('Failed to get album tracks');
  const data = await response.json();
  return data.items;
};

const shuffleArray = <T,>(array: T[]): T[] => {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
};

interface SpotifyAlbum {
  id: string;
  name: string;
}

export const getArtistAllTracks = async (artistId: string): Promise<Track[]> => {
  const albumsResponse = await fetch(
    `${BASE_URL}/artists/${artistId}/albums?market=US&limit=20&include_groups=album,single`,
    { headers: getHeaders() }
  );
  if (!albumsResponse.ok) throw new Error('Failed to get artist albums');
  const albumsData = await albumsResponse.json();

  const shuffledAlbums = shuffleArray<SpotifyAlbum>(albumsData.items);
  const top5Albums = shuffledAlbums.slice(0, 5);

  const tracksPromises = top5Albums.map(async (album) => {
    const tracksResponse = await fetch(
      `${BASE_URL}/albums/${album.id}/tracks?market=US`,
      { headers: getHeaders() }
    );
    if (!tracksResponse.ok) return [];
    const tracksData = await tracksResponse.json();
    return tracksData.items;
  });

  const tracksArrays = await Promise.all(tracksPromises);
  const allTracks = tracksArrays.flat();

  const uniqueTracksMap = new Map<string, Track>();
  const usedNames = new Set<string>();
  allTracks.forEach((track: Track) => {
    if (!uniqueTracksMap.has(track.id) && !usedNames.has(track.name.toLowerCase())) {
      uniqueTracksMap.set(track.id, track);
      usedNames.add(track.name.toLowerCase());
    }
  });

  return shuffleArray(Array.from(uniqueTracksMap.values()));
};

export const getTracksForItem = async (item: Artist | Playlist | Album, type: SearchType): Promise<Track[]> => {
  if (type === 'artist') {
    return getArtistAllTracks((item as Artist).id);
  } else if (type === 'playlist') {
    return getPlaylistTracks((item as Playlist).id);
  } else {
    return getAlbumTracks((item as Album).id);
  }
};

export const setTrackLiked = async (trackId: string): Promise<boolean> => {
  const token = localStorage.getItem('spotify_token');
  if (!token) return false;
  const response = await fetch(`https://api.spotify.com/v1/me/tracks?ids=${trackId}`, {
    method: 'PUT',
    headers: { Authorization: `Bearer ${token}` },
  });
  return response.ok;
};