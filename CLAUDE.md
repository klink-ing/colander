# CLAUDE.md

Guidance for Claude Code and other agents working in this repository.

## Releasing / Publishing

**Status: pre-stable.** The API is unstable and changes frequently. `3.0.0` is published to
`latest`, but it was cut by the `feat!` merge of #22 _before_ the alpha strategy (#23) landed —
it was not a deliberate stable cutover. `2.x` is deprecated; `3.0.0` is not.

**Default release channel is `alpha`.** Version-bumping commits on `main` are published by
semantic-release as `X.Y.Z-alpha.N` (currently the `3.1.0-alpha.N` line).

**Known discrepancy:** the config sets `prerelease: "alpha"` but no `channel`, so
semantic-release defaults the channel — and the npm dist-tag — to the branch name. Prereleases
are therefore on the **`main`** dist-tag, not `alpha`: use `npm install @klinking/colander@main`
(`@alpha` does not resolve). Adding `channel: "alpha"` to the `main` branch entry would fix this.

**Do not move `latest`** (stable channel) except via a deliberate stable cutover, below.

Mechanics:

- Config: [`release.config.mjs`](release.config.mjs) →
  `branches: ["stable", { name: "main", prerelease: "alpha" }]`.
- Workflow: [`release.yml`](.github/workflows/release.yml) runs semantic-release on every push
  to `main`. `main` is the only PR target and the only releasing branch.
- `stable` is an **inert placeholder branch** required by semantic-release (it rejects a
  prerelease-only config). Do not push release commits to it. (`stable` is exempt from the
  "Enforce branch folders" repo ruleset so it can exist as a top-level branch.)
- Only `feat`/`fix`/breaking commits release; `chore:`/`ci:`/`docs:` don't trigger a publish.

### Cutting the next stable release (when the API is deemed stable)

1. In [`release.config.mjs`](release.config.mjs), set `branches: ["main"]` (drop the prerelease
   and the placeholder).
2. Optionally delete the placeholder branch: `git push origin --delete stable` (leaving it is
   harmless; if the branch-folder ruleset exemption was removed, re-add it first to delete).
3. Push to `main` → semantic-release strips the prerelease suffix and publishes the next
   stable (e.g. `3.1.0`) to `latest`. Verify with `npx semantic-release --dry-run` first.
