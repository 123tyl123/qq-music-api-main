<script setup>
import { computed, nextTick, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { handleAiMusicMessage } from '@/agent/aiMusicAgent'

const router = useRouter()

const makeId = () =>
  globalThis.crypto?.randomUUID ? globalThis.crypto.randomUUID() : `${Date.now()}-${Math.random().toString(16).slice(2)}`

const open = ref(false)
const input = ref('')
const sending = ref(false)
const messages = ref([
  {
    id: makeId(),
    role: 'assistant',
    type: 'text',
    content: '我是 AI 音乐小助手：可以帮你获取热歌榜，也可以根据文字生成歌单。\n试试说：“给我热歌榜” 或 “生成一个适合学习的歌单”。',
    ts: Date.now(),
  },
])

const listRef = ref(null)

const canSend = computed(() => input.value.trim().length > 0 && !sending.value)

const scrollToBottom = async () => {
  await nextTick()
  const el = listRef.value
  if (!el) return
  el.scrollTop = el.scrollHeight
}

const pushMsg = async (msg) => {
  messages.value.push({
    id: makeId(),
    ts: Date.now(),
    ...msg,
  })
  await scrollToBottom()
}

const send = async (presetText) => {
  const text = (presetText ?? input.value).trim()
  if (!text || sending.value) return

  if (presetText == null) input.value = ''
  await pushMsg({ role: 'user', type: 'text', content: text })

  sending.value = true
  await pushMsg({ role: 'assistant', type: 'status', content: '正在思考并调用工具…' })

  try {
    // 将最近的多轮对话整理成 LLM 可读的 history
    const history = messages.value
      .filter((m) => m.type === 'text')
      .slice(-10)
      .map((m) => ({
        role: m.role === 'user' ? 'user' : 'assistant',
        content: m.content,
      }))

    const res = await handleAiMusicMessage(text, history)

    // 替换掉最后一条 status（如果存在）
    const last = messages.value[messages.value.length - 1]
    if (last?.role === 'assistant' && last?.type === 'status') {
      messages.value.pop()
    }

    if (res.type === 'songs') {
      await pushMsg({
        role: 'assistant',
        type: 'songs',
        title: res.title,
        content: res.assistantText,
        songs: res.songs || [],
      })
    } else {
      await pushMsg({ role: 'assistant', type: 'text', content: res.assistantText })
    }
  } catch {
    const last = messages.value[messages.value.length - 1]
    if (last?.role === 'assistant' && last?.type === 'status') {
      messages.value.pop()
    }
    await pushMsg({ role: 'assistant', type: 'text', content: '请求失败了，我稍后再试试。你也可以换个说法。' })
  } finally {
    sending.value = false
    await scrollToBottom()
  }
}

const playSong = (id) => {
  if (!id) return
  open.value = false
  router.push({ name: 'player', query: { id } })
}

onMounted(() => {
  scrollToBottom()
})
</script>

<template>
  <div class="ai-assistant">
    <button
      class="fab"
      type="button"
      @click="open = true"
    >
      AI
    </button>

    <van-popup
      v-model:show="open"
      position="right"
      class="popup"
      :overlay="true"
    >
      <div class="panel">
        <div class="header">
          <div class="title">
            <div class="name">
              AI 音乐小助手
            </div>
            <div class="sub">
              热歌榜 · 文本生成歌单（Agent 工具调用）
            </div>
          </div>
          <button
            class="close"
            type="button"
            @click="open = false"
          >
            ×
          </button>
        </div>

        <div class="quick">
          <van-button
            size="small"
            type="primary"
            plain
            @click="send('给我热歌榜')"
          >
            热歌榜
          </van-button>
          <van-button
            size="small"
            type="primary"
            plain
            @click="send('生成一个适合学习的歌单')"
          >
            学习歌单
          </van-button>
          <van-button
            size="small"
            type="primary"
            plain
            @click="send('来点运动燃一点的歌单')"
          >
            运动歌单
          </van-button>
        </div>

        <div
          ref="listRef"
          class="list"
        >
          <div
            v-for="m in messages"
            :key="m.id"
            class="msg"
            :class="[`role-${m.role}`, `type-${m.type}`]"
          >
            <div
              v-if="m.type === 'songs'"
              class="bubble"
            >
              <div class="bubble-title">
                {{ m.title }}
              </div>
              <div class="bubble-text">
                {{ m.content }}
              </div>
              <ul class="song-ul">
                <li
                  v-for="s in m.songs"
                  :key="s.id"
                  class="song-li"
                  @click="playSong(s.id)"
                >
                  <div class="song-name">
                    {{ s.name }}
                  </div>
                  <div class="song-sub">
                    {{ s.artist }}<span v-if="s.album"> · {{ s.album }}</span>
                  </div>
                </li>
              </ul>
            </div>

            <div
              v-else
              class="bubble"
            >
              <div class="bubble-text">
                {{ m.content }}
              </div>
            </div>
          </div>
        </div>

        <div class="inputbar">
          <van-field
            v-model="input"
            placeholder="例如：生成一个适合睡前放松的歌单"
            :disabled="sending"
            @keyup.enter="send()"
          />
          <van-button
            type="primary"
            :loading="sending"
            :disabled="!canSend"
            @click="send()"
          >
            发送
          </van-button>
        </div>
      </div>
    </van-popup>
  </div>
</template>

<style scoped>
.fab {
  position: fixed;
  right: 22px;
  bottom: 22px;
  z-index: 3000;
  width: 52px;
  height: 52px;
  border-radius: 999px;
  border: none;
  cursor: pointer;
  color: #fff;
  font-weight: 700;
  background: linear-gradient(135deg, #c20c0c, #ff4d4f);
  box-shadow: 0 10px 24px rgba(194, 12, 12, 0.28);
}
.fab:hover {
  filter: brightness(1.03);
}

.popup {
  width: min(420px, 92vw);
  height: min(680px, 82vh);
  background: transparent;
}
.panel {
  height: 100%;
  background: #ffffff;
  display: flex;
  flex-direction: column;
  border-left: 1px solid #eee;
}
.header {
  padding: 14px 14px 10px;
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px;
  border-bottom: 1px solid #f0f0f0;
}
.title .name {
  font-size: 16px;
  font-weight: 700;
  color: #111;
}
.title .sub {
  margin-top: 4px;
  font-size: 12px;
  color: #888;
}
.close {
  width: 30px;
  height: 30px;
  border-radius: 8px;
  border: 1px solid #eee;
  background: #fff;
  cursor: pointer;
  font-size: 18px;
  line-height: 28px;
  color: #555;
}
.close:hover {
  background: #fafafa;
}

.quick {
  padding: 10px 14px 0;
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
}

.list {
  padding: 12px 14px;
  flex: 1;
  overflow: auto;
  background: linear-gradient(180deg, #fff, #fbfbfb);
}

.msg {
  display: flex;
  margin-bottom: 10px;
}
.role-user {
  justify-content: flex-end;
}
.role-assistant {
  justify-content: flex-start;
}

.bubble {
  max-width: 92%;
  border-radius: 14px;
  padding: 10px 12px;
  font-size: 13px;
  line-height: 1.45;
  white-space: pre-wrap;
  word-break: break-word;
}
.role-user .bubble {
  background: #c20c0c;
  color: #fff;
}
.role-assistant .bubble {
  background: #fff;
  color: #222;
  border: 1px solid #eee;
}
.type-status .bubble {
  color: #666;
  background: #fff7f7;
  border-color: #ffd6d6;
}

.bubble-title {
  font-weight: 700;
  margin-bottom: 6px;
}
.bubble-text {
  color: inherit;
}

.song-ul {
  margin: 10px 0 0;
  padding: 0;
  list-style: none;
  border-top: 1px solid #f3f3f3;
}
.song-li {
  padding: 10px 0;
  border-bottom: 1px solid #f3f3f3;
  cursor: pointer;
}
.song-li:last-child {
  border-bottom: none;
}
.song-li:hover {
  background: #fafafa;
  margin: 0 -12px;
  padding: 10px 12px;
  border-radius: 10px;
}
.song-name {
  font-size: 13px;
  font-weight: 600;
  color: #222;
}
.song-sub {
  margin-top: 2px;
  font-size: 12px;
  color: #888;
}

.inputbar {
  padding: 10px 12px;
  display: grid;
  grid-template-columns: 1fr auto;
  gap: 10px;
  border-top: 1px solid #f0f0f0;
  background: #fff;
}
</style>

