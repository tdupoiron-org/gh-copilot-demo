<template>
  <section class="spotify-panel" :class="{ 'has-active-player': activeTrack }">
    <div v-if="loading" class="spotify-message">Loading Spotify...</div>

    <div v-else-if="!configured" class="spotify-message">
      <h2>Connect your Spotify app</h2>
      <p v-if="!redirectUriSupported" class="spotify-warning">
        Spotify requires HTTPS or a loopback IP address for OAuth redirects.
        Reopen this app at
        <a :href="loopbackUrl">{{ loopbackUrl }}</a>
        before connecting.
      </p>
      <p>
        Enter the public client ID from the Spotify Developer Dashboard. Add
        <strong>{{ redirectUri }}</strong> as an allowed redirect URI first.
      </p>
      <form class="client-form" @submit.prevent="configure">
        <label for="spotify-client-id">Spotify client ID</label>
        <input
          id="spotify-client-id"
          v-model.trim="clientId"
          autocomplete="off"
          placeholder="Enter client ID"
          required
          type="text"
        />
        <button class="spotify-btn" :disabled="!redirectUriSupported" type="submit">
          Save and connect
        </button>
      </form>
    </div>

    <div v-else-if="!connected" class="spotify-message">
      <h2>Connect Spotify</h2>
      <p v-if="!redirectUriSupported" class="spotify-warning">
        Reopen this app at <a :href="loopbackUrl">{{ loopbackUrl }}</a> to use Spotify OAuth.
      </p>
      <p>Delegate access to your profile and 10 most recently played songs.</p>
      <button
        class="spotify-btn"
        :disabled="!redirectUriSupported"
        type="button"
        @click="connect"
      >
        Connect Spotify
      </button>
    </div>

    <div v-else>
      <div class="spotify-heading">
        <div class="spotify-identity">
          <img
            v-if="profile?.imageUrl"
            :src="profile.imageUrl"
            :alt="profile.displayName"
            class="profile-image"
          />
          <div>
          <h2>Recently played</h2>
            <p>
              Connected as
              <a
                v-if="profile"
                :href="profile.spotifyUrl"
                target="_blank"
                rel="noopener noreferrer"
              >
                {{ profile.displayName }}
              </a>
            </p>
          </div>
        </div>
        <div class="spotify-actions">
          <button class="secondary-btn" type="button" @click="loadTracks">Refresh</button>
          <button class="secondary-btn" type="button" @click="disconnect">Disconnect</button>
        </div>
      </div>

      <p v-if="error" class="spotify-error">{{ error }}</p>
      <p v-else-if="tracks.length === 0" class="spotify-message">No recently played songs found.</p>

      <ol v-else class="track-list">
        <li v-for="track in tracks" :key="`${track.id}-${track.playedAt}`" class="track-row">
          <div class="track-cover-wrapper">
            <img
              v-if="track.imageUrl"
              :src="track.imageUrl"
              :alt="`${track.album} cover`"
              class="track-cover"
            />
            <div v-else class="track-cover track-placeholder" aria-hidden="true">♪</div>
            <button
              class="cover-play-btn"
              :class="{ playing: activeTrackId === track.id }"
              :disabled="activeTrackId === track.id"
              :aria-label="activeTrackId === track.id
                ? `${track.title} is playing`
                : `Play ${track.title}`"
              type="button"
              @click="togglePlayer(track)"
            >
              ▶
            </button>
          </div>
          <div class="track-info">
            <a :href="track.spotifyUrl" target="_blank" rel="noopener noreferrer">
              {{ track.title }}
            </a>
            <span>{{ track.artist }} · {{ track.album }}</span>
          </div>
          <div class="track-actions">
            <time :datetime="track.playedAt">{{ formatPlayedAt(track.playedAt) }}</time>
            <div class="track-buttons">
              <button
                class="add-btn"
                :disabled="isInCollection(track) || addingTrackId === track.id"
                type="button"
                @click="addToCollection(track)"
              >
                {{
                  isInCollection(track)
                    ? 'Added'
                    : addingTrackId === track.id
                      ? 'Adding...'
                      : 'Add to collection'
                }}
              </button>
            </div>
          </div>
        </li>
      </ol>
    </div>

    <aside v-if="activeTrack" class="sticky-player">
      <div class="player-heading">
        <div>
          <strong>{{ activeTrack.title }}</strong>
          <span>{{ activeTrack.artist }}</span>
        </div>
        <button class="close-player-btn" type="button" @click="activeTrackId = null">
          Close
        </button>
      </div>
      <iframe
        :key="activeTrack.id"
        class="spotify-embed"
        :src="getEmbedUrl(activeTrack)"
        :title="`Play ${activeTrack.title} by ${activeTrack.artist}`"
        allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
      ></iframe>
    </aside>
  </section>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import axios from 'axios'
