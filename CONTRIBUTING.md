# Contributing

## Adding a keyword data provider
1. Create `server/src/providers/<name>.js` exporting `name`, `configured()`, and `metrics()` and/or `ranks()`.
2. Return the normalized shape: `{ keyword, country, popularity, difficulty, rank, scale, source }` (null when unknown).
3. Register it in `server/src/providers/index.js`.
4. Document setup in `skills/aso/references/data-providers.md` and the README.
5. `cd server && npm run build` and commit `server/dist/server.mjs`.

## Rules for write tools
- Must go through the `write()` wrapper (read-only check, `confirm: true`, change log).
- Never add a tool that submits for review or deletes data without a separate, explicit design discussion.

## Skill changes
Keep `skills/aso/SKILL.md` under ~300 lines; put detail in `references/`.
