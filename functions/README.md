# ATD Academy — Employee ID Login & Bulk Import

This is the **trusted Firebase backend** for `admin.html`. GitHub Pages alone cannot provision accounts.

## Prerequisites

- Firebase project `atd-master-talent-development`, Firebase Authentication (Email/Password) enabled.
- Firebase **Blaze** billing plan (Cloud Functions deployment).
- Authorized Admin: `admins/{uid}` with **lowercase** `active: true` (boolean).
- SMTP provider that can deliver invitations to real employee work emails.
- Firebase CLI and Node.js 22 (or compatible runtime as supported by your environment).

## Deployment (do not store passwords or service-account keys in GitHub)

From the repo root:

```bash
npm install -g firebase-tools
firebase login
cd functions && npm install && cd ..
firebase functions:secrets:set ATD_SMTP_CONFIG
```

When prompted, enter a **single JSON object**, for example:
```json
{"host":"smtp.example.com","port":587,"user":"smtp-user","pass":"SMTP_PASSWORD","from":"ATD Academy <academy@example.com>"}
```

Then:
```bash
firebase deploy --project atd-master-talent-development --only functions,firestore:rules
```

The Functions deployed are:
- `importEmployees` (admin-only; 25 records/batch; real email activation; links existing Email/Password account by **same UID**)
- `resolveEmployeeLogin` (public lookup of **opaque** Firebase sign-in alias; limited requests)
- `resetEmployeePassword` (public generic-response email reset; limited requests)

For **new** employee IDs, Firebase Auth uses an unpredictable, separate login email alias. Work email is used for delivering the **secure password setup link**, not as the Auth login identifier. Existing email accounts keep their original Auth email and UID, so progress isn't lost.

## Operating notes and risks

- Test on 1–2 **non-production test employees** before uploading the full list.
- Employee ID values are normalized to uppercase; leading zeros are retained. They must be 2–40 characters containing letters, digits, underscore, dot or hyphen.
- Admin CSV file has: `Employee ID, Full Name, Work Email, Department`.
- No default passwords or employee IDs used as passwords. Activation emails are generated with Firebase Admin's password-reset link.
- If email fails, the employee is left as `invite_pending`; **re-importing the same ID and email** re-sends the invitation.
- If the import fails during provisioning, `provision_failed` requires administrator investigation.
- Existing email/password accounts must have **verified email ownership** before they can be linked to an Employee ID. If import returns `verification_required`, the employee signs in with their existing email, selects **Send verification email**, verifies it, and an admin re-imports the same row. This preserves the original Auth UID and learning history.
- Import is idempotent for existing employee IDs and normal accounts.
- Newly created employee accounts use random opaque Auth aliases. For **linked legacy accounts**, the login resolver must return their existing Firebase Auth email to preserve the same UID/password and existing email sign-in. Because employee ID lookup is public before login, this carries employee-email enumeration risk. A rate limit is included; enable **Firebase App Check** and production monitoring, or require employees to use their work email until a stronger identity-provider/SSO solution is implemented.
- Work emails and employee IDs are personal data; limit admin access and avoid sharing roster exports publicly.
- Configure HTTPS/SMTP reputation, organizational privacy policy, permitted admin access, and retention for employee personal data.
- Review Cloud Functions charges and configure billing alerts. Cloud Functions deployment requires Blaze even within no-cost quotas.
- The web pages are deployed through GitHub Pages. Deploying these backend functions is a separate administrative step.
