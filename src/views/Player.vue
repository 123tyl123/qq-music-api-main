<script setup>
import { ref,onMounted,computed,watch } from "vue"
import { useRoute } from "vue-router"
import api from "@/api"

const route = useRoute()

const songId = computed(() => route.query.id)

// 获取audio标签
const audioRef = ref(null)

// 歌曲信息
const songTitle = ref("正在播放的歌曲")
const songArtist = ref("歌手姓名")
const songAlbum = ref("专辑名称")
const songCover = ref(" ")

// 歌词
// const lyrics = ref([])

// 音乐播放地址
const audioUrl = ref('')
const currentTime = ref(0)
const duration = ref(0)
const isPlaying = ref(false)


// 歌词列表本身
const lyrics = ref([])



// 获取歌曲详情 
const fetchSongDetail = async (id) =>{
    if(!id) return
    try{
        const res = (await api.get("/song/detail",{ids:id})).data
        const detail = (res.songs || [])[0]
        if(detail){
            songTitle.value = detail.name || '未知歌曲'
            songArtist.value = (detail.ar || detail.artists || []).map((a) => a.name).join("/") || "未知歌手"
            songAlbum.value = (detail.al || detail.album)?.name || '未知专辑'
            songCover.value = (detail.al || detail.album)?.picUrl || songCover.value
        }
    }catch(err) {
        console.log("获取歌曲详情失败",err);
        songTitle.value = "正在播放的歌曲"
        songArtist.value = "歌手姓名"
        songAlbum.value = "专辑名称"
        songCover.value = " "
    }
}

// 解析歌词
const parseLyric = (raw = '') =>{
    return raw.split("\n")
    .map((line) => line.trim())
    .filter((line) => line)
    .map((line) =>{
        // 去掉时间标签 例如：[00:12.34] 
        const text = line.replace(/^\[[^\]]*]/g,'').trim()
        return text || line
    })
}

// 获取歌词
const fetchLyric = async (id) =>{
    if(!id) return
    try{
        const res = (await api.get("/lyric",{ id })).data
        const raw = res.lrc?.lyric || ''   
        lyrics.value = parseLyric(raw)
    }catch(err){
        console.log("获取歌词失败",err);
        lyrics.value = []
    }
}


// 获取播放地址
const fetchSongUrl = async (id) =>{
    if (!id) return
    try{
        const res = (await api.get("/song/url",{ id })).data
        const item = (res.data || [])[0]   
        audioUrl.value = item?.url || ''
        currentTime.value = 0
        duration.value = 0
        isPlaying.value = false
    }catch(err){
        console.log("获取歌曲播放地址失败",err);
        audioUrl.value = ""
        isPlaying.value = false
    }
}

// 加载歌曲元数据
const handleLoadedMetadata = () =>{
    const audio = audioRef.value
    if(!audio) return
    duration.value = audio.duration || 0
    currentTime.value = audio.currentTime || 0
}

// 格式化时间
const formatTime = (sec) =>{
    if(!sec || !Number.isFinite(sec)) return "00:00"
    const s = Math.floor(sec)
    const m = Math.floor(s / 60)
    const rs = s % 60
    const mm = m.toString().padStart(2,"0")
    const ss = rs.toString().padStart(2,"0")
    return `${mm}:${ss}`
}

// 播放音乐事件
const handleTogglePlay = () => {
    const audio = audioRef.value
    if (!audio || !audioUrl.value) {
        console.error("没有可用的播放地址");
        return
    }
    
    if (audio.paused) {
        audio.play().catch(err => {
            console.warn("播放被浏览器拦截或资源加载失败:", err);
        })
        isPlaying.value = true
    } else {
        audio.pause()
        isPlaying.value = false
    }
}

// 歌曲播放结束
const handleAudioEnded = () =>{
    isPlaying.value = false
    currentTime.value = 0
}

// 歌曲播放时间更新
const handleTimeUpdate = () =>{
    const audio = audioRef.value
    if(!audio) return
    currentTime.value = audio.currentTime || 0
    if (audio.duration){
        duration.value = audio.duration
    }
}

