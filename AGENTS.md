# Project instructions

## Roadmap execution

- Treat `docs/todo.md` as the prioritized product and engineering roadmap.
- When the user asks Codex to proceed through the roadmap, work autonomously in priority order and carry each selected slice through implementation, integration, verification, and documentation.
- Use subagents for independent, bounded work when parallel execution will improve speed or quality. Good delegation targets include read-only exploration, isolated simulation work, visual-system prototypes, accessibility review, and browser-test analysis.
- Give every subagent a concrete outcome, explicit file ownership, and acceptance criteria. Avoid assigning overlapping writes to multiple agents.
- Keep shared integration surfaces under the main agent, especially `src/App.tsx`, `src/styles.css`, persistence schemas, and cross-cutting game-state changes.
- Remember that all agents share the same workspace. Inspect delegated edits before integration and preserve unrelated work.
- Wait for all required subagents, reconcile their findings, and verify the combined result rather than reporting parallel outputs as finished work.
- Run the tests and production build appropriate to the change. For interaction or layout work, also run a real-browser playthrough at 1366×768 and a larger desktop size.
- Check the result against the actual player problem described in the roadmap, not only against implementation details.
- Update `docs/todo.md` when a roadmap item is completed or materially re-scoped.
- When pushing remains within the user-authorized publishing scope, create and push coherent, reviewable Git checkpoints after a complete and verified slice.

## Model and effort inheritance

- If the user selected GPT-6 Astra with `xhigh` reasoning, allow spawned subagents to inherit that model and effort unless the user requests a different configuration.
- Higher reasoning effort does not itself authorize delegation; the request to use subagents or an applicable project instruction must do so. This file explicitly permits delegation for the roadmap workflow described above.
