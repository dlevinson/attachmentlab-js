---
name: spec-implementation-audit
description: Use when a user wants a rigorous audit between intended behavior and actual code behavior, especially for simulation engines or research tools. Produce separate intended-model, actual-implementation, and mismatch artifacts; anchor findings to current line references; and prefer documenting real behavior over assumed behavior.
---

# Spec Implementation Audit

Use this skill when the user wants a careful audit of what code is supposed to do versus what it actually does.

## Goals

Produce three outputs whenever practical:

1. An intended-behavior document.
2. An actual-current-behavior document based on the live code.
3. A mismatch audit with concrete findings and file references.

If the user also wants maintainability help, add concise inline comments to the code describing current behavior, especially in the highest-risk control-flow and mutation points.

## Workflow

1. Re-read every file you plan to edit from disk first.
2. Identify the active executable path. Do not assume the neat architecture is the path the user is actually running.
3. Separate normative intent from implementation facts.
4. Build a function map with line anchors before writing the audit.
5. Describe actual behavior from the code as written, including fallbacks, retries, hidden heuristics, and silent parameter rewrites.
6. Call out any behavior that changes feasibility, stopping conditions, or parameter semantics.
7. Distinguish:
   - baseline model behavior
   - exploratory extensions
   - debugging safety nets
8. Prefer line-range summaries and decision-point comments over vague prose.

## Output structure

### Intended behavior

Write the intended model in human terms:

- state transitions
- feasibility rules
- stopping conditions
- parameter semantics
- extension boundaries

### Actual behavior

Summarize the active implementation by line range and function. Include:

- what each block does
- where fallback paths exist
- where heuristics are layered in
- where UI and engine are entangled

### Mismatch audit

List mismatches in severity order. Good mismatch classes include:

- silent parameter overrides
- extra feasibility constraints
- hidden retries or rescue logic
- stop-vs-fallback differences
- inconsistent geometry or crossing tests
- architecture drift that impairs correctness

## Commenting guidance

When adding inline comments:

- describe current behavior, not desired behavior
- focus on surprising control flow, heuristics, and state mutations
- avoid narrating obvious lines
- explicitly mark safety nets and non-baseline extensions

## Validation guidance

After the audit docs are written:

- run a syntax check if code changed
- re-open exact line anchors for any major findings before finalizing
- if a workaround exists that may hide a deeper bug, call that out explicitly

## Default deliverables

If the user does not specify names, prefer:

- `audit/INTENDED_MODEL_BEHAVIOR.md`
- `audit/CURRENT_WEB_IMPLEMENTATION.md`
- `audit/INTENDED_VS_IMPLEMENTED_AUDIT.md`

If the repo has a single-file standalone build plus a cleaner source tree, audit the active standalone path first.
