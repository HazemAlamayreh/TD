# ATD Academy — Assessment Architecture v32

**Date:** 2026-11-16

## Why the assessment stages were separated

A cross-bank audit compared the two Diagnostic items and two Mastery items for all **179 lessons**.

- **135 / 179 lessons** had high Diagnostic/Mastery stem overlap (Jaccard keyword similarity >= 0.50).
- Many of those lessons reused the **exact same first question** in both Diagnostic and Mastery.
- **44 lessons** were below the overlap threshold and were retained.
- The custom Emotional Intelligence (1.2) bank was checked separately and showed essentially no Diagnostic/Mastery duplication.

This meant the two stages were often testing the same decision twice rather than serving different instructional purposes.

## New role of each stage

### Diagnostic Exam — identify the gap
Purpose: establish baseline knowledge and identify which lesson needs development.

- Medium difficulty.
- One best answer.
- No answer reveal until submission.
- Drives the adaptive gap map.

### Mastery Check v28 — apply the capability
Purpose: test whether the learner can apply the lesson after learning.

- Existing non-duplicated items are retained.
- A first Mastery item is replaced when its overlap with that lesson's Diagnostic items is >= 0.50.
- Replacement format: **short workplace context -> new constraint -> "What should the TD professional do next?"**
- Existing second Mastery scenario/evidence questions remain.
- Mastery bank version: `mastery-applied-v28`.
- Previous Mastery attempts remain historical and are not silently rekeyed.

### Advanced Applied Judgment v26 — choose under realistic constraints
Purpose: test professional judgment after Mastery.

Every capability module now has exactly **5 scenarios**.

Format:

**Situation -> One clear decision -> 4 plausible options -> Feedback**

There are no multi-stage cases in v26.

Across **23 modules**:

- **115 Advanced scenarios**
- 5 scenarios per module
- 4 options per scenario
- Correct-answer distribution: **A 29 · B 29 · C 29 · D 28**
- Advanced cases are ordered using the learner's unresolved lesson gaps when relevant.
- Advanced version: `case-v26`
- Pass threshold remains **>70%**, so at least 4/5 decisions must be correct.

## Historical results

Older Mastery and Advanced attempts are preserved in attempt history. They do not automatically satisfy the newly versioned assessment.

## Interpretation

All questions are independent CPTD-style practice created for this Academy. They are not official ATD examination questions and should not be presented as psychometrically validated certification predictions.
