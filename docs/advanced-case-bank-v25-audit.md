# Advanced Case Bank v25 — Editorial & Technical Audit

**Date:** 2026-11-12  
**Scope:** Advanced Scenarios across all 23 ATD Academy capability modules.

## Why v25 was created

The previous Advanced implementation used 67 different base scenarios, but wrapped them in repeated follow-up prompts and choices. In v24, all 67 final stages reused the same five options, and module-level follow-up text was reused across multiple cases. This made the assessment feel repetitive and could reward recognition of the test pattern rather than Talent Development judgment.

## v25 design

Every Advanced case now uses four distinct stages:

1. **Diagnose & decide**
2. **New stakeholder evidence**
3. **Implementation challenge**
4. **Evaluate & adjust**

Each stage asks for **one best decision**. The evidence changes between stages and the learner cannot rely on the previous generic two-action pattern.

### Item construction rules

- Four choices per stage.
- All choices answer the decision being asked.
- Weak or conspicuously short legacy distractors are replaced with case-specific professional mistakes.
- Correct answer position is deliberately balanced.
- The case carries a mapped lesson/capability focus.
- New evidence is carried forward so the case develops rather than resets.
- Existing v24 attempts remain historical and are not silently rescored.

## Bank size and answer balance

- **23 capability modules**
- **67 Advanced cases**
- **4 decision stages per case**
- **268 scored decisions**

Because each case uses every correct-answer position once, the full bank distribution is exactly:

| Correct position | Decisions |
|---|---:|
| A | 67 |
| B | 67 |
| C | 67 |
| D | 67 |

## QA performed

The bank was validated in three module batches covering all 23 modules.

- 67/67 cases created.
- 268/268 stages use four choices and one valid correct answer.
- All mapped case targets resolve to an existing lesson in their module.
- No duplicate stage contexts were found within any validation batch.
- No duplicate four-choice sets were found within any validation batch.
- No remaining correct-option length clues were found using the screening rule: correct choice longest by at least seven words over the next-longest choice.
- JavaScript syntax checks passed.
- Advanced progress now uses **4 stages per case** consistently.
- Advanced pass remains **>70%**.

## Adaptive case ordering

Case order is no longer purely fixed.

1. If a case directly maps to one of the learner's unresolved lesson gaps, it receives highest priority.
2. Otherwise, the case is ranked by semantic overlap between the case, its rationale, and the learner's unresolved lesson content.
3. Cases with stronger relevance appear earlier.

This is **adaptive ordering**, not a claim that every possible lesson gap has a dedicated Advanced case. The current bank has 67 cases, generally 2–3 per capability module.

## Version protection

New completed attempts store:

- `caseVersion: "case-v25"`
- case IDs used in the attempt
- adaptive lesson targets
- four-stage decision history
- raw score and percentage score

Old `case-v24` results are preserved as historical attempts. They do not satisfy the v25 Advanced requirement.

## Interpretation

Advanced Scenarios are independent CPTD-style practice created for the Academy. They are **not official ATD examination questions**, and the >70% Academy threshold is an internal progression rule rather than an ATD certification score.
