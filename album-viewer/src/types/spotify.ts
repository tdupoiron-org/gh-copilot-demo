export interface SpotifyTrack {
  id: string
  title: string
  artist: string
  album: string
  imageUrl: string | null
  playedAt: string
  spotifyUrl: string
  durationMs: number
}

export interface SpotifyProfile {
  displayName: string
  imageUrl: string | null
  spotifyUrl: string
}
