# ASO Playbook

Three foundations, in order of impact. Based on Sebastian Röhl's ASO walkthrough on Starter Story Build ("My App Makes $50K/Month: This Is My ASO Playbook", May 2026), whose habit tracker gets about 98% of its users from store search with no other marketing, plus standard App Store practice.

## 1. Keywords (biggest lever)

Apple decides when to show your app by reading its metadata. **Name and subtitle outweigh everything else.**

### Research
- Brainstorm candidates with an LLM; think like a searcher, not a marketer.
- Validate with real data: popularity (how often it's searched) and difficulty (how hard to rank, based on competition).
- Sweet spot: high popularity, manageable difficulty.
- For the **primary** keyword, compete for a hard, valuable term rather than winning an easy one nobody searches.

### Name (30 chars)
- Primary keyword in the name. Indie apps put it first: `Habit Tracker - HabitKit`, not `HabitKit - Habit Tracker`.
- Big brands can lead with the brand because people search the brand. Most indies can't.

### Subtitle (30 chars)
- Secondary keywords. Must still read naturally.
- Don't repeat words from the name. Apple indexes name + subtitle as one combined string, so repeats are wasted.

### Keyword field (100 chars, hidden)
- Comma separated, no spaces: `streak,routine,goals,planner`
- No words already in name or subtitle.
- No plural if the singular is already there (and vice versa).
- No competitor app names. Apple may reject the build.
- Use all 100 characters.
- Single words beat phrases: Apple combines words across name, subtitle, and field to match multi-word searches.

## 2. Screenshots (biggest conversion lever)
You have roughly 3 to 5 seconds before a visitor scrolls past.
- **First screenshot = the best, most visually distinctive feature.** Not a welcome or onboarding screen.
- **Show real UI.** People want to see what they get. Abstract art and lifestyle photos rarely help.
- **A/B test with Product Page Optimization.** Don't assume. In the reference case, professionally designed screenshots converted *worse* than the developer's homemade ones. Authentic can beat polished.
- Captions: short, benefit-led, readable at thumbnail size.

### Screenshot rules that get apps rejected (App Review Guidelines 2.3)
Check every screenshot and preview against these before upload. Rule numbers point to Apple's [App Review Guidelines](https://developer.apple.com/app-store/review/guidelines/); re-read the live page before submitting, since rules change.
- **Show the real app (2.3.3).** Screenshots show the app in use, not just title art, a login screen or a splash screen. Text and image overlays are fine as long as the app's real UI is the main thing on screen.
- **Previews are captures of the app (2.3.4).** App previews use video captured from the app itself. Narration and overlays may explain things, but don't show footage or features the app doesn't have.
- **No prices or off-topic claims in images (2.3.7).** Keep prices, "free", "#1", competitor or trademarked names, and anything unrelated to the app out of screenshot captions, the same as the name and subtitle.
- **Everyone-appropriate imagery (2.3.8).** Screenshots, previews and icons must suit a 4+ audience even if the app is rated higher. For games with violence, choose images without gore or a weapon aimed at a character.
- **Own the rights to everything shown (2.3.9).** Art, music in previews, fonts, characters and brands must be yours or licensed. Use fictional account data, never a real person's.
- **Apple platforms only (2.3.10).** No other phone platforms, app stores, or their names, icons or devices in images or captions.
- **Accurate (2.3.1).** Don't show features, content or results the app doesn't deliver.
- **Flag paid content (2.3.2).** If a screenshot or preview features items, levels or subscriptions that cost extra, make that clear.

### Screenshot specs (App Store Connect)
From Apple's [Screenshot specifications](https://developer.apple.com/help/app-store-connect/reference/screenshot-specifications) at the time of writing; check the live page before producing a set.
- **1 to 10 screenshots per device size.** `.jpeg`, `.jpg` or `.png`, no transparency.
- **iPhone:** at least one set for the display class Apple currently marks as required; App Store Connect scales your largest required size down to smaller devices if the UI is the same.
- **iPad:** a 13-inch set is required if the app runs on iPad.
- Use `asc_list_screenshots` to see which display types already have sets before uploading.
- Design for the thumbnail first: in search results only the first screenshots show, small. One idea per screenshot, big type, high contrast.

## 3. Ratings and reviews (rank + conversion)
Ratings feed ranking and conversion. Poor ratings tank downloads even when you rank. Rating volume is a moat that newer apps can't copy quickly.
- **Timing:** prompt at a success moment (e.g. right after the first completed habit). Never in onboarding, never after something breaks.
- **Don't nag:** if dismissed, wait a long time before asking again.
- **Reply to every review.** Thank positive ones; help on negative ones. Fixed issues often turn 1 stars into 5 stars.
- **Support email signoff:** after solving someone's issue, add a gentle "if you're enjoying the app, a review would mean a lot."
- **Mine reviews for product insight.** Repeated requests are roadmap signals.

## 4. Patience
ASO is a long game. Keep shipping updates, improving the app, and collecting reviews. Judge changes over weeks, not days, and log everything so you can attribute movement.

## Common mistakes the validator catches
- Spaces after commas in the keyword field
- Words repeated across name, subtitle, and field
- Singular and plural both present
- "app", "free", and other low-value words
- Keyword field under 90 characters
- Primary keyword missing from the name
- Competitor names anywhere