import type { Album } from '../types/album'
import type { SpotifyProfile, SpotifyTrack } from '../types/spotify'
import {
  beginSpotifyAuthorization,
  completeSpotifyAuthorization,
  disconnectSpotify,
  fetchRecentlyPlayed,
  fetchSpotifyProfile,
  getSpotifyClientId,
  getSpotifyRedirectUri,
  isSpotifyRedirectUriSupported,
  isSpotifyConnected,
  saveSpotifyClientId,
} from '../utils/spotify'

interface Props {
  albums: Album[]
}

const props = defineProps<Props>()
const emit = defineEmits<{
  collectionAdded: []
}>()

const configured = ref(false)
const connected = ref(false)
const tracks = ref<SpotifyTrack[]>([])
const profile = ref<SpotifyProfile | null>(null)
const loading = ref(true)
const error = ref<string | null>(null)
const addingTrackId = ref<string | null>(null)
const addedTrackIds = ref(new Set<string>())
const activeTrackId = ref<string | null>(null)
const activeTrack = computed(
  () => tracks.value.find((track) => track.id === activeTrackId.value) ?? null,
)
const clientId = ref(getSpotifyClientId())
const redirectUri = getSpotifyRedirectUri()
const redirectUriSupported = isSpotifyRedirectUriSupported()
const loopbackUrl = `${window.location.protocol}//127.0.0.1:${window.location.port}/`

const loadTracks = async (): Promise<void> => {
  try {
    error.value = null
    tracks.value = await fetchRecentlyPlayed(clientId.value)
  } catch (err) {
    error.value = 'Unable to load recently played songs from Spotify.'
    console.error('Error fetching Spotify history:', err)
  }
}

const initialize = async (): Promise<void> => {
  try {
    loading.value = true
    error.value = null
    configured.value = clientId.value.length > 0

    const parameters = new URLSearchParams(window.location.search)
    const authorizationError = parameters.get('error')
    if (authorizationError) {
      throw new Error(`Spotify authorization failed: ${authorizationError}`)
    }

    if (
      configured.value
      && await completeSpotifyAuthorization(clientId.value, redirectUri, parameters)
    ) {
      window.history.replaceState({}, '', window.location.pathname)
    }

    connected.value = isSpotifyConnected()
    if (connected.value) {
      [profile.value] = await Promise.all([
        fetchSpotifyProfile(clientId.value),
        loadTracks(),
      ])
    }
  } catch (err) {
    error.value = err instanceof Error
      ? err.message
      : 'Unable to complete Spotify authorization.'
    console.error('Error initializing Spotify:', err)
  } finally {
    loading.value = false
  }
}

const connect = async (): Promise<void> => {
  try {
    error.value = null
    await beginSpotifyAuthorization(clientId.value, redirectUri)
  } catch (err) {
    error.value = 'Unable to start Spotify authorization.'
    console.error('Error starting Spotify authorization:', err)
  }
}

const configure = async (): Promise<void> => {
  saveSpotifyClientId(clientId.value)
  configured.value = true
  await connect()
}

