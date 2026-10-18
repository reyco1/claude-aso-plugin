# Keyword data providers

Apple's API has no keyword popularity or difficulty. Plug in any of these; the server merges everything configured. Enable a subset with `ASO_PROVIDERS=apptweak,csv,itunes`.

| Provider | Gives you | Setup | Cost |
|---|---|---|---|
| **AppTweak** | volume, difficulty, results count, app keyword ranks | `APPTWEAK_API_KEY` | Paid, credit based |
| **Appfigures** | tracked keyword ranks, popularity, competitiveness | Add Appfigures' official MCP (below) | Paid plan |
| **CSV** | anything you export | Drop `.csv` files in `.aso/data/` | Free |
| **iTunes Search** | approximate rank only | Nothing | Free |

## AppTweak
Set `APPTWEAK_API_KEY`. Uses Keyword Metrics (current) and App Keyword Rankings. Scores are AppTweak's own scale; compare only within AppTweak.

## Appfigures
Appfigures ships its own MCP server. Add it next to this plugin (in your project's `.mcp.json` or Claude Code settings):

```json
{ "mcpServers": { "appfigures": { "command": "npx", "args": ["-y", "@appfigures/cli", "mcp"], "env": { "APPFIGURES_API_KEY": "${APPFIGURES_API_KEY}" } } } }
```

Create a key at appfigures.com/developers/keys. When its tools are present, use them for keyword rankings, popularity, and competitiveness, and log rank results with `aso_log_note` if you want them in the local history.

## Astro (Mac app)
No public API. Export your keyword list to CSV and drop it in `.aso/data/`. Columns like `Keyword, Popularity, Difficulty, Position` are recognized.

## Apple Search Ads
Search popularity (1 to 5) appears in Search Ads keyword tools and impression share reports. Export to CSV, rename the column to `popularity` if needed, drop in `.aso/data/`. Note the scale is 1 to 5.

## CSV format
Headers are matched case-insensitively:
- `keyword` / `term`
- `country` / `storefront` (default `us`)
- `popularity` / `volume` / `search popularity`
- `difficulty` / `competitiveness` / `chance`
- `rank` / `position`
- `date` (latest row per keyword+country wins)

## iTunes Search (fallback)
Queries the public iTunes Search API and finds your app's position. This is **not** the same as on-device App Store search ranking. Use it for direction only, and say so when reporting.

## Free signal you already have
App Store Connect analytics shows impressions and product page views by source (App Store search vs browse). Use it to confirm whether search traffic actually moved after a change.
