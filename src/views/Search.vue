<script setup>
import { ref ,computed ,onMounted ,onUnmounted ,watch} from 'vue'
import { useRoute ,useRouter} from 'vue-router'
import api from '@/api';
const route = useRoute()
const router = useRouter()   
const keyword = computed(() =>(route.query.keyword || '').toString())
const songList=ref([])
const loading=ref(false)
const loadMoreLoading=ref(false)  // 加载更多时的 loading
const hasMore=ref(true)           // 是否还有更多
const PAGE_SIZE = 20

/** 当前搜索请求的 AbortController，用于取消未完成的请求 */
let searchAbortController = null

const normalizeSong = (s) => ({
  id: s.id,
  name: s.name,
  artist: (s.artists || []).map((a) => a.name).join("/"),
  album: s.album?.name || '',
  durationMs: s.duration || 0
})


const fetchSearchResult=async(isLoadMore = false)=>{
  const kw=keyword.value.trim()
  if(!kw){
    songList.value=[]
    return
  }
  if (!isLoadMore) {
    // 新搜索：取消上一次未完成的请求
    searchAbortController?.abort()
    searchAbortController = new AbortController()
    songList.value=[]
    hasMore.value = true
    loading.value=true
  } else {
    if (loadMoreLoading.value || !hasMore.value) return
    loadMoreLoading.value = true
  }
  const offset = isLoadMore ? songList.value.length : 0
  const signal = searchAbortController?.signal
  let aborted = false
  try {
    const res=await api.get("/search",{ keywords: kw, limit: PAGE_SIZE, offset }, { signal })
    const songs=res.data?.result?.songs || []
    const list = songs.map(normalizeSong)
    if (isLoadMore) {
      songList.value = [...songList.value, ...list]
    } else {
      songList.value = list
    }
    hasMore.value = list.length >= PAGE_SIZE
  } catch (error) {
    if (error?.code === 'ERR_CANCELED' || error?.name === 'AbortError') {
      aborted = true
      return
    }
    console.log(isLoadMore ? "加载更多失败" : "搜索失败", error)
    if (!isLoadMore) hasMore.value = false
  } finally {
    if (!aborted) {
      loading.value = false
      loadMoreLoading.value = false
    }
  }
}

const loadMore = () => {
  if (!keyword.value.trim() || loading.value || loadMoreLoading.value || !hasMore.value) return
  fetchSearchResult(true)
}

// 滚动到底部加载更多：使用 Intersection Observer 监听底部占位元素
let observer = null
const loadMoreRef = ref(null)
onMounted(() => {
  fetchSearchResult()
  observer = new IntersectionObserver(
    (entries) => {
      const [entry] = entries
      if (entry?.isIntersecting) loadMore()
    },
    { root: null, rootMargin: '80px', threshold: 0 }
  )
})
watch(() => loadMoreRef.value, (el) => {
  if (!observer) return
  if (el) observer.observe(el)
  else observer.disconnect()
}, { flush: 'post' })
onUnmounted(() => {
  observer?.disconnect()
})

const formatDuration = (ms) =>{
    if (!ms) return "00:00"
    const totalSec = Math.floor(ms / 1000)
    const m = Math.floor(totalSec / 60)
    const s = totalSec % 60
    return `${m.toString().padStart(2,'0')}:${s.toString().padStart(2,'0')}`
}

const handlePlay = (id) =>{
    if(!id) return
    router.push({
        name:"player",
        query:{ id }
    })
}
let timer = null
watch(keyword,async()=>{
  clearTimeout(timer)
  timer = setTimeout(async()=>{
    await fetchSearchResult()
  },300)
})
</script>

<template>
  <div class="search-page">
    <div class="search-inner">
      <h2 class="title">
        搜索结果
      </h2>
      <p
        v-if="keyword"
        class="keyword"
      >
        关键字：{{ keyword }}
      </p>
      <p
        v-else
        class="keyword"
      >
        暂无关键字，请在顶部搜索框输入内容
      </p>
      <div
        v-if="loading"
        class="tip"
      >
        正在搜索中...
      </div>
      <div
        v-else-if="keyword&&!songList.length"
        class="tip"
      >
        未找到与 "{{ keyword }}" 相关的歌曲
      </div>
      <ul
        v-else
        class="song-list"
      >
        <li
          v-for="s in songList"
          :key="s.id"
          class="song-item"
          @click="handlePlay(s.id)"
        >
          <div class="song-main">
            <span class="song-name">{{ s.name }}</span>
            <span class="song-artist">{{ s.artist }}</span>
          </div>
          <div class="song-extra">
            <span class="song-album">{{ s.album }}</span>
            <span class="song-duration">{{ formatDuration(s.durationMs) }}</span>
          </div>
        </li>
      </ul>
      <!-- 底部占位：滚动到此区域时触发加载更多 -->
      <div
        v-if="keyword && songList.length > 0 && !loading"
        ref="loadMoreRef"
        class="load-more-sentinel"
      >
        <span
          v-if="loadMoreLoading"
          class="load-more-tip"
        >加载更多中...</span>
        <span
          v-else-if="!hasMore"
          class="load-more-tip"
        >没有更多了</span>
        <span
          v-else
          class="load-more-tip"
        >下拉加载更多</span>
      </div>
    </div>
  </div>
</template>
<style scoped>
.search-page{
   min-height: calc(100vh - 90px);
  padding: 24px 32px;
  box-sizing: border-box;
}
.search-inner{
  max-width: 1200px;
  margin: 0 auto;
}
.title{
  margin: 0 0 12px;
  font-size: 20px;
  font-weight: 600;
}
.keyword{
  margin: 0 0 16px;
  font-size: 14px;
  color: #666;
}
.tip{
  margin-top: 24px;
  font-size: 14px;
  color: #888;
}
.song-list{
  margin:16px 0 0;
  padding: 0;
  list-style: none;
  border-radius: 8px;
  background: #fff;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
}
.song-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 10px 16px;
  border-bottom: 1px solid #f2f2f2;
  cursor: pointer;
  font-size: 13px;
}
.song-item:last-of-type {
  border-bottom: none;
}
.song-item:hover {
  background: #fafafa;
}
.song-main {
  display: flex;
  flex-direction: column;
  max-width: 60%;
}
.song-name {
  font-size: 14px;
  color: #333;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.song-artist {
  margin-top: 2px;
  color: #999;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.song-extra {
  display: flex;
  align-items: center;
  gap: 16px;
  max-width: 40%;
  justify-content: flex-end;
}
.song-album {
  color: #666;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.song-duration {
  color: #999;
  flex-shrink: 0;
}
.load-more-sentinel {
  padding: 16px;
  text-align: center;
}
.load-more-tip {
  font-size: 13px;
  color: #999;
}
</style>