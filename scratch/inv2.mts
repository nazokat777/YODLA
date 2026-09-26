import { loadLanguageDeck } from '../src/content/starterDecks'
import { splitTopic } from '../src/core/path/topicTitle'
for (const lang of ['en','ru','ar'] as const) {
  const deck = await loadLanguageDeck(lang)
  const all = Object.values(deck).flat()
  const bySec = new Map<string, {words:number; topics:Set<string>; sentences:number}>()
  for (const c of all) {
    const { section, title } = splitTopic(c.topic ?? '')
    const key = section ?? "(bo'limsiz)"
    const e = bySec.get(key) ?? { words:0, topics:new Set<string>(), sentences:0 }
    e.words++; e.topics.add(title); if ((c as any).sentence) e.sentences++
    bySec.set(key, e)
  }
  console.log('===', lang, 'jami', all.length)
  for (const [k,v] of [...bySec].sort((a,b)=>b[1].words-a[1].words)) console.log(' ', k, '| so\'z:', v.words, '| dars:', v.topics.size, '| jumla:', v.sentences)
}
