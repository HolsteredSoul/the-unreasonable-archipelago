# Procedural variety and optional-action evidence

5 November 2026. GB-06/GB-07 automated scope closure; no human validation.
Run `node scripts/audit-gameplay.cjs --procedural` from the repository root.
The [JSON audit](procedural-options-audit.json) records source/script hashes, the fixed seed panel, executable insertion recipes, option routes, and frozen-input fingerprints.
`--options` runs just the whale/support comparisons alongside the existing campaign audit; `--map=1` narrows that campaign component only.

## Fixed panel and exposed metadata

- Seeds were fixed before evaluating results: `gameplay-panel-00` through `gameplay-panel-31`. No difficult result was replaced by another seed.
- All four existing building families, current rotations 0–5, and initial bell distances 2–4 occur. Coverage is marginal, not all 72 family/rotation/distance combinations, and not a balanced population sample.
- `generateOpening` exposes `family`, `attempts`, and a legal witness. Attempts are recorded directly; fallback is identified from its exposed `Familiar shores` family.
- 28 seeds accepted a first candidate and four accepted a second; no fallback appeared in this panel. This does not establish a global acceptance/fallback rate.
- Warm and cold-cache generation agree exactly. Each generated opening's mechanical fields match public `createGame(seed)`; display names are excluded from that comparison because the template names differ.

| Family | Seeds | Witness minimum food, lowest observed | Witness final food range | Extra garden builds in witnesses | Six-growth wins found |
| --- | --- | --- | --- | --- | --- |
| Garden chain | 9 | 3 | 7–14 | None | 9/9 |
| Scattered orchards | 9 | 4 | 10–17 | None | 9/9 |
| Sheltered inlet | 4 | 3 | 9–15 | One each | 4/4 |
| Timber flotilla | 10 | 5 | 10–15 | One each | 10/10 |

## Route and economy observations

- All 32 production witnesses win. Each uses three bell Nourishes, 1–5 Tows, 1–2 Anchors, and 0–1 garden Builds. None uses Whale Tow, ordinary Nourish, or a new grove/breakwater.
- Witnesses leave 14–19 actions unused. Every witness has no commands on tide 6; other empty tides vary. The audit also records growth resolving on empty tides, so no-command is not equated with no consequence.
- Minimum food is 3–8 and final food is 7–17. Minimum timber is 6–9 and final timber is 11–23. No witnessed tide misses rations.
- These patterns reflect the generator's existing early-home, two-garden, late-anchor construction policy. They do not establish dominant strategies, mandatory buildings, or the full variety players could discover.
- A separate local insertion audit finds six ordinary growth stages while retaining victory for all 32 sampled seeds. It adds six real Nourish commands, with no free resources, new structures, repositioning, or changed rules.
- The growth routes reach minimum food 0–1 but still pay every tide's rations; final food is 10–31. A temporary zero balance is not starvation: production precedes rations.
- This supports offering the existing optional goal on these tested free voyages. It does not prove six-growth attainability for every possible seed or imply that players will discover or enjoy it.

## Bounded, reproducible opportunity method

1. Start from the exact generated witness. Enumerate one ordinary-island Nourish inserted at each available command position, retaining all original command order.
2. Replay all eight tides using the production API. Discard illegal continuations, defeats, and candidates that fail to increase actual final ordinary growth.
3. Choose the largest growth increase, then highest final food; fixed enumeration order breaks remaining ties. Repeat at most six additions.
4. Hard cap: 600 full route trials per seed, hence at most 19,200 over the fixed panel. Actual evaluation used 10,736 trials, 287–385 per seed; no cap was reached.
5. A greedy stop or cap is labelled unresolved, not impossible. This search excludes alternative investments, earlier bell replanning, whale moves, and all other possible strategies.
6. Independently replay each accepted route with command/tide immutability, exact forecast agreement, bounds, collision freedom, and action/resource assertions.
7. Reconstruct the route from the JSON: clone `row.witness`, then splice each `row.ordinaryOpportunity.additions` command at `[tide - 1]`, `index`, in listed order. The script asserts that this recipe exactly matches its verified route.

## Executable useful options

- **Whale:** in the existing First Light reference, replace the tide-2 bell Tow with `{ type: 'whaleTow', id: 'bell' }`. The audit replays both complete voyages and asserts identical immediate island positions.
- The whale spends one action, zero food, and zero timber, leaving final food **13 instead of 12**, with the same 14 timber and four Heart integrity.
- Tradeoff: it consumes tide 2's single whale favour; ordinary Tow leaves that favour available for another island. Its direction is fixed. The coming current still moves the bell from `(1,-1)` to `(0,-1)` in the verified trace.
- **Support:** use the existing First Light ride-current prefix, then tow `garden-west` to `(-1,-1)` and `(0,-1)` on tide 8. The garden supplies both the Heart chain and downstream shelter to the bell at `(0,-2)` and retains its garden building.
- This wins with **11 food and 16 timber**. Returning the bell directly instead also wins, ending with **12 food and 16 timber**; moving the support uses one extra action and one extra food.
- The support option is a mechanically valid offshore arrangement, not a claim of an extra reward or a superior choice. Both full command sequences and comparisons are executable in the audit script and included in JSON.

## Scope decision

- Close GB-06's requested automated option/goal evidence and GB-07's fixed-panel evaluation. Preserve the original campaign/medal fixtures, all simulation rules, numerical balance, generator policy, and current release scope.
- Do not add hazards or retune scarcity from these results. The panel demonstrates available choices and attainable targets; it does not measure boredom, challenge, clarity, replay motivation, or perceived whale usefulness.
- No additional seed hunting or broad solver expansion is needed for this release. Reopen a specific comparison only for an observed human problem or a simulation regression.
- Human first-play learning, campaign enjoyment, and optional-goal discovery remain pending under the existing playtest plan. Product copy must not turn sampled free-voyage medal evidence into a universal guarantee.
- This wave writes only the offline audit script and gameplay report/evidence. It does not edit `src`, `dist`, dependencies, saves, campaign fixtures, or build output; frozen-input checks run before and after the audit.
- Verification: two complete `--procedural` runs produced byte-identical output. Each run also replays the 24 existing campaign reference/medal/alternative fixtures and both option comparisons. [Check receipt](procedural-checks.json) records the output hash and unchanged fingerprints for all 66 `src` files and seven `dist` files; loaded source and script hashes were independently rechecked.
