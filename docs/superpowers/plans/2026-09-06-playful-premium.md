# Playful Premium — amalga oshirish rejasi

Spec: `docs/superpowers/specs/2026-09-06-playful-premium-design.md`

Har vazifa: test → qizil → kod → yashil → commit. Animatsiya bezak; DOM avval to'g'ri.

- [ ] 1. `src/lib/motion.ts`: `withMotion(scope, fn)` + presetlar (`enterStagger`, `pressBounce`, `countUp`, `shake`, `flipIn`, `floatLoop`, `pulseRing`). Test: `motion.test.ts` — reduced motion → fn chaqirilmaydi; revert qaytadi; `countUp` yakuniy son.
- [ ] 2. Tokenlar: `index.html` Nunito; `index.css` — `--font-sans`, sky/shadow/radius tokenlar, mesh fon, `flicker`, `shine`, rtl line-height. `Panel` `interactive` prop; `buttonStyles` primary shine.
- [ ] 3. Yordam: `src/features/session/ExerciseHelp.tsx` — har tur uchun matn (`EXERCISE_HELP`), `?` tugma, birinchi marta avto ochiladi (`polyglotpro:help-seen:<type>`). `SessionRunner` sarlavhasiga qo'shiladi. Test: matn mavjud; birinchi marta ochiq, ikkinchi marta yopiq; tugma ochadi.
- [ ] 4. Session: `SessionRunner` savol `flipIn` (dir), `ChoiceGrid` kirishda `enterStagger` (≤200 ms), `pressBounce`/`shake` presetga o'tadi. `ProgressBar` ease.
- [ ] 5. `LearningPath`: 3 ustunli zigzag + SVG chiziq, `floatLoop` + `pulseRing` joriy bo'limda.
- [ ] 6. `HomeScreen`: XP/streak `countUp`, olov `flicker`, `interactive` panellar.
- [ ] 7. `SessionSummaryPanel`: presetlar + halqa `burst`.
- [ ] 8. `AppShell` nav: faol indikator + `pressBounce`.
- [ ] 9. Tekshiruv: `npm test -- --maxWorkers=2`, lint, build, brauzerda skrinshot; push.
