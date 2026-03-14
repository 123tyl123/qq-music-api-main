<script setup>
import { showConfirmDialog } from "vant"
import { ref ,onMounted,watch,onBeforeUnmount,onUnmounted} from "vue"
import { useRouter } from "vue-router"
import api from "@/api"
import { useUserStore } from "@/stores/user"
const show = ref(true)
const qrImg = ref("") // 模拟二维码
// 拦截关闭逻辑
const router=useRouter()
const beforeClose = () => {
  return new Promise((resolve)=>{
    showConfirmDialog({
        title: '提示',
        message: '确定要退出扫码登录吗？',
      }).then(()=>{
        resolve(true)
        router.push('/')
        clearInterval(qrCheckTimer.value)
      }).catch(()=>{
       return false
      })
  })}
  const loginKey=ref('')
  // 获取二维码登录的key
  const fetchLoginKey=async()=>{
   try {
     const res=await api.get('/login/qr/key')
     loginKey.value=res.data.data.unikey
   } catch (error) {
     console.error('获取二维码登录 key 失败', error)
    loginKey.value = ''
   }
  }
  const fetchQrImage=async(key)=>{
    if(!key){
      console.error('登录 key 为空')
      return
    }
    try {
      const res = await api.get('/login/qr/create', {
        key,
        qrimg: true,
        timestamp: Date.now(),
        ua: 'pc',
      })
      qrImg.value=res.data.data.qrimg
    } catch (error) {
      console.error('获取二维码登录图片失败', error)
      qrImg.value = ''
    }
  }
  watch(loginKey, (newKey) => {
    if (newKey) {
      fetchQrImage(newKey)
    }
  })
  onMounted(() => {
    fetchLoginKey()
  })
  // 轮询二维码状态，成功后保存用户信息
  const store=useUserStore()
  // 二维码检查定时器
const qrCheckTimer = ref(null)
const isExpired = ref(false) // 新增状态：是否过期
const startQrCheck=(key)=>{
  if(!key){
    console.error('登录 key 为空')
    return
  }
  if(qrCheckTimer.value){
    clearInterval(qrCheckTimer.value)
  }
  qrCheckTimer.value=setInterval(async()=>{
  try {
      const res=await api.get('/login/qr/check',{
        key,
        timestamp: Date.now(),
        ua: 'pc',
      })
      if(res.code===800){
        clearInterval(qrCheckTimer.value)
        isExpired.value = true
        return
      }
      if(res.code===803){
        clearInterval(qrCheckTimer.value)
           try {
        // 授权成功在调用login/status获取完整用户信息
        const statusRes=await api.get('/login/status',{
          timestamp: Date.now(),
          ua: 'pc',
        })
        const profile=statusRes.data.data.profile
        if(profile){
          store.setUser({
            id:profile.userId,
            name:profile.nickname,
            avatar:profile.avatarUrl,
          })
        }
    } catch (error) {
      console.error('获取用户信息失败', error)
    }
    router.push('/')
      }
  } catch (error) {
    console.error('检查二维码状态失败', error)
  }
  },5000)
}
const handleRefreshQR=async()=>{
 // 1. 重置所有状态
  qrImg.value = ""
  isExpired.value = false
  loginKey.value = ""
    fetchLoginKey()
}
watch(qrImg, (newImg) => {
  if (newImg&&loginKey.value) {
    startQrCheck(loginKey.value)
  }
})
onBeforeUnmount(()=>{
  if(qrCheckTimer.value){
    clearInterval(qrCheckTimer.value)
    qrCheckTimer.value=null
  }
})
onUnmounted(()=>{
  if(qrCheckTimer.value){
    clearInterval(qrCheckTimer.value)
    qrCheckTimer.value=null
  }
})

</script>

<template>
  <van-dialog 
    v-model:show="show" 
    :show-confirm-button="false"
    close-on-click-overlay  
    width="520px"
    class="custom-login-dialog"
    :before-close="beforeClose"
    @click-overlay="beforeClose"
  >
    <div class="login-header">
      <h2>扫码登录网易云音乐</h2>
      <p>使用网易云音乐 APP 扫码登录，更安全更快捷</p>
    </div>

    <div class="login-body">
      <div class="qrcode-box">
        <div class="qrcode-placeholder">
          <img
            v-if="qrImg"
            :src="qrImg"
            alt="登录二维码" 
            :class="{'qr-blur':isExpired}"
          >
          <div
            v-if="isExpired"
            class="qr-expired-mask"
            @click="handleRefreshQR"
          >
            <van-icon
              name="replay"
              size="30"
            />
            <span>二维码已失效</span>
            <span class="refresh-btn">点击刷新</span>
          </div>
          <div
            v-else-if="!qrImg"
            class="loading-status"
          >
            <van-loading
              size="24px"
              vertical
            >
              二维码加载中...
            </van-loading>
          </div>
        </div>
        <p class="qrcode-tip">
          打开网易云音乐 APP，扫一扫登录
        </p>
      </div>

      <ul class="login-features">
        <li>同步收藏的歌单、歌曲和播放记录</li>
        <li>多端同步，随时随地畅听音乐</li>
        <li>更安全的扫码登录方式</li>
      </ul>
    </div>
  </van-dialog>
</template>

<style scoped>
/* 关键点 2: 既然用了 teleport="null"，:deep 就生效了 */
/* :deep(.van-dialog) {
  padding: 24px 32px 32px;
  border-radius: 8px;
  background: #ffffff;
  box-shadow: 0 6px 20px rgba(0, 0, 0, 0.3);
  box-sizing: border-box;
} */

.login-header h2 {
  margin: 0;
  font-size: 22px;
  color: #333;
  padding: 24px 32px 8px;
}

.login-header p {
  margin: 0 0;
  font-size: 14px;
  color: #666;
  padding: 0 32px;
}

.login-body {
  margin-top: 20px;
  display: flex;
  gap: 20px;
  margin-bottom: 20px;
}
.qrcode-box {
  text-align: center;
  margin-left: 32px;

}

.qrcode-placeholder {
  width: 180px;
  height: 180px;
  border-radius: 4px;
  background: #f5f5f5;
  border: 1px solid #e1e1e1;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #999;
  font-size: 14px;
  position: relative;
}

.qrcode-placeholder img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
}

.qrcode-tip {
  margin-top: 15px;
  font-size: 13px;
  color: #333;
}

.login-features {
  list-style: none;
  padding: 0;
  margin: 0 20px 0 0;
  font-size: 13px;
  color: #555;
}


.login-features li + li {
  margin-top: 5px;
}

/* 小技巧：加个小圆点 */
.login-features li::before {
  content: "•";
  margin-right: 8px;
  color: #e03f3f;
}
.qrcode-placeholder {
  position: relative; /* 必须为相对定位 */
  width: 180px;
  height: 180px;
}

.qr-blur {
  filter: blur(4px); /* 二维码模糊掉，增加设计感 */
  opacity: 0.3;
}

.qr-expired-mask {
  position: absolute;
  inset: 0;
  background: rgba(255, 255, 255, 0.8);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  color: #333;
}

.qr-expired-mask span {
  font-size: 14px;
  margin-top: 8px;
}

.refresh-btn {
  color: #e03f3f;
  font-weight: bold;
  text-decoration: underline;
}
</style>