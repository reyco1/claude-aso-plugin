# Localization: extra keyword space

Each locale has its own name, subtitle, keyword field, description, and screenshots. That's another 160 indexed characters per locale.

## Why it matters even for English-only apps
Each App Store storefront indexes more than one localization. The US storefront, for example, is widely reported by ASO practitioners to index English (US) plus additional locales such as Spanish (Mexico). Apple doesn't publish the full mapping and it changes, so:
- Treat cross-locale indexing as a hypothesis to verify with rank data, not a guarantee.
- Check the current mapping in your data provider's docs or by testing: add unique keywords to a secondary locale, wait for indexing, check ranks in the target storefront.

## Process
1. Pick target storefronts by revenue potential (US, UK, CA, AU, DE, JP are common starts).
2. For each, list which localizations it indexes (per your provider or tests).
3. Put **different** secondary keywords in each indexed locale. Don't duplicate the primary locale's keywords.
4. Keep localized text readable for real users in that locale. Don't put English stuffing into a locale customers actually read unless you've checked how it displays.
5. Use `asc_add_locale` (approval gated) to add locales; log each one.

## Real translation
For non-English markets, translate keywords by search intent, not literally. Verify popularity per country with your provider.
