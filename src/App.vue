<script setup>
import { RouterView } from 'vue-router'
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import AiMusicAssistant from '@/components/AiMusicAssistant.vue'
const router = useRouter()
const searchKeyword=ref('')
const handleSearch=()=>{
  if(searchKeyword.value.trim()){
    router.push({
      path:'/search',
      query:{
        keyword:searchKeyword.value.trim(),
      }
    })
  }
}
</script>

<template>
  <div class="app">
    <header class="top-nav">
      <div class="top-nav-inner">
        <div class="logo">
          <a
            href="/#"
            hidefocus="true"
          >网易云音乐</a>
        </div>
        <nav class="nav-links">
          <router-link
            to="/"
            class="nav-link"
          >
            音乐馆
          </router-link>
          <router-link
            to="/mymusic"
            class="nav-link"
          >
            我的音乐
          </router-link>
        </nav>
        <div class="nav-actions">
          <div class="search-box">
            <input
              v-model="searchKeyword"
              class="search-input" 
              type="text"
              placeholder="搜索音乐、歌手、专辑" 
              @keyup.enter="handleSearch"
            >
          </div>
          <router-link
            to="/login"
            class="login-btn"
          >
            登录
          </router-link>
        </div>
      </div>
    </header>
    <main class="main-view">
      <RouterView />
    </main> 
    <AiMusicAssistant />
  </div>
</template>
<style>
.app{
  min-height: 100vh;
  display: flex;
  flex-direction: column;
   background: #f5f7fb;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue',
    Arial, 'Noto Sans', sans-serif;
}
.top-nav {
  /* --- 核心吸顶代码 --- */
  position: sticky;      /* 粘性定位 */
  top: 0;                /* 吸附在最顶部 */
  z-index: 2000;         /* 确保层级高于轮播图和图片，防止被遮挡 */
  /* ------------------ */

  height: 90px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #242424;
  color: #ebe3e3;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
}

/* 进阶：给导航栏增加一点高级的“毛玻璃”半透明感（可选） */
.top-nav {
  background: rgba(36, 36, 36, 0.95); /* 稍微降低透明度 */
  backdrop-filter: blur(10px);        /* 背景模糊，非常有质感 */
}

/* 修复 NProgress 被导航栏遮挡的问题 */
#nprogress .bar {
  background: #c20c0c !important; /* 网易红，更显眼 */
  height: 3px !important;        /* 稍微加粗一点点 */
  z-index: 9999 !important;      /* 确保在最顶层，超过 top-nav 的 2000 */
}

#nprogress .peg {
  box-shadow: 0 0 10px #c20c0c, 0 0 5px #c20c0c !important;
}

.top-nav-inner{
  width: 100%;
  max-width: 1200px;
  padding: 0 32px;
  display: flex;
  align-items: center;
  justify-content: flex-start;
  
}
.logo{
    background: url(./assets/imgs/topbar.png) no-repeat 0 9999px;
    width: 176px;
    height: 69px;
    float: left;
    background-position: 0 0;
}
.logo a{
  float: left;
  width: 157px;
  height: 100%;
  text-indent: -9999px;
  padding-right: 20px;

}
.nav-actions{
  display: flex;
  align-items: center;
  margin-left: auto;
}
.search-box{
  margin-right: 16px;
}
.login-btn {
  padding: 6px 16px;
  border-radius: 999px;
  border: 1px solid #c20c0c;
  color: #c20c0c;
  font-size: 14px;
  text-decoration: none;
  transition: all 0.2s;
}
.login-btn:hover {
  background: #c20c0c;
  color: #ffffff;
}
.nav-links {
  display: flex;
  gap:24px;
  margin-left: 24px;
}
.nav-link {
  color: #e5e5e5;
  text-decoration: none;
  font-size: 16px;
  padding: 8px 16px;
  border-radius: 18px;
  transition: all 0.2s;
}

.router-link-active {
  color: #fff;
  background: #c20c0c;
}
.search-input {
  width: 180px;
  height: 32px;
  padding: 0 12px;
  border-radius: 16px;
  border: none;
  outline: none;
  background: #fff;
  font-size: 13px;
  color: #333;
}
.search-input::placeholder {
  color: #999;
}
</style>
