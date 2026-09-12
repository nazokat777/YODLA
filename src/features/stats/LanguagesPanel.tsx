import { useLiveQuery } from 'dexie-react-hooks'
import { LanguageBadge } from '@/components/ui/LanguageBadge'
import { Panel } from '@/components/ui/Panel'
import { LANGUAGE_LIST } from '@/core/config/languages'
import { computeLanguageStats, getAllCards } from '@/core/db'
import { useSettingsStore } from '@/stores/useSettingsStore'

/**
 * Tillar kesimidagi lug'at — streak va XP global, so'zlar esa tilga
 * bog'liq. Ilgari statistika faqat globalni ko'rsatardi va uch tilda
 * o'qiyotgan bola qaysi tilda qancha o'rganganini ko'rolmasdi.
 *
 * Faqat kamida bitta so'z ko'rilgan tillar chiziladi: "Rus tili: 0 so'z"
 * hech nima anglatmaydi va ro'yxatni cho'zadi.
 */
export function LanguagesPanel() {
  const learningLanguage = useSettingsStore((s) => s.learningLanguage)

  const rows = useLiveQuery(async () => {
    const now = Date.now()
    const all = await Promise.all(
      LANGUAGE_LIST.map(async (language) => ({
        language,
        stats: computeLanguageStats(await getAllCards(language.code), now),
      })),
    )
    return all.filter(({ stats }) => stats.learning + stats.mature > 0)
  }, [])

  if (!rows || rows.length === 0) return null

  return (
    <Panel data-testid="languages-panel">
      <h2 className="mb-3 font-bold">Tillar bo‘yicha</h2>
      <ul className="flex flex-col gap-2">
        {rows.map(({ language, stats }) => (
          <li
            key={language.code}
            data-testid={`language-row-${language.code}`}
            className="flex items-center gap-3"
          >
            <LanguageBadge language={language} size="sm" active={language.code === learningLanguage} />
            <span className="min-w-0 flex-1 truncate font-semibold">{language.name}</span>
            <span className="text-sm text-ink-600">
              <span className="font-bold text-flame-700">{stats.learning}</span> o‘rganilmoqda ·{' '}
              <span className="font-bold text-brand-600">{stats.mature}</span> mustahkam
            </span>
          </li>
        ))}
      </ul>
    </Panel>
  )
}
