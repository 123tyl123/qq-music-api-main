<script setup>
import { useMusicStore } from '@/stores/music'
const musicStore = useMusicStore()
import skeletonLoading from '@/components/skeletonLoading.vue'
import singerSwipe from '@/components/singerSwipe.vue'
import { onMounted } from 'vue'
import { storeToRefs } from 'pinia'
import { useRouter } from 'vue-router'
const router = useRouter()
const {playlists,playlistsLoading :loading,newSongs,newSongsLoading}=storeToRefs(musicStore)

onMounted(()=>{
  musicStore.initHomePage()
})
// 当图片加载失败时，给它一个默认的占位图
const onImgError = (item) => {
  // 你可以找一个本地的 logo.png 或者一张好看的默认灰色背景图
  item.cover = 'https://via.placeholder.com/300?text=No+Cover'
  // 报错了也要把状态设为 true，否则它会一直保持透明（opacity: 0）
  item.loaded = true 
}
// 点击歌单跳转
const handlePlaylistClick = (id) => {
  if(!id) return
  router.push({name:'musiclist',query:{id}})
}



</script>
<template>
  <div class="hall-wrapper">
    <div class="hall-inner">
      <h2 class="section-title">
        推荐歌单
      </h2>
      <skeletonLoading v-if="loading" />
      <ul
        v-else
        class="playlist-list"
      >
        <li
          v-for="item in playlists" 
          :key="item.id" 
          class="playlist-item"
          @click="handlePlaylistClick(item.id)"
        >
          <div class="cover-wrapper">
            <img
              :src="item.cover"
              :alt="item.title"
              :class="{'loaded':item.loaded}"
              loading="lazy"
              @error="onImgError(item)"
              @load="item.loaded=true"
            >
          </div>
          <div class="info">
            <p class="title">
              {{ item.title }}
            </p>
            <p class="desc">
              {{ item.desc }}
            </p>
          </div>
        </li>
      </ul>
      <h2 class="section-title section-title--sub">
        推荐新音乐
      </h2>
      <skeletonLoading
        v-if="newSongsLoading"
        type="song"
        :count="10"
      />
      <ul
        v-else
        class="song-list"
      >
        <li
          v-for="song in newSongs"
          :key="song.id"
          class="song-item"
        >
          <div class="song-cover">
            <img
              :src="song.cover"
              :alt="song.name"
              :class="{'loaded':song.loaded}"
              @load="song.loaded=true"
            >
          </div>
          <div class="song-info">
            <p class="song-name">
              {{ song.name }}
            </p>
            <p class="song-artist">
              {{ song.artist }}
            </p>
          </div>
        </li>
      </ul>
      <!-- 歌手轮播图 -->
      <singerSwipe />
    </div>
  </div>
</template>
<style scoped>
.section-title--sub{
  margin-top: 40px;
}
.song-list{
  display: grid;
  grid-template-columns: repeat(2,1fr);
  gap: 16px 40px;
  list-style: none;
  padding: 0;
  margin: 0;
}
.song-item{
  display: flex;
  align-items: center;
  gap: 12px;
  cursor: pointer;
}
.song-cover{
  width: 82px;
  height: 82px;
  border-radius: 4px;
  overflow: hidden;
  background-color: #eee;
  flex-shrink: 0;
}
.song-cover img{
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
  opacity: 0;
  transition: transform 0.3s ease-in-out, opacity 0.6s ease-in-out;
}
.song-cover img.loaded {
  opacity: 1;
}
.song-cover:hover img{
  transform: scale(1.06);
}
.song-info{
  flex: 1;
}
.song-name {
  font-size: 14px;
  color: #333;
  margin: 0 0 4px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.song-artist {
  font-size: 12px;
  color: #999;
  margin: 0;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.hall-wrapper{
  display: flex;
  justify-content: center;
}
.hall-inner{
  width: 100%;
  max-width: 1200px;
}
.section-title{
  margin: 40px 0 16px;
  font-size: 20px;
  font-weight: 600;
  color: #333;
}
.playlist-list {
  display: flex;
  gap: 20px;
  list-style: none;
  padding: 0;
  margin: 0;
}
.playlist-item{
  flex:1;
  max-width: 220px;
  cursor: pointer;
}


.cover-wrapper {
  width: 100%;
  aspect-ratio: 1 / 1;
  border-radius: 4px;
  overflow: hidden;
  background-color: #f5f5f5; /* 默认底色 */
  position: relative;
}

.cover-wrapper img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
  opacity: 0; /* 默认隐藏 */
  transition: opacity 0.6s ease-in-out; /* 渐显动画 */
}

/* Vue 绑定类名生效后 */
.cover-wrapper img.loaded {
  opacity: 1;
}
.cover-wrapper:hover img {
  transform: scale(1.06);
}
.info{
  margin-top: 8px;
}
.title{
  font-size: 14px;
  color: #333;
  margin: 0 0 4px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis; 
}
.desc{
  font-size: 12px;
  color: #999;
  margin: 0;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}


</style>
