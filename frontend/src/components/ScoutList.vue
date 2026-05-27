<template>
  <div class="page">
    <h1>スカウト一覧</h1>

    <p v-if="store.loading">読み込み中...</p>

    <p v-else-if="store.error">
      {{ store.error }}
    </p>

    <p v-else-if="store.scouts.length === 0">
      データがありません
    </p>

    <ul v-else>
      <li
        v-for="scout in store.scouts"
        :key="scout.id"
      >
        <h3>{{ scout.title }}</h3>

        <p>{{ scout.body }}</p>

        <p>
          作成者: {{ scout.creator }}
        </p>
      </li>
    </ul>
  </div>
</template>

<script setup lang="ts">
import { onMounted } from 'vue'
import { useScoutStore } from '../store/scoutStore'

const store = useScoutStore()

onMounted(() => {
  store.loadScouts()
})
</script>