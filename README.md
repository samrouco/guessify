# Guessify

A Spotify-based music guessing game. Guess the song from short clips, competing for the highest score.

## Setup

1. **Clone the repository**
   ```bash
   git clone <your-repo-url>
   cd guessify
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Create environment file**
   ```bash
   cp .env_template .env
   ```

4. **Configure Spotify API credentials**
   - Go to [Spotify Developer Dashboard](https://developer.spotify.com/dashboard/)
   - Create a new application
   - Add `http://127.0.0.1:5173` as a Redirect URI
   - Copy your Client ID to `.env`

5. **Start development server**
   ```bash
   npm run dev
   ```

## Tech Stack

- **Framework:** React + TypeScript + Vite
- **Styling:** CSS
- **Music API:** Spotify Web API