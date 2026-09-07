import axios from 'axios'
import type { SpotifyProfile, SpotifyTrack } from '../types/spotify'

const AUTHORIZE_URL = 'https://accounts.spotify.com/authorize'
const TOKEN_URL = 'https://accounts.spotify.com/api/token'
const RECENTLY_PLAYED_URL = 'https://api.spotify.com/v1/me/player/recently-played'
const PROFILE_URL = 'https://api.spotify.com/v1/me'
const VERIFIER_KEY = 'spotify_pkce_verifier'
const STATE_KEY = 'spotify_oauth_state'
const TOKEN_KEY = 'spotify_tokens'
const CLIENT_ID_KEY = 'spotify_client_id'

interface SpotifyTokenResponse {
  access_token: string
  refresh_token?: string
  expires_in: number
}

interface StoredSpotifyTokens {
  accessToken: string
  refreshToken: string | null
  expiresAt: number
}

interface SpotifyRecentlyPlayedResponse {
  items: Array<{
    played_at: string
    track: {
      id: string
      name: string
      duration_ms: number
      artists: Array<{ name: string }>
      album: {
        name: string
        images: Array<{ url: string }>
      }
      external_urls: {
        spotify: string
      }
    }
  }>
}

interface SpotifyProfileResponse {
  display_name: string | null
  images: Array<{ url: string }>
  external_urls: {
    spotify: string
  }
}

export const getSpotifyClientId = (): string =>
  import.meta.env.VITE_SPOTIFY_CLIENT_ID?.trim()
  || localStorage.getItem(CLIENT_ID_KEY)?.trim()
  || ''

export const saveSpotifyClientId = (clientId: string): void => {
  localStorage.setItem(CLIENT_ID_KEY, clientId.trim())
}

export const getSpotifyRedirectUri = (): string => `${window.location.origin}/`

export const isSpotifyRedirectUriSupported = (): boolean =>
  window.location.protocol === 'https:'
  || window.location.hostname === '127.0.0.1'
  || window.location.hostname === '[::1]'

export const isSpotifyConnected = (): boolean => readTokens() !== null

export const beginSpotifyAuthorization = async (
  clientId: string,
  redirectUri: string,
): Promise<void> => {
  const verifier = createRandomValue(64)
  const state = createRandomValue(32)
  const challenge = await createCodeChallenge(verifier)

  sessionStorage.setItem(VERIFIER_KEY, verifier)
  sessionStorage.setItem(STATE_KEY, state)

  const parameters = new URLSearchParams({
    client_id: clientId,
    response_type: 'code',
    redirect_uri: redirectUri,
    scope: 'user-read-recently-played user-read-private',
    code_challenge_method: 'S256',
    code_challenge: challenge,
    state,
  })

  window.location.assign(`${AUTHORIZE_URL}?${parameters}`)
}

export const completeSpotifyAuthorization = async (
  clientId: string,
  redirectUri: string,
  parameters: URLSearchParams,
): Promise<boolean> => {
  const code = parameters.get('code')
  if (!code) return false

  const expectedState = sessionStorage.getItem(STATE_KEY)
  const returnedState = parameters.get('state')
  const verifier = sessionStorage.getItem(VERIFIER_KEY)
  if (!expectedState || returnedState !== expectedState || !verifier) {
    throw new Error('Spotify authorization state is invalid or expired.')
  }

  const response = await axios.post<SpotifyTokenResponse>(
    TOKEN_URL,
    new URLSearchParams({
      client_id: clientId,
      grant_type: 'authorization_code',
      code,
      redirect_uri: redirectUri,
      code_verifier: verifier,
    }),
    {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
    },
  )

  storeTokens(response.data)
  sessionStorage.removeItem(VERIFIER_KEY)
  sessionStorage.removeItem(STATE_KEY)
  return true
}

export const fetchRecentlyPlayed = async (
  clientId: string,
): Promise<SpotifyTrack[]> => {
  const accessToken = await getAccessToken(clientId)
  if (!accessToken) {
    throw new Error('Spotify is not connected.')
  }

  const response = await axios.get<SpotifyRecentlyPlayedResponse>(
    RECENTLY_PLAYED_URL,
    {
      params: { limit: 10 },
      headers: { Authorization: `Bearer ${accessToken}` },
    },
  )

  return response.data.items.map(({ played_at: playedAt, track }) => ({
    id: track.id,
    title: track.name,
    artist: track.artists.map((artist) => artist.name).join(', '),
    album: track.album.name,
    imageUrl: track.album.images[0]?.url ?? null,
    playedAt,
    spotifyUrl: track.external_urls.spotify,
    durationMs: track.duration_ms,
  }))
}

export const fetchSpotifyProfile = async (
  clientId: string,
): Promise<SpotifyProfile> => {
  const accessToken = await getAccessToken(clientId)
  if (!accessToken) {
    throw new Error('Spotify is not connected.')
  }

  const response = await axios.get<SpotifyProfileResponse>(PROFILE_URL, {
    headers: { Authorization: `Bearer ${accessToken}` },
  })

  return {
    displayName: response.data.display_name ?? 'Spotify user',
    imageUrl: response.data.images[0]?.url ?? null,
    spotifyUrl: response.data.external_urls.spotify,
  }
}

export const disconnectSpotify = (): void => {
  sessionStorage.removeItem(TOKEN_KEY)
  sessionStorage.removeItem(VERIFIER_KEY)
  sessionStorage.removeItem(STATE_KEY)
}

const getAccessToken = async (clientId: string): Promise<string | null> => {
  const tokens = readTokens()
  if (!tokens) return null
  if (tokens.expiresAt > Date.now() + 30_000) return tokens.accessToken
  if (!tokens.refreshToken) {
    disconnectSpotify()
    return null
  }

  const response = await axios.post<SpotifyTokenResponse>(
    TOKEN_URL,
    new URLSearchParams({
      client_id: clientId,
      grant_type: 'refresh_token',
      refresh_token: tokens.refreshToken,
    }),
    {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
    },
  )

  storeTokens({
    ...response.data,
    refresh_token: response.data.refresh_token ?? tokens.refreshToken,
  })
  return response.data.access_token
}

const storeTokens = (tokens: SpotifyTokenResponse): void => {
  const storedTokens: StoredSpotifyTokens = {
    accessToken: tokens.access_token,
    refreshToken: tokens.refresh_token ?? null,
    expiresAt: Date.now() + tokens.expires_in * 1000,
  }
  sessionStorage.setItem(TOKEN_KEY, JSON.stringify(storedTokens))
}

const readTokens = (): StoredSpotifyTokens | null => {
  const value = sessionStorage.getItem(TOKEN_KEY)
  if (!value) return null

  try {
    return JSON.parse(value) as StoredSpotifyTokens
  } catch (error) {
    sessionStorage.removeItem(TOKEN_KEY)
    console.error('Invalid Spotify token data:', error)
    return null
  }
}

const createRandomValue = (length: number): string => {
  const bytes = crypto.getRandomValues(new Uint8Array(length))
  return toBase64Url(bytes)
}

const createCodeChallenge = async (verifier: string): Promise<string> => {
  const digest = await crypto.subtle.digest(
    'SHA-256',
    new TextEncoder().encode(verifier),
  )
  return toBase64Url(new Uint8Array(digest))
}

const toBase64Url = (bytes: Uint8Array): string => {
  let binary = ''
  bytes.forEach((byte) => {
    binary += String.fromCharCode(byte)
  })
  return btoa(binary)
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '')
}
