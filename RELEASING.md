# Releases

## Current npm publishing: GitHub Actions OIDC

The npm package `@signalsafe/simulator-react` uses trusted publishing from
`SignalSafeSoftware/simulator-react`, workflow `ci.yml`. The connection permits
`npm publish` and staged publishing; separate dist-tag management is not granted.
Publishing jobs use GitHub-hosted runners, Node 24, npm 11.21.2 and scoped
`id-token: write` permission. Reusable workflow callers also grant this permission.
No `NPM_TOKEN` publishing secret or `npm whoami` precheck is required.

For this migration, release `0.22.1` with immutable tag `v0.22.1`
after the migration PR and all required checks pass. Publish only through the
workflow after merging the reviewed commit; do not move an existing release tag.
Existing quality gates, package smoke checks and approved-archive checks remain
required wherever configured. Python releases and dependency-install credentials
are independent of this npm authentication change.

Verify the GitHub publish job succeeds, npm serves the expected version/archive,
and the package's trusted publisher status becomes validated. A newly saved
connection must publish within npm's two-day validation window. Retain existing
token access until OIDC publishing is verified; disabling token publishing and
removing unused secrets is a separate follow-up. Never log credentials or OIDC tokens.
