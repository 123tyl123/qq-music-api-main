import { defineStore } from 'pinia'
import { ref } from 'vue'
import api from '@/api'

export const useMusicStore = defineStore('music',
  ()=>{
    const playlists = ref([])
    const newSongs = ref([])
    const newSongsLoading = ref(false)
    const playlistsLoading = ref(false)
    const singerRank = ref([])
    
    
    const fetchPlaylists = async () => {
      // 策略：如果缓存里没数据，才显示骨架屏。如果有缓存，直接静默更新
      if (playlists.value.length === 0) {
        playlistsLoading.value = true
      }
  
      try {
        const res = await api.get("/personalized", { limit: 5 })
        const data = res.data.result || []
        
        // 映射数据格式
        playlists.value = data.map(item => {
          const cover = item.picUrl + '?param=200y200'
          // 检查是否已经存在该项，且图片地址没变
          const existing = playlists.value.find(p => p.id === item.id)
          return {
            id: item.id,
            title: item.name,
            desc: item.copywriter || '',
            cover: cover,
            // 如果图片地址没变，保留之前的加载状态，防止刷新时闪烁
            loaded: existing && existing.cover === cover ? existing.loaded : false
          }
        })
      } catch (err) {
        console.error("获取歌单失败:", err)
      } finally {
        playlistsLoading.value = false
      }
    }

    const fetchNewSongs = async () => {
      // 策略：如果缓存里没数据，才显示骨架屏。如果有缓存，直接静默更新
      if (newSongs.value.length === 0) {
        newSongsLoading.value = true
      }
      try {
        const res = await api.get("/personalized/newsong", { limit: 10 })
        const data = res.data.result || []
        newSongs.value = data.map(item => {
          const cover = item.picUrl + '?param=400y400'
          const existing = newSongs.value.find(s => s.id === item.id)
          return {
            id: item.id,
            name: item.name,
            cover: cover,
            artist: item.song?.artists?.map((a) => a.name).join('/') || '',
            loaded: existing && existing.cover === cover ? existing.loaded : false
          }
        })
      } catch (error) {
        console.error("获取新歌失败:", error)
      } finally {
        newSongsLoading.value = false
      }
    }

    const fetchSingerRank=async()=>{
      const res = await api.get("/top/artists")
      const list=res.data.artists.slice(0,5)
      singerRank.value = (list || []).map((item,index) => ({
        id: item.id,
        name: item.name,
        avatar: item.picUrl+'?param=200y200',
        rank: index+1
      }))
    }

    const initHomePage = async () => {
      // 如果有缓存数据，强制将 loaded 设为 true，防止刷新时图片因为 state 重置而变透明
      if (playlists.value.length > 0) {
        playlists.value.forEach(item => item.loaded = true)
      }
      if (newSongs.value.length > 0) {
        newSongs.value.forEach(item => item.loaded = true)
      }
      
      try {
        // 并行获取数据，fetch 内部已优化为保留已有数据的 loaded 状态
        await Promise.all([fetchPlaylists(), fetchNewSongs()])
      } catch (err) {
        console.error("首页初始化失败:", err)
      }
    }
    return {
      playlists,
      playlistsLoading,
      newSongs,
      newSongsLoading,
      fetchPlaylists,
      fetchNewSongs,
      initHomePage,
      singerRank,
      fetchSingerRank,
    }
  },{
    persist:true
  }
)