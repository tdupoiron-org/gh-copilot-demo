<template>
  <div class="app">
    <header class="header">
      <div>
        <h1>🎵 {{ pageTitle }}</h1>
        <p>{{ pageSubtitle }}</p>
      </div>
      <div class="header-actions">
        <div v-if="activeView === 'collection'" class="view-toggle" aria-label="Collection layout">
          <button
            class="view-btn"
            :class="{ active: viewMode === 'grid' }"
            :aria-pressed="viewMode === 'grid'"
            @click="viewMode = 'grid'"
          >
            Grid
          </button>
          <button
            class="view-btn"
            :class="{ active: viewMode === 'list' }"
            :aria-pressed="viewMode === 'list'"
            @click="viewMode = 'list'"
          >
            List
          </button>
        </div>
        <button
          v-if="activeView !== 'collection'"
          class="nav-btn"
          @click="activeView = 'collection'"
        >
          Collection
        </button>
        <button
          v-if="activeView !== 'spotify'"
          class="nav-btn spotify-nav-btn"
          @click="activeView = 'spotify'"
        >
          Spotify
        </button>
        <button
          v-if="activeView !== 'admin'"
          class="nav-btn"
          @click="activeView = 'admin'"
        >
          Admin
        </button>
      </div>
    </header>

    <main class="main">
      <SpotifyRecentlyPlayed v-if="activeView === 'spotify'" />

      <div v-else-if="loading" class="loading">
        <div class="spinner"></div>
        <p>Loading albums...</p>
      </div>

      <div v-else-if="error" class="error">
        <p>{{ error }}</p>
        <button @click="fetchAlbums" class="retry-btn">Try Again</button>
      </div>

      <AdminPanel
        v-else-if="activeView === 'admin'"
        :albums="albums"
        @changed="fetchAlbums"
      />

      <div v-else class="albums-grid" :class="{ 'albums-list': viewMode === 'list' }">
        <AlbumCard 
          v-for="album in albums" 
          :key="album.id" 
          :album="album" 
          :layout="viewMode"
        />
      </div>
    </main>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, onMounted } from 'vue'
import axios from 'axios'
import AlbumCard from './components/AlbumCard.vue'
import AdminPanel from './components/AdminPanel.vue'
import SpotifyRecentlyPlayed from './components/SpotifyRecentlyPlayed.vue'
import type { Album } from './types/album'

const albums = ref<Album[]>([])
const loading = ref<boolean>(true)
const error = ref<string | null>(null)
const queryParameters = new URLSearchParams(window.location.search)
const spotifyCallback = queryParameters.has('code') || queryParameters.has('error')
const activeView = ref<'collection' | 'spotify' | 'admin'>(
  spotifyCallback ? 'spotify' : 'collection',
)
const viewMode = ref<'grid' | 'list'>('grid')
const pageTitle = computed(() => {
  if (activeView.value === 'admin') return 'Album Admin'
  if (activeView.value === 'spotify') return 'Spotify History'
  return 'Album Collection'
})
const pageSubtitle = computed(() => {
  if (activeView.value === 'admin') return 'Create, edit, and remove albums'
  if (activeView.value === 'spotify') return 'See the songs you played most recently'
  return 'Discover amazing music albums'
})

const fetchAlbums = async (): Promise<void> => {
  try {
    loading.value = true
    error.value = null
    const response = await axios.get<Album[]>('/albums')
    albums.value = response.data
  } catch (err) {
    error.value = 'Failed to load albums. Please make sure the API is running.'
    console.error('Error fetching albums:', err)
  } finally {
    loading.value = false
  }
}

onMounted(fetchAlbums)
</script>

<style scoped>
.app {
  min-height: 100vh;
  padding: 2rem;
}

.header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 2rem;
  margin-bottom: 3rem;
  color: white;
}

.header h1 {
  font-size: 3rem;
  margin-bottom: 0.5rem;
  text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.3);
}

.header p {
  font-size: 1.2rem;
  opacity: 0.9;
  margin: 0;
}

.header-actions {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.view-toggle {
  display: flex;
  gap: 0.25rem;
  padding: 0.25rem;
  background: rgba(255, 255, 255, 0.18);
  border-radius: 8px;
}

.view-btn {
  background: transparent;
  color: white;
  border: 0;
  padding: 0.5rem 0.75rem;
  border-radius: 6px;
  font-weight: 600;
  cursor: pointer;
}

.view-btn.active {
  background: white;
  color: #667eea;
}

.nav-btn {
  background: white;
  color: #667eea;
  border: 0;
  padding: 0.75rem 1.25rem;
  border-radius: 8px;
  font-weight: 700;
  cursor: pointer;
}

.spotify-nav-btn {
  background: #1ed760;
  color: #111;
}

.main {
  max-width: 1200px;
  margin: 0 auto;
}

.loading {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 4rem;
  color: white;
}

.spinner {
  width: 50px;
  height: 50px;
  border: 4px solid rgba(255, 255, 255, 0.3);
  border-top: 4px solid white;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin-bottom: 1rem;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

.error {
  text-align: center;
  padding: 4rem;
  color: white;
}

.error p {
  font-size: 1.2rem;
  margin-bottom: 2rem;
}

.retry-btn {
  background: rgba(255, 255, 255, 0.2);
  color: white;
  border: 2px solid white;
  padding: 0.75rem 2rem;
  border-radius: 25px;
  font-size: 1rem;
  cursor: pointer;
  transition: all 0.3s ease;
}

.retry-btn:hover {
  background: white;
  color: #667eea;
}

.albums-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 2rem;
  padding: 1rem;
}

.albums-list {
  grid-template-columns: 1fr;
  gap: 1rem;
}

@media (max-width: 768px) {
  .app {
    padding: 1rem;
  }
  
  .header h1 {
    font-size: 2rem;
  }

  .header {
    align-items: flex-start;
    flex-direction: column;
  }

  .header-actions {
    width: 100%;
    justify-content: space-between;
  }
  
  .albums-grid {
    grid-template-columns: 1fr;
    gap: 1rem;
  }
}
</style>
