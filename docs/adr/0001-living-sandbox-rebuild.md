# ADR 0001 — Living Sandbox rebuild

Date: 2026-08-15 · Status: accepted · Branch: `feature/living-sandbox`

Source spec: `Workspace/.archive/ResourcesForApp/` (feature-FindWord.md, requirements-verFindWord.md, sub-featureOf-9Step.md, user-journey docs), indexed by graphify-out/GRAPH_REPORT.md.

## Decisions

1. **9-step daily loop replaces the session engine.** Snap → Confirm (rigid) → flexible {Sensory Tags, Listen, Flashcard, Read/Write, Dictation} → Pronunciation before Second Take (checkpoint, reachable anytime). Existing skill components reused as steps. Lives at `/daily`.
2. **Fixed SRS ladder replaces SM-2 scheduling.** 1d → 3d → 1w → 3w → 2mo. "Still learning" holds the interval, never demotes. Queue: promoted words due today, oldest first, capped at r=2, overflow carries. Old SM-2 fields remain on `Word` but are unused.
3. **Sandbox world replaces the Duolingo path at `/`.** Collectibles from snapped words, dim→bloom states, L3 time/weather tint, one curiosity bubble, changes never announced.
4. **Gemini stands in for Hyperspace `neighbours(seed,k)`.** Photo → object label → k CEFR-appropriate related words (word, Thai, because-sentence). Temperature 0, fixed prompts.
5. **Anti-gamification is softened, not adopted wholesale.** User decision: session progress bar stays; gacha/shop/leaderboard/hearts/streaks/coins remain in the app and in nav. Inside the 9-step loop itself: no scores, no grades, promote-only.
6. **Peak A binds to session state, not ASR.** Fires deterministically on checkpoint completion (effort, not correctness). Peak B on "done for today" tap, with next-launch overnight-reveal fallback. Each beat ≤5s and skippable; ≤30s delight per day.
7. **Grove + shimmer.** Any promoted word freely replayable (photo card + because-text + ambient sound), outside the session budget. Shimmer per (topic, CEFR band), snapshotted once, never revoked, cosmetic only.
8. **Age bands added alongside CEFR.** 7-10: k=4/r=2; 11-15: k=6/r=2. CEFR keeps governing content level; band governs sizing, task shape, replay caps, tone. Existing users default to 11-15.
9. **Additive DB migration.** New models `EvidenceStore`, `JournalEntry`, `Collectible`, `TopicShimmer`; new fields on `Word`/`User`. Nothing dropped.
10. **Nav curation.** Removed from nav (code kept): Story, Memory-map, Luggage. Kept: Review hub, Community, Gacha, Shop, Profile; added: Grove, Daily.

## Open items resolved by implementation default (spec left them open)

- Confirm "no" branch → 2 alternates, then text-search fallback.
- Read/Write feedback → gentle model answer after submit, never a grade.
- Listen replay cap → 2 plays (7-10), 1 play (11-15).
- Dim collectible → fades into background scenery after 7 days.

## Declined (per spec's own rulings)

- Gesture/embodied production pairing — spec rejected for this pass.
- Full asset pipeline (~110 art pieces) — CSS/SVG placeholder compositing (10 body plans × 3 sizes, 8 texture patterns) until real art exists.