const disconnect = (): void => {
  disconnectSpotify()
  tracks.value = []
  profile.value = null
  connected.value = false
}

const isInCollection = (track: SpotifyTrack): boolean =>
  addedTrackIds.value.has(track.id)
  || props.albums.some(
    (album) =>
      album.title.toLocaleLowerCase() === track.title.toLocaleLowerCase()
      && album.artist.toLocaleLowerCase() === track.artist.toLocaleLowerCase(),
  )

const addToCollection = async (track: SpotifyTrack): Promise<void> => {
  try {
    addingTrackId.value = track.id
    error.value = null
    await axios.post<Album>('/albums', {
      title: track.title,
      artist: track.artist,
      price: 0,
      imageUrl: track.imageUrl
        ?? 'https://via.placeholder.com/300x300/1DB954/white?text=Spotify',
    })
    addedTrackIds.value = new Set(addedTrackIds.value).add(track.id)
    emit('collectionAdded')
  } catch (err) {
    error.value = `Unable to add "${track.title}" to the collection.`
    console.error('Error adding Spotify track to collection:', err)
  } finally {
    addingTrackId.value = null
  }
}

const togglePlayer = (track: SpotifyTrack): void => {
  activeTrackId.value = track.id
}

const getEmbedUrl = (track: SpotifyTrack): string =>
  `https://open.spotify.com/embed/track/${encodeURIComponent(track.id)}?autoplay=1`

const formatPlayedAt = (playedAt: string): string =>
  new Intl.DateTimeFormat(undefined, {
    dateStyle: 'short',
    timeStyle: 'short',
  }).format(new Date(playedAt))

onMounted(initialize)
</script>

<style scoped>
.spotify-panel {
  padding: 1rem;
}

.spotify-panel.has-active-player {
  padding-bottom: 230px;
}

.spotify-heading {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  color: white;
  margin-bottom: 1.25rem;
}

.spotify-heading h2,
.spotify-message h2 {
  margin: 0 0 0.25rem;
}

.spotify-heading p,
.spotify-message p {
  margin: 0;
}

.spotify-actions {
  display: flex;
  gap: 0.5rem;
}

