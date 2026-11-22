# Connecting a GPT-created onboarding website to TD Academy

The **central Admin page** stays at `admin.html` in the TD Academy site. The external onboarding website must authenticate employees against the **same Firebase project** (`atd-master-talent-development`), then use callable Cloud Functions in `us-central1`. Do not expose Admin SDK keys or use a second project.

## Existing identity (important)

- Employee HR records: `employees/{EMPLOYEE_ID}` with a trusted `uid` set by existing account provisioning.
- Academy user profiles: `learners/{firebaseUid}`, containing `employeeId` when linked.
- Admin access: `admins/{firebaseUid}.active === true`, enforced on the server.
- Onboarding events: `employees/{EMPLOYEE_ID}/onboardingProgress/{activityId}`, writable only by backend.
- The existing `status` field in `employees` is account invitation/provisioning status; onboarding uses the distinct `onboardingStatus` field.

## Admin setup (after deploying callable functions and Firestore rules)

1. In the TD Academy Admin page, import/link the employee account via Employee Management if necessary.
2. In **Employee Onboarding · Cohort Analytics → Assign onboarding journey**, enter the employee ID, stable journey ID, and comma-separated list of mandatory activity IDs.
3. This runs `assignOnboardingJourney`, verifying the administrator server-side. The list cannot change after a journey starts without controlled migration. Never use the count of pages viewed as a completion proxy.
4. Once events are recorded, `onboardingStartDate` and `onboardingStartedAt` are set using server timestamps on the first real activity; `overallProgress`, `onboardingStatus`, `lastActivityAt`, and `onboardingCompletedAt` update on validated transitions.
5. In the Admin dashboard select Onboarding Start Date, 2026, Feb–May, All Departments and All Statuses to show this cohort.

## External site integration (JavaScript module)

Install/initialize Firebase Authentication and Functions using the project's existing public Firebase app configuration. The following assumes `auth`, `app`, and a real signed-in Firebase user already exist:

```js
import { getFunctions, httpsCallable } from "firebase/functions";
import { getFirestore, doc, getDoc } from "firebase/firestore";

const db = getFirestore(app);
const functions = getFunctions(app, "us-central1");
const record = httpsCallable(functions, "recordOnboardingActivity");

// Only after the employee is authenticated on THIS SAME Firebase project.
const currentUser = auth.currentUser;
if (!currentUser) throw new Error("Sign in first");
const profileSnap = await getDoc(doc(db, "learners", currentUser.uid));
const employeeId = profileSnap.data()?.employeeId;
if (!employeeId) throw new Error("Employee onboarding account is not linked");

async function recordCompletion(activityId) {
  return (await record({ employeeId, activityId, event: "completed" })).data;
}
async function recordStart(activityId) {
  return (await record({ employeeId, activityId, event: "started" })).data;
}

// Trigger only when the corresponding activity's valid completion rule is met.
// For quizzes or sensitive attestations, use server-side proof rather than
// trusting this client-declared completion event.
```

The callable checks the signed-in UID against the employee's provisioned UID, rejects activities absent from the assigned required list, and does not allow repeating events to inflate progress. Every employee can submit only events for their own linked employee record. An unauthorized browser or Google account cannot assign journeys.

## Deployment and verification

From a secure environment with Firebase deployment permissions, after review/merge:

```sh
firebase use atd-master-talent-development
firebase deploy --only functions:assignOnboardingJourney,functions:recordOnboardingActivity,firestore:rules
```

GitHub Pages deployment is separate. The new admin UI script and Firestore client rules must be published before the Admin page shows these features.

Acceptance tests:
- Admin may assign a journey to a linked employee; non-admin cannot.
- A linked employee can record only their own assigned activity events.
- Another account cannot record the employee's progress.
- Duplicate completions do not alter totals or timestamps.
- The Admin page sees updates live and filtering/CSV use identical rows.
- Missing Hire Date, First Login, or legacy Onboarding Start are shown as missing, not inferred.

**Limitations:** The repository does not contain the GPT-created external onboarding website. Its activity triggers and Firebase initialization must be integrated there after its code or repository is supplied. The current functions accept an authenticated employee's completion declaration, not independent evidence that a quiz was actually passed. Do not use this mechanism as verified certification, regulatory attestation, or personnel performance evidence without server-side validation.

**Read/performance:** The admin currently listens to the employee directory. For very large populations, replace the unrestricted listener with a paginated, server-filtered query or aggregate endpoint.
