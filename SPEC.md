# Guessify - Spotify Artist Guessing Game

## Concept & Vision

A sleek, arcade-inspired music guessing game where players identify songs from their favorite Spotify artists after hearing a short preview. The experience feels like a retro game show meets modern music streaming—competitive, fast-paced, and rewarding. Dark theme with vibrant neon accents creates an immersive late-night gaming vibe.

## Design Language

### Aesthetic Direction
Retro arcade meets modern minimalism. Think neon signs in a dark room, CRT glow effects, but with clean contemporary typography.

### Color Palette
- **Primary**: `#1DB954` (Spotify Green)
- **Secondary**: `#191414` (Spotify Black)
- **Accent**: `#FF6B6B` (Correct/Correct - coral red)
- **Background**: `#121212` (Deep black)
- **Surface**: `#282828` (Card backgrounds)
- **Text Primary**: `#FFFFFF`
- **Text Secondary**: `#B3B3B3`
- **Error**: `#FF5252`
- **Neon Glow**: `#00FFFF` (cyan for highlights)

### Typography
- **Headings**: 'Orbitron', sans-serif (futuristic, arcade feel)
- **Body**: 'Inter', sans-serif (clean, readable)

### Motion Philosophy
- Quick, snappy transitions (150-200ms)
- Pulse animations for correct/incorrect feedback
- Subtle glow effects on hover
- Score counter animations on point gain

## Layout & Structure

### Pages
1. **Home/Search** - Artist search with autocomplete, "Start Game" CTA
2. **Game** - 5-round gameplay loop with playback and guessing
3. **Results** - Final score, performance summary, "Play Again" option

### Visual Pacing
- Search page: Centered, focused, minimal distractions
- Game page: Song options prominent, score visible but not distracting
- Results page: Celebration/consolation messaging, clear next steps

## Features & Interactions

### Artist Search
- Text input with debounced search (300ms)
- Shows artist results with image and name
- Click artist to select and proceed to game

### Game Flow (5 Rounds)
1. Random song from artist starts playing via Spotify Web Playback SDK
2. 5 song title options displayed (1 correct, 4 random from same artist)
3. Player clicks to guess
4. Immediate feedback: green pulse for correct, red shake for incorrect
5. 1 second delay, then next round auto-starts
6. After round 5, show results

### Scoring
- +1 point per correct answer
- Final score out of 5
- No negative scoring

### Edge Cases
- If artist has < 5 songs: show error, return to search
- If playback fails: retry or skip song
- If no preview available: skip to next song

## Component Inventory

### SearchInput
- States: empty, typing, loading, with results
- Glow effect on focus

### ArtistCard
- Shows: thumbnail, name
- Hover: scale up, glow border

### SongOptionButton
- States: default, hover, selected-correct, selected-incorrect, disabled
- Correct: green background, pulse animation
- Incorrect: red background, shake animation

### ScoreDisplay
- Shows current score and round number
- Animates on score change

### PlayButton
- Large CTA with glow effect
- Disabled state while playing

## Technical Approach

### Stack
- **Framework**: React 18 + Vite + TypeScript
- **Styling**: CSS Modules (scoped, maintainable)
- **State**: React Context + useReducer (scales to global state for DB later)
- **Spotify**: Web Playback SDK, Spotify Web API

### Spotify Integration
- Web Playback SDK for audio playback
- Web API for: search artists, get artist's top tracks
- OAuth with implicit grant (PKCE not needed for browser-only)
- **Note**: When fetching tracks (especially from playlists), do NOT filter by `preview_url`. It is assumed users have Spotify Premium, so full track playback is available via the Web Playback SDK.

### File Structure
```
src/
  components/     # Reusable UI components
  context/        # Game state context
  hooks/          # Custom hooks (useSpotify, useGame)
  pages/          # Page components
  services/       # Spotify API calls
  types/          # TypeScript interfaces
  utils/          # Helper functions
  App.tsx
  main.tsx
```

### Future DB Schema (for scaling)
```
games: id, artist_id, artist_name, score, total_rounds, played_at
players: id, spotify_user_id, display_name
high_scores: player_id, artist_id, high_score
```