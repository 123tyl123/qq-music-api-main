import { generatePlaylistFromText, getHotSongs } from './tools'

const planWithLLM = async (text, history = []) => {
  const payload = {
    text,
    history: Array.isArray(history)
      ? history
          .filter((m) => m && typeof m.content === 'string' && m.content.trim())
          .map((m) => ({
            role: m.role === 'assistant' ? 'assistant' : 'user',
            content: String(m.content),
          }))
      : [],
  }

  const resp = await fetch('/api/ai/plan', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  })
  const json = await resp.json().catch(() => null)
  if (!resp.ok || !json?.ok) {
    const msg = json?.error ? String(json.error) : `HTTP ${resp.status}`
    throw new Error(msg)
  }
  return json.plan
}

const inferIntent = (text) => {
  const t = (text || '').trim()
  if (!t) return { intent: 'help' }

  if (/热歌|热榜|排行榜|榜单|top/i.test(t)) return { intent: 'hot' }
  if (/歌单|推荐|生成|来点|想听|适合/i.test(t)) return { intent: 'playlist', query: t }
  if (/帮助|怎么玩|怎么用|功能|指令/.test(t)) return { intent: 'help' }
  return { intent: 'help' }
}

export async function handleAiMusicMessage(text, history = []) {
  // 优先走“真 AI 规划”；不可用时降级为本地规则
  let intent = 'help'
  let query = ''
  let planReply = ''
  let idx = 1
  let keywords = []
  let limit = 20

  try {
    const plan = await planWithLLM(text, history)
    intent = plan?.intent || 'help'
    planReply = plan?.reply || ''
    idx = Number.isFinite(Number(plan?.idx)) ? Number(plan.idx) : 1
    keywords = Array.isArray(plan?.keywords) ? plan.keywords : []
    limit = Number.isFinite(Number(plan?.limit)) ? Number(plan.limit) : 20
    query = (keywords && keywords.length) ? keywords.join(' ') : String(text || '')
  } catch {
    const local = inferIntent(text)
    intent = local.intent
    query = local.query || ''
  }

  if (intent === 'hot') {
    const songs = await getHotSongs({ idx, limit })
    return {
      type: 'songs',
      title: '热歌榜 Top 20',
      assistantText: songs.length ? '已为你获取热歌榜，点歌曲可直接播放。' : '热歌榜获取失败或为空，你可以稍后再试。',
      songs,
      meta: { tool: 'getHotSongs', ok: songs.length > 0 },
    }
  }

  if (intent === 'playlist') {
    const songs = await generatePlaylistFromText(query, { limit, perKeyword: 8 })
    return {
      type: 'songs',
      title: '为你生成的歌单（基于关键词检索）',
      assistantText: songs.length
        ? (planReply || '我根据你的描述做了关键词拆解并检索歌曲，先给你一份可直接播放的歌单。你也可以补充风格/语言/年代，我会再生成一版。')
        : '我没检索到合适的结果。你可以换个描述（例如“运动燃一点的中文说唱”）再试一次。',
      songs,
      meta: { tool: 'generatePlaylistFromText', ok: songs.length > 0 },
    }
  }

  return {
    type: 'text',
    assistantText:
      '你可以这样对我说：\n- “给我热歌榜”\n- “生成一个适合学习的歌单”\n- “来点伤感 emo 的歌单”\n\n我会根据你的意图选择工具（热歌榜 / 文字生成歌单）并返回可播放列表。',
    meta: { tool: 'help', ok: true },
  }
}

