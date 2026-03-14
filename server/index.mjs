import express from 'express'
import dotenv from 'dotenv'
import path from 'node:path'

// 约定：优先读取 .env.local（不提交），再读取 .env
dotenv.config({ path: path.resolve(process.cwd(), '.env.local'), override: false })
dotenv.config({ path: path.resolve(process.cwd(), '.env'), override: false })

const app = express()
app.use(express.json({ limit: '1mb' }))

const PORT = Number.parseInt(process.env.AI_SERVER_PORT || '3101', 10)

const getEnv = (k, fallback = '') => (process.env[k] == null ? fallback : String(process.env[k]))

const normalizeBaseUrl = (baseUrlRaw) => {
  const raw = (baseUrlRaw || '').trim().replace(/\/+$/, '')
  // DeepSeek 是 OpenAI 兼容接口，默认走 DeepSeek
  if (!raw) return 'https://api.deepseek.com/v1'
  if (raw.endsWith('/v1')) return raw
  return `${raw}/v1`
}

const safeJsonParse = (text) => {
  try {
    return { ok: true, value: JSON.parse(text) }
  } catch {
    return { ok: false, value: null }
  }
}

const extractJsonObject = (text) => {
  const t = String(text || '').trim()
  if (!t) return null

  // 1) 直接是 JSON
  const direct = safeJsonParse(t)
  if (direct.ok && direct.value && typeof direct.value === 'object') return direct.value

  // 2) 包在 ```json ... ``` 里
  const fenceMatch = t.match(/```json\s*([\s\S]*?)\s*```/i)
  if (fenceMatch?.[1]) {
    const fenced = safeJsonParse(fenceMatch[1])
    if (fenced.ok && fenced.value && typeof fenced.value === 'object') return fenced.value
  }

  // 3) 从第一个 { 到最后一个 } 截取
  const start = t.indexOf('{')
  const end = t.lastIndexOf('}')
  if (start >= 0 && end > start) {
    const sliced = t.slice(start, end + 1)
    const slicedParsed = safeJsonParse(sliced)
    if (slicedParsed.ok && slicedParsed.value && typeof slicedParsed.value === 'object') return slicedParsed.value
  }

  return null
}

const coercePlan = (obj) => {
  const intentRaw = obj?.intent
  const intent = intentRaw === 'hot' || intentRaw === 'playlist' || intentRaw === 'help' ? intentRaw : 'help'

  const limitNum = Number(obj?.limit)
  const limit = Number.isFinite(limitNum) ? Math.min(Math.max(Math.floor(limitNum), 5), 50) : 20

  const idxNum = Number(obj?.idx)
  const idx = intent === 'hot' && Number.isFinite(idxNum) ? Math.min(Math.max(Math.floor(idxNum), 0), 100) : 1

  const keywords = Array.isArray(obj?.keywords)
    ? obj.keywords.map((x) => String(x || '').trim()).filter(Boolean).slice(0, 8)
    : []

  const reply = obj?.reply ? String(obj.reply) : ''

  return { intent, keywords, limit, idx, reply }
}

async function callOpenAICompatiblePlan({ text, history = [] }) {
  const apiKey = getEnv('AI_API_KEY')
  if (!apiKey) {
    throw new Error('Missing AI_API_KEY')
  }

  const baseUrl = normalizeBaseUrl(getEnv('AI_BASE_URL', 'https://api.deepseek.com/v1'))
  const model = getEnv('AI_MODEL', 'deepseek-chat')

  const system = [
    '你是一个音乐助手的规划器（planner）。',
    '你的任务：把用户输入转成一个“工具调用计划”。',
    '',
    '请只输出严格 JSON（不要 markdown，不要解释）。',
    'JSON schema：',
    '{',
    '  "intent": "hot" | "playlist" | "help",',
    '  "keywords": string[],',
    '  "limit": number,',
    '  "idx": number,',
    '  "reply": string',
    '}',
    '',
    '规则：',
    '- 用户想看榜单/热歌/排行榜 => intent="hot"，idx=1（默认热歌榜），keywords=[]。',
    '- 用户描述“适合学习/运动/睡前/伤感/治愈/国风/说唱/摇滚/爵士”等 => intent="playlist"，给出 3-6 个中文关键词用于搜索。',
    '- 不确定就 intent="help"，reply 给出可用指令示例。',
    '- limit 默认 20，范围 5-50。',
  ].join('\n')

  const historyMessages = Array.isArray(history)
    ? history
        .filter((m) => m && typeof m.content === 'string' && m.content.trim())
        .map((m) => ({
          role: m.role === 'assistant' ? 'assistant' : 'user',
          content: String(m.content),
        }))
    : []

  const body = {
    model,
    temperature: 0.2,
    messages: [
      { role: 'system', content: system },
      ...historyMessages,
      { role: 'user', content: String(text || '') },
    ],
  }

  const resp = await fetch(`${baseUrl}/chat/completions`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  })

  if (!resp.ok) {
    const errText = await resp.text().catch(() => '')
    throw new Error(`LLM error ${resp.status}: ${errText.slice(0, 400)}`)
  }

  const json = await resp.json()
  const content = json?.choices?.[0]?.message?.content || ''
  const planObj = extractJsonObject(content)
  if (!planObj) {
    throw new Error(`LLM output not JSON: ${String(content).slice(0, 200)}`)
  }
  return coercePlan(planObj)
}

app.get('/api/ai/health', (req, res) => {
  res.json({
    ok: true,
    server: 'ai-proxy',
    baseUrl: normalizeBaseUrl(getEnv('AI_BASE_URL', 'https://api.deepseek.com/v1')),
    model: getEnv('AI_MODEL', 'deepseek-chat'),
    hasKey: Boolean(getEnv('AI_API_KEY')),
  })
})

app.post('/api/ai/plan', async (req, res) => {
  const text = req?.body?.text
  if (!text || typeof text !== 'string') {
    res.status(400).json({ ok: false, error: 'Missing text' })
    return
  }

  try {
    const plan = await callOpenAICompatiblePlan({ text, history: req.body?.history })
    res.json({ ok: true, plan })
  } catch (e) {
    res.status(500).json({ ok: false, error: String(e?.message || e) })
  }
})

app.listen(PORT, () => {
   
  console.log(`[ai-proxy] listening on http://localhost:${PORT}`)
})

