# claude-aso-plugin

An App Store Optimization agent for Claude. It audits your listing, researches keywords, drafts and validates your name, subtitle, and keyword field, applies approved changes through the App Store Connect API, replies to reviews, and tracks ranks over time so you can see what actually worked.

Bring your own keyword data: AppTweak, Appfigures, Astro, Apple Search Ads exports, any CSV, or the free iTunes fallback.

> **What it can and can't do.** It executes the controllable parts of ASO well and consistently. Rank also depends on downloads, ratings volume, retention, and time. No tool can promise a position.

## What's inside

```
.claude-plugin/     plugin + marketplace manifests
commands/           /aso:audit, /aso:keywords, /aso:draft, /aso:apply, /aso:reviews, /aso:report
skills/aso/         the playbook, rules, references, and a standalone validator
server/             MCP server (App Store Connect + data providers), prebuilt in server/dist
```

## Install (Claude Code)

```bash
/plugin marketplace add reyco1/claude-aso-plugin
/plugin install aso@reyco1
```

Requires Node 18+. The MCP server is prebuilt, so no `npm install` is needed to use it.

## Configure

1. In App Store Connect: **Users and Access > Integrations > App Store Connect API**. Create a key with the **App Manager** role. Download the `.p8` (you only get one chance) and note the Key ID and Issuer ID.
2. Copy `.env.example` to `.env` in the project you run Claude from (or export the variables in your shell):

```bash
ASC_KEY_ID=XXXXXXXXXX
ASC_ISSUER_ID=xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx
ASC_PRIVATE_KEY_PATH=/Users/you/keys/AuthKey_XXXXXXXXXX.p8
```

3. Optional: add a keyword data provider (below).
4. Run `/aso:audit` and pick your app.

Start with `ASO_READ_ONLY=true` if you want to try it with zero risk.

## Keyword data providers

Apple's API has no popularity or difficulty data. Plug in any of these; results are merged.

| Provider | Setup |
|---|---|
| AppTweak | `APPTWEAK_API_KEY=...` |
| Appfigures | Add Appfigures' official MCP server alongside this plugin (snippet below) |
| Astro, Apple Search Ads, Sensor Tower, spreadsheets | Export CSV into `.aso/data/` |
| iTunes Search (free, approximate ranks only) | Nothing, always on |

Appfigures:

```json
{ "mcpServers": { "appfigures": { "command": "npx", "args": ["-y", "@appfigures/cli", "mcp"], "env": { "APPFIGURES_API_KEY": "${APPFIGURES_API_KEY}" } } } }
```

CSV headers are matched loosely: `keyword`, `country`, `popularity`/`volume`, `difficulty`, `rank`/`position`, `date`. See `skills/aso/references/data-providers.md`.

Limit which providers run with `ASO_PROVIDERS=apptweak,csv,itunes`.

## Safety

- Every write tool requires `confirm: true`, and the skill only sets it after you approve the exact before/after diff in chat.
- `ASO_READ_ONLY=true` disables all writes at the server.
- It never submits a version for review. You do.
- Every write is logged with its inputs to `.aso/changelog.jsonl`.
- Credentials stay in your environment. Nothing secret goes in this repo (`.env` and `*.p8` are gitignored).

## Tools

| Tool | |
|---|---|
| `aso_status` | What's configured |
| `aso_validate_metadata` | Lengths, duplicates, plural/singular, wasted chars, competitor terms, primary keyword placement |
| `aso_keyword_metrics` / `aso_keyword_ranks` | Data from configured providers; ranks are snapshotted |
| `aso_history` / `aso_log_note` | Change log and rank history for attribution |
| `asc_list_apps` / `asc_get_listing` | Read listing and editable state |
| `asc_update_name_subtitle` / `asc_update_version_text` | Write metadata (gated) |
| `asc_add_locale` / `asc_create_version` | New locale / new version (gated) |
| `asc_list_reviews` / `asc_respond_review` | Reviews (reply gated) |
| `asc_list_screenshots` / `asc_upload_screenshot` | Screenshots (upload gated) |
| `asc_get` | Read-only GET to any ASC endpoint |

## Validator without the server

```bash
node skills/aso/scripts/validate-cli.mjs '{"name":"Habit Tracker - HabitKit","subtitle":"Streaks & Accountability","keywords":"routine,goals,planner","primaryKeyword":"habit tracker"}'
```

## Develop

```bash
cd server
npm install
npm run build   # bundles to server/dist/server.mjs, commit the result
```

## Roadmap

- Create Product Page Optimization experiments via API
- App Store Connect Analytics Reports ingestion (impressions and page views by source)
- Screenshot generation from simulator captures with caption templates
- Custom product pages and in-app events
- Google Play Developer API
- More providers (Sensor Tower, MobileAction)

PRs welcome. See `CONTRIBUTING.md`.

## Credits

The core playbook draws on Sebastian Röhl's ASO walkthrough on Starter Story Build ("My App Makes $50K/Month: This Is My ASO Playbook", May 2026). Watch it: https://www.youtube.com/watch?v=I2GG0lyb_RI

Not affiliated with Apple, AppTweak, Appfigures, or Starter Story.

## License

MIT
