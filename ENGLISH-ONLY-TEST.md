# English-only TD Academy test build — 2026-11-24

## Purpose
Investigate account-specific Chrome login freezes, with English-only UI as an isolated experiment. Other learner accounts do not show the same symptom, so Arabic cannot be identified as the root cause from current evidence.

## Changes on this branch
- Inherit the unpublished login-performance fix with paginated Firestore restore and safe retry controls.
- Force `state.lang = "en"` on initial load and on all Firebase account switches.
- Disable the language-switch action and remove the language-toggle button.
- Prevent expensive Arabic/English lesson-object rewrites on each render. The English source lesson objects remain unchanged.
- Display Firebase account UI in English and LTR.
- Do not request the separate `assets/ar_lessons-01.js` bundle from the HTML page.
- Keep legacy Arabic content in the Git history/source for safe rollback; this is **not a destructive deletion of every Arabic string or asset**.

## Data protection
No Firestore collection is deleted or migrated; learner assessment results, account IDs, localStorage keys and completed lessons remain intact. Do not clear local browser data as part of troubleshooting.

## Verification
- 9/9 static code regression and syntax checks passed before excluding the Arabic lesson asset.
- English-only language flow and absence of the Arabic asset script entry verified in source.
- **No live Chrome test yet; no production deployment**.
- The existing complaint is admin-account-specific, and substantial saved assessment history remains a possible source of blocking work. This branch does not prove translation was the root cause.

## Next acceptance tests
1. Run this branch on a staging URL or private local server, retaining a backup of the admin account's local progress.
2. Sign in as Admin using normal Chrome and Incognito; measure console `[TD performance]` timings.
3. Sign in as a learner and confirm English-only content and functioning assessments.
4. Refresh and confirm saved progress and scores are retained.
5. Compare with the existing live site. If freeze persists, collect a Chrome Performance trace to locate the specific long task, rather than deleting unrelated translation source files.

## Rollback
Do not merge if any progress is missing, language controls remain visible, or Chrome still freezes. Revert this branch to the original `main` release if necessary.
