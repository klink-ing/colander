# CLAUDE.md

Guidance for Claude Code and other agents working in this repository.

## Releasing / Publishing

**Status: pre-stable.** The API is unstable and changes frequently. The first stable release
will be **`3.0.0`** — the next major above the prematurely published (now-deprecated) `2.x`.

**Default release channel is `alpha`.** Version-bumping commits on `main` are published by
semantic-release as `X.Y.Z-alpha.N` to the npm **`alpha`** dist-tag. Install the latest
prerelease with `npm install @klinking/colander@alpha`.

**Never publish to `latest`** (the stable channel) until a deliberate `3.0.0` cutover. Until
then `latest` stays on the deprecated `2.0.3`.

Mechanics:

- Config: [`release.config.mjs`](release.config.mjs) →
  `branches: ["stable", { name: "main", prerelease: "alpha" }]`.
- `stable` is an **inert placeholder branch** required by semantic-release (it rejects a
  prerelease-only config). Do not push release commits to it. (`stable` is exempt from the
  "Enforce branch folders" repo ruleset so it can exist as a top-level branch.)
- The alpha line only resolves to `3.0.0-alpha.N` once a **breaking change** (`feat!:` /
  `BREAKING CHANGE:`) lands since `v2.0.3`; a plain `feat:` would yield a `2.x` alpha line, and
  the strategy/config commits (`chore:`/`ci:`/`docs:`) don't trigger a release at all.

### Cutting the stable 3.0.0 release (when the API is deemed stable)

1. Ensure ≥1 breaking change exists since `v2.0.3` so the version resolves to `3.0.0`.
2. In [`release.config.mjs`](release.config.mjs), set `branches: ["main"]` (drop the prerelease
   and the placeholder).
3. Optionally delete the placeholder branch: `git push origin --delete stable` (leaving it is
   harmless; if the branch-folder ruleset exemption was removed, re-add it first to delete).
4. Push to `main` → semantic-release publishes **`3.0.0`** to `latest`. Verify with
   `npx semantic-release --dry-run` first.
