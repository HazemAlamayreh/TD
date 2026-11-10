# ATD Academy — Mastery Check Editorial Review (v27)

**Date:** 2026-11-10  
**Scope:** Mastery Check only — all 23 capability modules, 179 lessons, 358 multiple-choice items.

## Assessment-wide verification

| Domain | Capability modules | Mastery questions | Key entries |
|---|---:|---:|---:|
| 1 · Building Personal Capability | 7 | 94 | 94 |
| 2 · Developing Professional Capability | 8 | 126 | 126 |
| 3 · Impacting Organizational Capability | 8 | 138 | 138 |
| **Total** | **23** | **358** | **358** |

### Changes introduced

- **36 questions** in Communication (1.1) and Collaboration & Leadership (1.3) received full scenario-and-choice editing.
- **16 existing individually authored Emotional Intelligence (1.2) Mastery items** were retained, with **five answer-choice sets further rebalanced** and updated Arabic equivalents.
- **153 generic second questions** were replaced with individually authored workplace cases testing the actual target lesson.
- **22 overly clue-heavy first questions** were rewritten with more balanced option wording.
- **131 source first questions** were retained from the academy's original lesson-level bank because the existing direct stem and objective are still relevant. They have been structurally checked but have **not** all been independently SME-certified for distractor plausibility or intended cognitive difficulty.

**Original item count and lesson ordering have not changed.** These are original independent CPTD-style practice questions; they are not official ATD exam questions.

### Automated QA results

- **358/358** learner-version items and answer key entries match.
- **358/358** website-generated questions verified word-for-word against the saved learner versions; choices and correct indices match exactly.
- **4 options and one valid correct index** for every question.
- **No duplicated question stems** across the 358-item bank, including the cross-module scan.
- **No question pairs with Jaccard keyword similarity of 0.56 or higher** in a screening scan. This does not rule out conceptual similarity.
- Correct answer distribution: **A 90 · B 90 · C 89 · D 89**.
- **Zero** remaining correct-choice length clues using the screening rule: the correct option is longest by at least six words relative to the next longest.
- Scoped bank versions protect previous results: `mastery-editorial-v26` in 1.1/1.3, `mastery-audited-v27` in the other modules. Historical scores are retained and aren't silently rekeyed.

### Outstanding quality conditions

1. **SME review of 131 source-retained first questions** is still recommended, particularly for high-stakes use. Structural and automated similarity checks do not guarantee that all wrong options are equally plausible, that one answer is unequivocally best, or that all content matches each CPTD capability statement.
2. **Cognitive difficulty:** A subset of source questions test recognition more than applied judgment; consider stronger workplace cases if the intended use is a high-difficulty readiness exam.
3. **Bilingual alignment:** Emotional Intelligence 1.2 has the dedicated Arabic Mastery wording. The rest of the newly authored Mastery bank is English and should receive professional Arabic translation and equivalent-option review before claiming complete bilingual parity.
4. **Assessment validity:** First-attempt item response distributions, item difficulty, distractor selection, discrimination, differential functioning and expert item review have not yet been performed using real learner performance. Do not interpret practice scores as a psychometrically validated certification readiness score.
5. **Deployment verification:** Static JavaScript and generated-item consistency checks passed, but an end-to-end production browser test with Firebase login and progress synchronization remains necessary.

## Review artifacts

- [Domain 1 — Learner assessment](mastery-learner-domain-1.md) | [Domain 1 — Answer key](mastery-answer-key-domain-1.md)
- [Domain 2 — Learner assessment](mastery-learner-domain-2.md) | [Domain 2 — Answer key](mastery-answer-key-domain-2.md)
- [Domain 3 — Learner assessment](mastery-learner-domain-3.md) | [Domain 3 — Answer key](mastery-answer-key-domain-3.md)

## Publishing rule

For future changes to any item stem, option, correct key or rationale, update the assessment bank version, retain historic answer snapshots, and regenerate/revalidate the learner and answer-key documents together. Preserve lesson IDs and item counts unless the learning blueprint itself changes.
