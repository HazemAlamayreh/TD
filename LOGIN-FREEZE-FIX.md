# TD Academy login freeze — staged fix (2026-11-24)

Scope: **TD Academy login/progress sync only**, not DAD Orientation, not Admin Portal changes.

## Changes

- Defer the first signed-in academy render until cloud restore is complete, instead of rendering at account switch and again after restore.
- Read the Firestore snapshot and three progress subcollections together, then merge them into a staged copy. Apply changes only after every read completes, and only if the signed-in UID is unchanged.
- Yield to the browser after every 75 progress records during restore; use a lazy record generator and yield periodically while uploading.
- Allow the first paint before automatic upload. Coalesce saves while a synchronization is running instead of overlapping them.
- Add console performance diagnostics prefixed `[TD performance]`, for login readiness, restoration, and cloud sync preparation/duration.
- Show a progress indicator while restoring; use 15-second account lookup and 25-second cloud restoration deadlines. An error pauses cloud writes and opens the signed-in account dialog with **Retry restore**.
- Provide a manual **Retry sync** button for failed outgoing uploads. Keep user data intact; do not clear `localStorage` or delete Firestore documents.
- Ignore results from a previous UID so an old upload cannot pollute the next account's known-record cache.
- Version the Firebase bridge script in `index.html` to avoid old cached code.

## Tests performed without production writes

- JavaScript syntax parsing passed.
- Static regression checks passed for one-render restore, session ownership, performance logs, deferred upload, retry UI, and safeguards.
- Mocked restore outcomes passed for: successful local + cloud merge, permission-denied read (no partial state application), and UID change during restore (cancel merge).

**NOT YET VERIFIED:** production Chrome execution, real Firebase reads/writes, cross-browser persistence, performance timings under large learner accounts, and exact behavior with the user's problematic Chrome profile.

## Browser acceptance checklist before merging to main

1. Back up a signed-in learner record and any existing browser-only progress using an export/safe backup process.
2. Test on a staging deployment (not the live `main` site) with an existing learner account that has saved progress.
3. Open DevTools > Console; confirm `[TD performance] restore and render`, `login ready`, `build sync records`, and `cloud upload` show reasonable durations. Capture warnings and timings.
4. Login with normal Chrome profile, Incognito, and Edge. Verify the user can navigate and the page does not display Chrome's Page Unresponsive warning.
5. Confirm lesson completion, mastery and assessment history are unchanged before vs after login. Complete one additional lesson, refresh, and verify the cloud progress and another browser show that completion.
6. Simulate Firestore offline/denied during restore: the UI must offer **Retry restore**, preserve local data, and **not automatically upload** incomplete restore data.
7. Simulate sync failure: **Retry sync** should work after connectivity returns.
8. Rapidly sign out then sign into another learner account: records must remain isolated.
9. Test a large learner record and confirm the long sync happens after initial UI paint.
10. Confirm current TD Academy admin/learner analytics remain functional.

## Rollback

Revert the changes to `index.html` and `assets/firebase-bridge.js` to the previous `main` release. This patch does not migrate, delete, or rename existing learner records. If a particular Chrome profile still freezes, preserve its local storage before clearing any website data.

## Deployment status

Changes are committed to the dedicated fix branch only. No production deployment or production database write was performed.
