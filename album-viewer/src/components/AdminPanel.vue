<template>
  <section class="admin-panel">
    <form class="album-form" @submit.prevent="saveAlbum">
      <h2>{{ editingId === null ? 'Add album' : 'Edit album' }}</h2>

      <label>
        Title
        <input v-model.trim="form.title" required type="text" />
      </label>

      <label>
        Artist
        <input v-model.trim="form.artist" required type="text" />
      </label>

      <label>
        Price
        <input v-model.number="form.price" min="0" required step="0.01" type="number" />
      </label>

      <label>
        Image URL
        <input v-model.trim="form.image_url" required type="url" />
      </label>

      <p v-if="error" class="form-error">{{ error }}</p>

      <div class="form-actions">
        <button class="btn btn-primary" type="submit">
          {{ editingId === null ? 'Add album' : 'Save changes' }}
        </button>
        <button v-if="editingId !== null" class="btn btn-secondary" type="button" @click="resetForm">
          Cancel
        </button>
      </div>
    </form>

    <div class="album-list">
      <h2>Albums ({{ albums.length }})</h2>
      <p v-if="albums.length === 0" class="empty-state">No albums yet.</p>
      <article v-for="album in albums" :key="album.id" class="album-row">
        <img :src="album.image_url" :alt="album.title" />
        <div class="album-row-info">
          <strong>{{ album.title }}</strong>
          <span>{{ album.artist }} · ${{ album.price.toFixed(2) }}</span>
        </div>
        <div class="row-actions">
          <button class="btn btn-secondary" type="button" @click="startEditing(album)">Edit</button>
          <button class="btn btn-danger" type="button" @click="deleteAlbum(album)">Delete</button>
        </div>
      </article>
    </div>
  </section>
</template>

<script setup lang="ts">
import { reactive, ref } from 'vue'
import axios from 'axios'
import type { Album } from '../types/album'

interface Props {
  albums: Album[]
}

const props = defineProps<Props>()
const emit = defineEmits<{
  changed: []
}>()

interface AlbumForm {
  title: string
  artist: string
  price: number
  image_url: string
}

const emptyForm = (): AlbumForm => ({
  title: '',
  artist: '',
  price: 0,
  image_url: '',
})

const form = reactive<AlbumForm>(emptyForm())
const editingId = ref<number | null>(null)
const error = ref<string | null>(null)

const resetForm = (): void => {
  Object.assign(form, emptyForm())
  editingId.value = null
  error.value = null
}

const startEditing = (album: Album): void => {
  Object.assign(form, {
    title: album.title,
    artist: album.artist,
    price: album.price,
    image_url: album.image_url,
  })
  editingId.value = album.id
  error.value = null
}

const saveAlbum = async (): Promise<void> => {
  error.value = null
  try {
    const payload = { ...form, imageUrl: form.image_url }
    if (editingId.value === null) {
      await axios.post<Album>('/albums', payload)
    } else {
      await axios.put<Album>(`/albums/${editingId.value}`, payload)
    }
    resetForm()
    emit('changed')
  } catch (err) {
    error.value = 'Unable to save the album. Please check that the API is running.'
    console.error('Error saving album:', err)
  }
}

const deleteAlbum = async (album: Album): Promise<void> => {
  if (!window.confirm(`Delete "${album.title}"?`)) {
    return
  }

  error.value = null
  try {
    await axios.delete(`/albums/${album.id}`)
    if (editingId.value === album.id) {
      resetForm()
    }
    emit('changed')
  } catch (err) {
    error.value = 'Unable to delete the album. Please try again.'
    console.error('Error deleting album:', err)
  }
}
</script>

<style scoped>
.admin-panel {
  display: grid;
  grid-template-columns: minmax(280px, 360px) 1fr;
  gap: 2rem;
}

.album-form,
.album-list {
  background: rgba(255, 255, 255, 0.95);
  border-radius: 15px;
  padding: 1.5rem;
}

h2 {
  color: #333;
  margin-top: 0;
}

label {
  color: #444;
  display: block;
  font-weight: 600;
  margin-bottom: 1rem;
}

input {
  box-sizing: border-box;
  display: block;
  margin-top: 0.4rem;
  padding: 0.7rem;
  width: 100%;
}

.form-actions,
.row-actions {
  display: flex;
  gap: 0.6rem;
}

.btn {
  border: 0;
  border-radius: 8px;
  cursor: pointer;
  font-weight: 600;
  padding: 0.7rem 1rem;
}

.btn-primary {
  background: #667eea;
  color: white;
}

.btn-secondary {
  background: transparent;
  border: 2px solid #667eea;
  color: #667eea;
}

.btn-danger {
  background: #c0392b;
  color: white;
}

.form-error {
  color: #c0392b;
  font-weight: 600;
}

.album-row {
  align-items: center;
  border-bottom: 1px solid #ddd;
  display: flex;
  gap: 1rem;
  padding: 1rem 0;
}

.album-row:last-child {
  border-bottom: 0;
}

.album-row img {
  border-radius: 8px;
  height: 56px;
  object-fit: cover;
  width: 56px;
}

.album-row-info {
  display: flex;
  flex: 1;
  flex-direction: column;
  gap: 0.25rem;
}

.album-row-info strong {
  color: #333;
}

.album-row-info span,
.empty-state {
  color: #666;
}

@media (max-width: 800px) {
  .admin-panel {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 520px) {
  .album-row {
    align-items: flex-start;
    flex-wrap: wrap;
  }

  .row-actions {
    margin-left: 72px;
    width: calc(100% - 72px);
  }
}
</style>
