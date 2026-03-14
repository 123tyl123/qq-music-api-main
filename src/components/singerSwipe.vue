<script setup>
import { ref, onMounted } from 'vue'
import api from '../api/index'
// 辅助函数：将数组切成指定大小的小块
const chunk = (arr, size) => {
  return Array.from({ length: Math.ceil(arr.length / size) }, (v, i) =>
    arr.slice(i * size, i * size + size)
  )
}

// 在 fetchTopArtists 或者初始化逻辑中
const singerSlides = ref([])
const swipeRef = ref(null)

const fetchSingerRank = async () => {
  try {
    const res = await api.get("/top/artists")
    // 这里的路径通常是 res.data.artists
    const allArtists = (res.data.artists || []).slice(0, 20) 
    
    const formatted = allArtists.map((item, index) => ({
      id: item.id,
      name: item.name,
      rank: index + 1,
      avatar: item.picUrl + '?param=120y120'
    }))
    
    singerSlides.value = chunk(formatted, 5)
  } catch (err) {
    console.error("获取歌手榜失败:", err)
  }
}

onMounted(() => {
  fetchSingerRank()
})
</script>

<template>
  <div class="singer-section">
    <h2 class="section-title">
      歌手榜单
    </h2>

    <van-swipe 
      ref="swipeRef" 
      class="singer-swipe" 
      :loop="true"
      :autoplay="5000"
    >
      <van-swipe-item
        v-for="(slide, index) in singerSlides"
        :key="index"
      >
        <ul class="singer-list">
          <li
            v-for="singer in slide"
            :key="singer.id"
            class="singer-item"
          >
            <div class="singer-avatar">
              <img
                :src="singer.avatar"
                :alt="singer.name"
                loading="lazy"
              >
            </div>
            <span class="singer-name">
              <i class="rank-tag">{{ singer.rank }}</i> 
              {{ singer.name }}
            </span>
          </li>
        </ul>
      </van-swipe-item>

      <template #indicator>
        <span />
      </template>
    </van-swipe>

    <div class="singer-controls">
      <button
        class="arrow-btn"
        @click="swipeRef?.prev()"
      >
        ‹
      </button>
      <button
        class="arrow-btn"
        @click="swipeRef?.next()"
      >
        ›
      </button>
    </div>
  </div>
</template>
<style scoped>
/* 标题样式，确保与 MusicHall 一致 */
.section-title {
  margin: 0 0 16px;
  margin-top: 40px;
  font-size: 20px;
  font-weight: 600;
  color: #333;
  margin-top: 68px;
  font-size: 22px;
  text-align: center;
}
/* 轮播区域容器 */
.singer-section {
  position: relative;
  padding: 0 40px; /* 为左右按钮留出空间 */
}

.singer-swipe {
  height: 150px;
}

.singer-list {
  display: flex;
  justify-content: center;
  gap: 40px;
  align-items: center;
  height: 100%;
  list-style: none;
  padding: 0;
}

.singer-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  transition: transform 0.3s ease;
  cursor: pointer;
}

.singer-item:hover {
  transform: translateY(-5px); /* 悬停微动特效 */
}

.singer-avatar {
  width: 80px;
  height: 80px;
  border-radius: 50%;
  overflow: hidden;
  box-shadow: 0 4px 12px rgba(0,0,0,0.1); /* 柔和阴影 */
  margin-bottom: 10px;
  background: #eee;
}

.singer-avatar img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.singer-name {
  font-size: 13px;
  color: #333;
  display: flex;
  align-items: center;
  gap: 4px;
}

.rank-tag {
  font-style: normal;
  color: #ff4d4f; /* 排名高亮色 */
  font-weight: bold;
}

/* 按钮样式 */
.singer-controls {
  margin: 0 200px;
  position: absolute;
  top: 50%;
  left: 0;
  right: 0;
  transform: translateY(-50%);
  display: flex;
  justify-content: space-between;
  pointer-events: none; /* 防止遮挡中间的点击事件 */
}

.arrow-btn {
  width: 30px;
  height: 30px;
  border: none;
  background: rgba(0,0,0,0.05);
  border-radius: 50%;
  cursor: pointer;
  pointer-events: auto; /* 按钮恢复点击 */
  font-size: 20px;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: background 0.3s;
}

.arrow-btn:hover {
  background: rgba(0,0,0,0.1);
}
</style>