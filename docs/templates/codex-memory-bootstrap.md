# Memory Bootstrap Template

## Seed only these kinds of notes

- recurring operator constraints
- stable verification expectations
- environment caveats that repeatedly affect execution

## Do not seed these

- once-off release verdicts
- stale timestamps
- temporary blockers that belong in the current thread
- full copies of repo checklists

## Promote-to-doc triggers

Promote a memory note into repo docs when:

- it changes operator behavior
- it affects merge/release decisions
- it will likely matter in future handoffs

## Prune triggers

Prune or replace working memory when:

- `pnpm ops:verify` has established a newer canonical state
- a blocker is resolved
- the note is no longer useful without thread-local context
