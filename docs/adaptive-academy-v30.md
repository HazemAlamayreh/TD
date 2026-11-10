# ATD Academy — Adaptive Academy v30b

**Date:** 2026-11-10

## What changed

Adaptive Academy v30b implements four product-level changes across the learning experience:

1. **One Rules Engine**
   - Diagnostic pass: **>80%**
   - Mastery pass: **>75%**
   - Advanced pass: **>70%**
   - Manual lesson completion is treated as **Studied**, not proof that a learning gap is resolved.
   - A gap is resolved only through learning evidence such as a fully correct diagnostic lesson pair, a passed lesson knowledge check, or lesson-level Mastery evidence.
   - Existing historical attempts remain stored and are not silently regraded.

2. **Universal Interactive Lesson Design**
   - Every lesson keeps its original curriculum concept and application content.
   - The interface now separates:
     - Simple explanation
     - Talent Development workplace situation
     - Teacher-mode decision guidance
     - Knowledge check
     - Evidence status
   - The richer existing Emotional Intelligence teacher experience is retained.
   - Modules **1.2 Emotional Intelligence**, **2.2 Instructional Design**, and **3.4 Talent Strategy & Management** are visually identified as pilot/reference experiences for the adaptive template.

3. **Adaptive Capability Model**
   Each lesson can now be represented as:
   - Not assessed
   - Emerging
   - Developing
   - Proficient
   - Demonstrated

   Learners see evidence-based priority gaps and recommended lessons rather than being required to consume every lesson equally. Manual study can help the learner, but it does not close a gap by itself.

4. **Talent / Department Intelligence**
   - Employee imports preserve **Employee ID, Work Email, Division and Department**.
   - Admin analytics groups evidence by Department.
   - Department cards identify lower-scoring shared skill areas as development-planning signals.
   - Department averages include only learners with at least four answered items in the relevant skill.
   - These indicators are not validated employee rankings or formal competency certification.

## Cloud progress semantics

Lesson progress synchronized to Firestore now distinguishes:

- `studied: true` — the learner reviewed or manually completed the lesson.
- `completed: true` / `evidenceResolved: true` — the learner has sufficient evidence to close the gap.
- `evidenceLevel` — the current adaptive level when synchronization occurs.

Existing lesson records are merged rather than deleted.

## Learner routing

The intended learner path is:

**Diagnostic → Evidence-based gaps → Targeted learning → Knowledge evidence → Mastery → Advanced application**

A learner who demonstrates a lesson correctly in Diagnostic does not need to study that lesson at the same depth as a learner who missed it. A learner who manually marks a priority lesson as studied must still demonstrate evidence before that gap stops blocking progression.

## Pilot modules

The framework is active across the Academy. The following modules are the reference experience for further instructional enrichment:

- **1.2 Emotional Intelligence & Decision Making**
- **2.2 Instructional Design**
- **3.4 Talent Strategy & Management**

The framework does not automatically invent new source facts for other lessons; it structures and teaches from the lesson content, question and rationale already present in the curriculum.

## Validation performed

- Syntax checks passed for learner app, adaptive rules, adaptive lesson layer, Firebase bridge, admin analytics, employee import and Cloud Functions.
- Rule simulation confirmed:
  - A Diagnostic gap remains unresolved after manual study.
  - The same gap resolves after the lesson knowledge check is passed.
  - Mastery remains locked while a Diagnostic gap lacks evidence.
  - Module completion requires stage pass thresholds plus lesson evidence.
- Correct stage thresholds have been aligned in learner and admin-facing labels.

## Remaining production checks

- Run an end-to-end browser test with a signed-in Firebase learner.
- Deploy / verify the Cloud Functions backend and SMTP setup before real bulk employee provisioning.
- Verify Firestore rules currently published in Firebase match the repository.
- Continue professional Arabic translation and equivalence review outside the dedicated Emotional Intelligence assessment bank.
- Continue SME review of retained assessment items and use real item-performance data for psychometric quality analysis.