const handleProgressClick = (event) =>{
    const bar = event.currentTarget
    const rect = bar.getBoundingClientRect()
    const ratio = (event.clientX - rect.left) / rect.width
    const audio = audioRef.value
    const newTime = duration.value * ratio
    if(!audio) return
    audio.currentTime = newTime
    currentTime.value = newTime
}

// 虚拟列表相关
const lyricContainerRef = ref(null)      // 歌词滚动容器 DOM
const rowHeight = 32                     // 每行大致高度（px），可以根据样式微调
const visibleCount = 15                  // 视口显示的行数
const buffer = 5                         // 上下缓冲行数，防止白边
const startIndex = ref(0)                // 当前渲染起始索引
const endIndex = computed(() => 
  Math.min(lyrics.value.length, startIndex.value + visibleCount + buffer * 2)
)
const totalHeight = computed(() => lyrics.value.length * rowHeight)
const offsetY = computed(() => startIndex.value * rowHeight)

// 滚动事件处理
const handleLyricScroll = () => {
  const el = lyricContainerRef.value
  if (!el) return
  const scrollTop = el.scrollTop
  const first = Math.floor(scrollTop / rowHeight) - buffer
  startIndex.value = Math.max(0, first)
}

onMounted(() =>{
    fetchSongDetail(songId.value)
    fetchLyric(songId.value)
    fetchSongUrl(songId.value)
})


</script>

<template>
  <div class="player-page">
    <div class="player-inner">
      <div class="player-main">
        <!-- 左侧：封面与基本信息 -->
        <div class="player-left">
          <div class="cover-wrap">
            <div
              class="cover-disc"
              :class="{'playing-animation':isPlaying,'paused-animation':!isPlaying}"
            >
              <img
                class="cover-img"
                :src="songCover"
                alt="封面"
              >
            </div>
          </div>
          <div class="song-meta">
            <h2 class="song-title">
              {{ songTitle }}
            </h2>
            <p class="song-artist">
              {{ songArtist }}
            </p>
            <p class="song-album">
              {{ songAlbum }}
            </p>
          </div>
        </div>
        <!-- 右侧：歌词 -->
        <div class="player-right">
          <div class="lyrics-card">
            <h3 class="lyrics-title">
              歌词
            </h3>
            <div
              ref="lyricContainerRef"
              class="lyrics-content"
              @scroll="handleLyricScroll"
            >
              <div
                class="lyrics-virtual-wrapper"
                :style="{ height: totalHeight + 'px' }"
              >
                <div
                  class="lyrics-virtual-inner"
                  :style="{ transform: `translateY(${offsetY}px)` }"
                >
                  <p
                    v-for="(line, idx) in lyrics.slice(startIndex, endIndex)"
                    :key="startIndex + idx"
                    class="lyrics-line"
                    :class="{ 'lyrics-line--highlight': startIndex + idx === 0 }"
                  >
                    {{ line }}
                  </p>
                </div>
              </div>
              <p
                v-if="!lyrics.length"
                class="lyrics-line"
              >
                暂无歌词
              </p>
            </div>
          </div>
        </div>
      </div>
      <!-- 底部：控制区 -->
      <div class="player-controls">
        <div class="controls-main">
          <button
            class="btn-circle btn-large"
            @click="handleTogglePlay"
          >
            {{ isPlaying ? '⏸' : '▶' }}
          </button>
        </div>
        <div class="progress-wrap">
          <span class="time-label">{{ formatTime(currentTime) }}</span>
          <div
            class="progress-bar"
            @click="handleProgressClick"
          >
            <div
              class="progress-inner"
              :style="{ width:duration ? `${(currentTime/duration) * 100}%` : '0%'}"
            />
          </div>
          <span class="time-label">{{ formatTime(duration) }}</span>
        </div>
        <audio 
          ref="audioRef"
                    
          :src="`https://music.163.com/song/media/outer/url?id=${songId}.mp3`"
          class="audio-hidden"
          @loadedmetadata="handleLoadedMetadata"
          @timeupdate="handleTimeUpdate"
          @ended="handleAudioEnded"
        />
      </div>
    </div>
  </div>
