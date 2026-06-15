/**
 * @type {import('semantic-release').GlobalConfig}
 */
export default {
  // PUBLISHING POLICY (pre-stable): `main` publishes prereleases to the npm `alpha` dist-tag
  // as X.Y.Z-alpha.N. `latest` must NOT be updated until we deliberately cut the first stable
  // release — 3.0.0, the next major above the prematurely published (now-deprecated) 2.x.
  // `stable` is an inert placeholder: semantic-release rejects a prerelease-only config, so a
  // release branch must exist. Do not push release commits to it until the cutover.
  // See CLAUDE.md "Releasing / Publishing" for the policy and the 3.0.0 cutover steps.
  branches: ["stable", { name: "main", prerelease: "alpha" }],
  plugins: [
    ["@semantic-release/commit-analyzer", { preset: "conventionalcommits" }],
    [
      "@semantic-release/release-notes-generator",
      { preset: "conventionalcommits" },
    ],
    [
      "@anolilab/semantic-release-pnpm",
      { pkgRoot: "package", npmPublish: true },
    ],
    "@semantic-release/github",
  ],
};
