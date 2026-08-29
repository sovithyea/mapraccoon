<!--
  This PR body is written for the next person or agent to read cold, weeks from
  now, with none of your context. That is its whole job.

  Assume the reader will act on it. If a section would be a guess, say so or
  leave it out — a confident wrong sentence here is worse than a missing one.
  Delete sections that genuinely do not apply; do not delete them to save time.
-->

## What this does

<!-- One paragraph. The point of the change, in plain terms. Not a file list. -->

## Why

<!--
  The problem, need, or decision behind it. What was true before that made this
  necessary. If it came from a decision in docs/DECISIONS.md, name the ID; if it
  created a new one, say so and name it.
-->

## What changed

<!--
  Grouped by area, not a dump of `git diff --name-only`. Roughly:

  - `src/lib/...` — what and, where it is not obvious, why
  - `docs/...` — which docs and what claim changed

  Call out anything that changes behaviour for existing code: a moved route, a
  renamed export, a changed default. Those are what break the next person.
-->

## Verified

<!--
  What you actually ran and actually observed. Commands and results, not
  adjectives. This mirrors docs/VERIFIED.md: observed fact, not assertion.

  ```
  npm run build      # 51 static pages
  npm run lint       # clean
  npm run typecheck  # clean
  npm test           # 20 passed
  ```

  Plus whatever is specific to this change — a measurement, a screenshot, a
  request you made against a running server.
-->

## Not done / known gaps

<!--
  Deliberate omissions, things left broken, blockers hit. Be specific about what
  is UNVERIFIED versus what is verified-and-fine — this repo's content makes
  factual claims about real places, so the distinction matters more than usual.

  If an acceptance criterion in the phase spec is still open, say which.
-->

## Decisions and risks touched

<!--
  IDs only, with a word each. `git log --grep='D10'` should keep working.

  - D-nn — added / applied / superseded
  - R-nn — mitigated / still open / newly raised
-->

## For whoever picks this up next

<!--
  The most useful section, and the easiest to skip. Write it anyway.

  - Where to start reading
  - Any trap you hit that is not obvious from the code (the kind of thing that
    cost you an hour)
  - What you would do next if you kept going
-->
