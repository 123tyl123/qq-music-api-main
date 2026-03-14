import { defineStore } from "pinia"
import { ref,computed } from "vue" 
const STOREAGE_KEY = "nc_user"
export const useUserStore=defineStore('user',()=>{
  const user=ref(null)
  const isLoggedIn=computed(()=>user.value !== null)
  const setUser=(payload)=>{
    if(!payload) return
    const normalized={
    id:payload?.id || null,
    name:payload?.name || null,
    avatar:payload?.avatar || null,
  }
  user.value=normalized
  localStorage.setItem(STOREAGE_KEY,JSON.stringify(normalized))
  }
  const clearUser=()=>{
    user.value=null
    localStorage.removeItem(STOREAGE_KEY)
  }
  // 从本地存储中初始化用户信息
  const initFormLocal=()=>{
    const localUser=localStorage.getItem(STOREAGE_KEY)
    if(localUser){
      user.value=JSON.parse(localUser)
    }
  }
  initFormLocal()
  return{
    user,
    isLoggedIn,
    setUser,
    clearUser,
  }
}, {
  persist: true,
})
