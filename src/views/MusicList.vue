<script setup>
import {useRoute} from 'vue-router'
import {onMounted} from 'vue'
import api from '@/api'
import {ref} from 'vue'
import NProgress from 'nprogress'
import 'nprogress/nprogress.css'
import {RecycleScroller }from 'vue-virtual-scroller'
import 'vue-virtual-scroller/dist/vue-virtual-scroller.css'
import { useRouter } from 'vue-router'

const route = useRoute()
const playlistId = route.query.id
const playlistName=ref('歌单加载中...')
const tracks=ref([])
const loading=ref(false)
const fetchPlaylistDetail = async () => {
  if(!playlistId){
    return
  }
  NProgress.start()
  loading.value=true
  const res = await api.get(`/playlist/detail?id=${playlistId}`)
  const detail = res.data?.playlist
  try {
    if(detail){
      playlistName.value=detail.name
      tracks.value=detail.tracks?.map(item=>({
        id:item.id,
        name:item.name,
        artist:(item.ar||item.artists||[])?.map(ar=>ar.name).join('/'),
        durationMs:item.dt||item.duration||0,
        album:item.al?.name || item.album?.name || '未知专辑',
      })) || []
    }
  } catch (error) {
    console.log("获取播放列表详情失败",error)
  }finally{
    loading.value=false
    NProgress.done()
  }
}

onMounted(() => {
  fetchPlaylistDetail()
})
// 时间转换
const formatDuration = (ms) =>{
    if (!ms) return "00:00"
    const totalSec = Math.floor(ms / 1000)
    const m = Math.floor(totalSec / 60)
    const s = totalSec % 60
    return `${m.toString().padStart(2,'0')}:${s.toString().padStart(2,'0')}`
}
const router = useRouter()
</script>
<template>
  <div class="musiclist-page">
    <!-- <div v-if="loading" class="musiclist-inner">
      <van-skeleton title :row="0" style="margin-bottom: 20px" />
      
      <van-skeleton 
        v-for="i in 8" 
        :key="i"
        title
        avatar
        :row="1"
        avatar-shape="square"
        avatar-size="40px"
        style="margin-bottom: 16px"
      />
    </div> -->
    <div class="musiclist-inner">
      <h2 class="title">
        {{ playlistName|| '正在获取歌单...' }}
      </h2>
      <!-- <ul class="track-list"> -->
      <template v-if="loading">
        <van-skeleton
          v-for="i in 10"
          :key="i"
          title
          :row="1"
        />
      </template>
      <RecycleScroller
        v-else
        v-slot="{ item, index }"
        class="track-scroller" 
        :items="tracks"
        :item-size="56"
        key-field="id"
      >
        <li
          :key="item.id"
          class="track-item"
          @click="() => router.push({ name: 'player', query: { id: item.id } })"
        >
          <span class="track-index">{{ index+1 }}</span>
          <div class="track-main">
            <span class="track-name">{{ item.name }}</span>
            <span class="track-artist">{{ item.artist }}</span>
          </div>
          <div class="track-extra">
            <span class="track-album">{{ item.album }}</span>
            <span class="track-duration">{{ formatDuration(item.durationMs) }}</span>
          </div>
        </li>
      </RecycleScroller>
    </div>
  </div>
</template>

<style scoped>
.musiclist-page {
  min-height: calc(100vh - 90px);
  padding: 24px 32px;
  box-sizing: border-box;
  background: #f5f7fb;
}

.musiclist-inner {
  max-width: 1200px;
  margin: 0 auto;
}

.title {
  margin: 0 0 16px;
  font-size: 22px;
  font-weight: 600;
  color: #333;
}

/* 列表容器：控制背景和阴影 */
.list-container {
  background: #fff;
  border-radius: 8px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.05);
  overflow: hidden; /* 保证圆角 */
}

/* 虚拟滚动组件必须有固定高度 */
.track-scroller {
  height: 600px;
}

.track-item {
  display: flex;
  align-items: center;
  padding: 0 16px; /* 移除上下 padding，高度由 item-size 决定 */
  height: 56px;    /* 必须与 item-size 一致 */
  border-bottom: 1px solid #f2f2f2;
  box-sizing: border-box;
  cursor: pointer;
}

.track-item:hover {
  background: #f9f9f9;
}

/* 其他样式保持不变 ... */
.track-index { width: 32px; text-align: right; margin-right: 12px; color: #999; flex-shrink: 0; }
.track-main { display: flex; flex-direction: column; max-width: 45%; }
.track-name { font-size: 14px; color: #333; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.track-artist { font-size: 12px; color: #999; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.track-extra { display: flex; align-items: center; gap: 16px; margin-left: auto; font-size: 13px; }
.track-album { color: #666; max-width: 150px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.track-duration { color: #999; width: 50px; text-align: right; }
</style>