.spotify-identity {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.spotify-identity a {
  color: white;
  font-weight: 700;
}

.profile-image {
  width: 48px;
  height: 48px;
  border: 2px solid white;
  border-radius: 50%;
  object-fit: cover;
}

.spotify-message,
.spotify-error {
  color: white;
  text-align: center;
  padding: 3rem 1rem;
}

.client-form {
  display: grid;
  max-width: 520px;
  gap: 0.6rem;
  margin: 1.5rem auto 0;
  text-align: left;
}

.client-form input {
  border: 0;
  border-radius: 8px;
  font: inherit;
  padding: 0.8rem;
}

.client-form .spotify-btn {
  justify-self: center;
}

.spotify-btn,
.secondary-btn {
  border: 0;
  border-radius: 999px;
  cursor: pointer;
  font-weight: 700;
  padding: 0.7rem 1.2rem;
}

.spotify-btn {
  background: #1ed760;
  color: #111;
  margin-top: 1.5rem;
}

.spotify-btn:disabled {
  cursor: not-allowed;
  opacity: 0.55;
}

.spotify-warning {
  max-width: 680px;
  margin: 0 auto 1rem !important;
  padding: 0.75rem;
  background: rgba(255, 196, 0, 0.2);
  border: 1px solid rgba(255, 220, 100, 0.8);
  border-radius: 8px;
}

.spotify-warning a {
  color: white;
  font-weight: 700;
}

.secondary-btn {
  background: rgba(255, 255, 255, 0.9);
  color: #4f5fc7;
}

.track-list {
  display: grid;
  gap: 0.75rem;
  list-style: none;
  margin: 0;
  padding: 0;
}

.track-row {
  display: grid;
  grid-template-columns: 64px minmax(0, 1fr) auto;
  align-items: center;
  gap: 1rem;
  padding: 0.75rem;
  background: rgba(255, 255, 255, 0.95);
  border-radius: 12px;
}

.track-cover {
  width: 64px;
  height: 64px;
  border-radius: 8px;
  object-fit: cover;
}

.track-cover-wrapper {
  position: relative;
  width: 64px;
  height: 64px;
}

.cover-play-btn {
  position: absolute;
  inset: 0;
  display: grid;
  place-items: center;
  width: 100%;
  border: 0;
  border-radius: 8px;
  background: rgba(0, 0, 0, 0.5);
  color: white;
  cursor: pointer;
  font-size: 1.35rem;
  opacity: 0;
  transition: opacity 0.2s ease, background 0.2s ease;
}

.track-cover-wrapper:hover .cover-play-btn,
.cover-play-btn:focus-visible,
.cover-play-btn.playing {
  opacity: 1;
}

.cover-play-btn.playing {
  background: rgba(30, 215, 96, 0.8);
  cursor: default;
}

.track-placeholder {
  display: grid;
  place-items: center;
  background: #d8dcf8;
  color: #667eea;
  font-size: 1.5rem;
}

.track-info {
  display: flex;
  min-width: 0;
  flex-direction: column;
  gap: 0.25rem;
}

.track-info a {
  color: #222;
  font-size: 1.05rem;
  font-weight: 700;
  overflow: hidden;
  text-decoration: none;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.track-info a:hover {
  color: #1a9c47;
  text-decoration: underline;
}

.track-info span,
.track-row time {
  color: #666;
  font-size: 0.9rem;
}

.track-actions {
  display: flex;
  align-items: flex-end;
  flex-direction: column;
  gap: 0.5rem;
}

.track-buttons {
  display: flex;
  gap: 0.5rem;
}

.add-btn {
  padding: 0.5rem 0.8rem;
  border: 0;
  border-radius: 999px;
  cursor: pointer;
  font-weight: 700;
  white-space: nowrap;
}

.add-btn {
  background: #1ed760;
  color: #111;
}

.add-btn:disabled {
  background: #d7d7d7;
  color: #666;
  cursor: default;
}

.spotify-embed {
  width: 100%;
  height: 152px;
  border: 0;
  border-radius: 12px;
}

.sticky-player {
  position: fixed;
  z-index: 1000;
  right: 1rem;
  bottom: 1rem;
  left: 1rem;
  max-width: 1168px;
  margin: 0 auto;
  padding: 0.75rem;
  background: rgba(22, 22, 22, 0.96);
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 16px;
  box-shadow: 0 18px 50px rgba(0, 0, 0, 0.45);
  backdrop-filter: blur(12px);
}

.player-heading {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  padding: 0 0.25rem 0.6rem;
  color: white;
}

.player-heading div {
  display: flex;
  min-width: 0;
  flex-direction: column;
}

.player-heading strong,
.player-heading span {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.player-heading span {
  color: #bbb;
  font-size: 0.9rem;
}

.close-player-btn {
  padding: 0.45rem 0.8rem;
  border: 1px solid rgba(255, 255, 255, 0.5);
  border-radius: 999px;
  background: transparent;
  color: white;
  cursor: pointer;
}

@media (max-width: 640px) {
  .spotify-heading {
    align-items: flex-start;
    flex-direction: column;
  }

  .track-row {
    grid-template-columns: 56px minmax(0, 1fr);
  }

  .track-cover {
    width: 56px;
    height: 56px;
  }

  .track-cover-wrapper {
    width: 56px;
    height: 56px;
  }

  .cover-play-btn {
    opacity: 1;
  }

  .track-actions {
    grid-column: 2;
    align-items: flex-start;
  }

  .track-buttons {
    align-items: flex-start;
    flex-direction: column;
  }

  .spotify-panel.has-active-player {
    padding-bottom: 250px;
  }

  .sticky-player {
    right: 0.5rem;
    bottom: 0.5rem;
    left: 0.5rem;
  }
}
</style>