</template>
<style scoped>
.player-page {
  min-height: calc(100vh - 90px);
  background: radial-gradient(circle at top left, #2b2b2b, #000);
  color: #f5f5f5;
  display: flex;
  justify-content: center;
  padding: 40px 0;
  box-sizing: border-box;
}

.player-inner {
  width: 100%;
  max-width: 1200px;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  gap: 32px;
}

.player-main {
  width: 100%;
  display: flex;
  gap: 32px;
}

.player-left {
  width: 320px;
  display: flex;
  flex-direction: column;
  align-items: center;
}

.cover-wrap {
  width: 260px;
  height: 260px;
  border-radius: 50%;
  background: radial-gradient(circle, #444, #111);
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.7);
}

.cover-disc {
  width: 220px;
  height: 220px;
  border-radius: 50%;
  overflow: hidden;
}

.cover-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
  transition: transform 0.3s ease;
}
/* 旋转动画 */
@keyframes rotate{
  from{transform: rotate(0deg);}
  to{transform: rotate(360deg);}
}
.playing-animation{
  animation: rotate 8s linear infinite;
}
.paused-animation{
  animation-play-state: paused;
}

.song-meta {
  margin-top: 20px;
  text-align: center;
}

.song-title {
  margin: 0;
  font-size: 22px;
  font-weight: 600;
}

.song-artist,
.song-album{
  margin: 6px 0 0;
  font-size: 13px;
  color: #cfcfcf;
}

.player-right {
  flex: 1;
  display: flex;
  flex-direction: column;
  justify-content: center;
}

.lyrics-card {
  width: 100%;
  max-height: 520px;
  padding: 18px 24px;
  border-radius: 16px;
  background: transparent;
  box-shadow: none;
  box-sizing: border-box;
}

.lyrics-title {
  margin: 0 0 16px;
  font-size: 18px;
  color: #fff;
  text-align: center;
  letter-spacing: 1px;
}

.lyrics-content {
  max-height: 460px;
  overflow-y: auto;
  overflow-x: hidden;
  padding-right: 0;
}

.lyrics-line {
  margin: 6px 0;
  font-size: 16px;
  line-height: 1.6;
  color: rgba(255, 255, 255, 0.65);
  text-align: center;
  transition: color 0.2s ease, transform 0.2s ease;
  white-space: normal;
}

.lyrics-line--highlight {
  color: #ffffff;
  font-size: 18px;
  font-weight: 600;
  transform: scale(1.02);
}

.lyrics-content::-webkit-scrollbar {
  width: 0;
  height: 0;
}

.lyrics-content {
  scrollbar-width: none;
  scrollbar-color: transparent transparent;
}

.player-controls {
  width: 100%;
  padding: 16px 24px 0;
  box-sizing: border-box;
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.audio-hidden {
  display: none;
}

.controls-main {
  display: flex;
  align-items: center;
  gap: 24px;
}

.btn-circle {
  border-radius: 50%;
  border: none;
  cursor: pointer;
  background: #fff;
  color: #000;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 6px 18px rgba(0, 0, 0, 0.4);
}

.btn-large {
  width: 56px;
  height: 56px;
  font-size: 22px;
}

.btn-small {
  width: 40px;
  height: 40px;
  font-size: 18px;
}

.btn-circle:hover {
  transform: translateY(-1px);
}

.progress-wrap {
  display: flex;
  align-items: center;
  gap: 12px;
}

.time-label {
  font-size: 12px;
  color: #c0c0c0;
}

.progress-bar {
  flex: 1;
  height: 4px;
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.2);
  overflow: hidden;
}

.progress-inner {
  height: 100%;
  border-radius: 999px;
  background: linear-gradient(90deg, #ff4b2b, #ff416c);
}

.controls-extra {
  display: none;
}

.extra-left,
.extra-right {
  display: none;
}

.btn-text {
  display: none;
}

.btn-text:hover {
  color: #fff;
}

@media (max-width: 960px) {
  .player-inner {
    flex-direction: column;
  }

  .player-main {
    flex-direction: column;
    align-items: center;
  }

  .player-left {
    width: auto;
  }
}
.lyrics-virtual-wrapper {
  position: relative;
  width: 100%;
}

.lyrics-virtual-inner {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
}
</style>