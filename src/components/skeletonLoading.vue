<script setup>

const props = defineProps({
  type: {
    type: String,
    default: 'playlist' // 'playlist' 或 'song'
  },
  count: {
    type: Number,
    default: 5
  }
})
</script>

<template>
  <!-- 歌单模式 -->
  <div
    v-if="type === 'playlist'"
    class="playlist-list"
  >
    <div
      v-for="i in count"
      :key="i"
      class="playlist-item skeleton"
    >
      <div class="cover-wrapper skeleton-img" />
      <div class="info">
        <div class="skeleton-text title" />
        <div class="skeleton-text desc" />
      </div> 
    </div>
  </div>

  <!-- 歌曲模式 -->
  <div
    v-else-if="type === 'song'"
    class="song-list-skeleton"
  >
    <div
      v-for="i in count"
      :key="i"
      class="song-item-skeleton"
    >
      <div class="song-cover skeleton-img" />
      <div class="song-info">
        <div class="skeleton-text song-name" />
        <div class="skeleton-text song-artist" />
      </div>
    </div>
  </div>
</template>
<style scoped>
/* 通用样式 */
.skeleton-img, .skeleton-text {
  background: #eee;
  background: linear-gradient(90deg, #eee 25%, #f5f5f5 50%, #eee 75%);
  background-size: 200% 100%;
  animation: skeleton-loading 1.5s infinite;
}

@keyframes skeleton-loading {
  0% { background-position: 200% 0; }
  100% { background-position: -200% 0; }
}

/* 歌单模式样式 */
.playlist-list {
  display: flex;
  gap: 20px;
}
.playlist-item {
  flex: 1;
  max-width: 220px;
}
.cover-wrapper {
  width: 100%;
  aspect-ratio: 1 / 1;
  border-radius: 4px;
  margin-bottom: 10px;
}
.skeleton-text.title { height: 16px; width: 80%; margin-bottom: 8px; }
.skeleton-text.desc { height: 12px; width: 60%; }

/* 歌曲模式样式 */
.song-list-skeleton {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 16px 40px;
}
.song-item-skeleton {
  display: flex;
  align-items: center;
  gap: 12px;
}
.song-cover {
  width: 82px;
  height: 82px;
  border-radius: 4px;
  flex-shrink: 0;
}
.song-info {
  flex: 1;
}
.skeleton-text.song-name { height: 14px; width: 70%; margin-bottom: 8px; }
.skeleton-text.song-artist { height: 12px; width: 40%; }
</style>