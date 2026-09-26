import { AR_IMPORTED } from '../src/content/decks/imported-ar'
import { EN_IMPORTED } from '../src/content/decks/imported-en'
import { splitTopic } from '../src/core/path/topicTitle'
const all = [...Object.values(AR_IMPORTED).flat(), ...Object.values(EN_IMPORTED).flat()]
const bySec = new Map<string, {words:number; topics:Set<string>; sentences:number}>()
for (const c of all) {
  const { section, title } = splitTopic(c.topic ?? '')
  const key = section ?? '(yo\'q)'
  const e = bySec.get(key) ?? { words:0, topics:new Set<string>(), sentences:0 }
  e.words++; e.topics.add(title); if ((c as any).sentence) e.sentences++
  bySec.set(key, e)
}
for (const [k,v] of [...bySec].sort((a,b)=>b[1].words-a[1].words)) console.log(k, '| so\'z:', v.words, '| dars:', v.topics.size, '| jumla:', v.sentences)
