import api from '@/api'

const uniqById = (list) => {
  const map = new Map()
  for (const item of list || []) {
    if (!item?.id) continue
    if (!map.has(item.id)) map.set(item.id, item)
  }
  return Array.from(map.values())
}

const normalizeSong = (s) => {
  if (!s) return null
  const artists = s.ar || s.artists || s.artists?.artists || []
  const artist = (artists || []).map((a) => a?.name).filter(Boolean).join('/')
  const album = s.al?.name || s.album?.name || ''
  const id = s.id
  const name = s.name || ''
  return id ? { id, name, artist, album } : null
}

export async function getHotSongs({ idx = 1, limit = 20 } = {}) {
  // 优先使用榜单接口：/top/list?idx=1（云音乐热歌榜）
  try {
    const res = await api.get('/top/list', { idx })
    const tracks = res?.data?.playlist?.tracks || []
    const list = tracks.map(normalizeSong).filter(Boolean).slice(0, limit)
    if (list.length) return list
  } catch {
    // fallback below
  }

  // 兜底：新歌速递 /top/song?type=0（全部）
  const res2 = await api.get('/top/song', { type: 0 })
  const data = res2?.data?.data || []
  return data.map(normalizeSong).filter(Boolean).slice(0, limit)
}

const KEYWORD_PACKS = [
  { re: /运动|跑步|健身|动感|燃/, keywords: ['运动', '跑步', '燃'] },
  { re: /学习|写作业|专注|通勤|工作/, keywords: ['学习', '专注', '通勤'] },
  { re: /睡前|助眠|放松|冥想/, keywords: ['助眠', '轻音乐', '放松'] },
  { re: /开心|治愈|元气|阳光/, keywords: ['治愈', '元气', '快乐'] },
  { re: /伤感|失恋|难过|emo/, keywords: ['伤感', 'emo', '失恋'] },
  { re: /派对|蹦迪|夜店|电音/, keywords: ['电音', '派对', 'EDM'] },
  { re: /民谣/, keywords: ['民谣'] },
  { re: /说唱|嘻哈|rap/i, keywords: ['说唱', 'RAP'] },
  { re: /摇滚/, keywords: ['摇滚'] },
  { re: /爵士/, keywords: ['爵士'] },
  { re: /古风|国风/, keywords: ['国风', '古风'] },
]

const buildSearchKeywords = (text) => {
  const t = (text || '').trim()
  if (!t) return []

  const picked = []
  for (const pack of KEYWORD_PACKS) {
    if (pack.re.test(t)) picked.push(...pack.keywords)
  }

  // 如果用户本身输入了明确歌单主题，也作为一个兜底关键词
  const fallback = t.length > 20 ? t.slice(0, 20) : t
  picked.push(fallback)

  // 去重 + 控制数量，避免请求太多
  return Array.from(new Set(picked.filter(Boolean))).slice(0, 6)
}

export async function generatePlaylistFromText(text, { limit = 20, perKeyword = 8 } = {}) {
  const keywords = buildSearchKeywords(text)
  const results = []

  for (const kw of keywords) {
    try {
      const res = await api.get('/search', { keywords: kw, limit: perKeyword, offset: 0 })
      const songs = res?.data?.result?.songs || []
      results.push(...songs.map(normalizeSong).filter(Boolean))
      if (uniqById(results).length >= limit) break
    } catch {
      // 忽略单次失败，继续下一关键词
    }
  }

  return uniqById(results).slice(0, limit)
}
