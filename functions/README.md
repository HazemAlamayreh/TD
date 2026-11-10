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
- `resolveEmployeeLogin` (legacy Employee-ID compatibility lookup; current learner UI uses work email as the primary username)
- `resetEmployeePassword` (public generic-response email reset; limited requests)

For **new** employees, the verified **work email is the Firebase Authentication username**. The Employee ID remains an HR reference and is never used as a password. Employees set their own password from the secure invitation link. Existing verified email accounts keep their original UID, so learning history is not replaced.

## Operating notes and risks

- Test on 1–2 **non-production test employees** before uploading the full list.
- Employee ID values are normalized to uppercase; leading zeros are retained. They must be 2–40 characters containing letters, digits, underscore, dot or hyphen.
- Admin CSV file has: `Employee ID, Full Name, Work Email, Division, Department`.
- No default passwords or employee IDs used as passwords. Activation emails are generated with Firebase Admin's password-reset link.
- If email fails, the employee is left as `invite_pending`; **re-importing the same ID and email** re-sends the invitation.
- If the import fails during provisioning, `provision_failed` requires administrator investigation.
- Existing email/password accounts must have **verified email ownership** before they can be linked to an Employee ID. If import returns `verification_required`, the employee signs in with their existing email, selects **Send verification email**, verifies it, and an admin re-imports the same row. This preserves the original Auth UID and learning history.
- Import is idempotent for existing employee IDs and normal accounts.
- Work email is the primary login. `resolveEmployeeLogin` remains only for legacy Employee-ID compatibility and should not be presented as the normal login path. A rate limit is included; enable **Firebase App Check** and production monitoring before relying on any public identifier lookup.
- Work emails and employee IDs are personal data; limit admin access and avoid sharing roster exports publicly.
- Configure HTTPS/SMTP reputation, organizational privacy policy, permitted admin access, and retention for employee personal data.
- Review Cloud Functions charges and configure billing alerts. Cloud Functions deployment requires Blaze even within no-cost quotas.
- The web pages are deployed through GitHub Pages. Deploying these backend functions is a separate administrative step.
