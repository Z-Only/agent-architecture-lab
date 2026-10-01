# Contributing

Create a branch and pull request; never push implementation changes directly to main. Run the documented type checks, tests, coverage gate, and production build before requesting review.

The required `ci-gate` must pass. Total and changed executable-line coverage must each be at least 95%. Missing production source records fail closed; style-only changes must receive rendered browser validation rather than invented executable coverage. CodeRabbit is advisory and quota-aware, not a required check. Address valid findings regardless of the source.

Keep changes scoped and verify responsive layouts at measured 320/390 CSS pixels and desktop. Clearly label viewport resizing versus device emulation or real-device testing. Follow an approved merged commit through deployment and visitor verification. Never commit credentials, private inputs, browser state, or temporary QA artifacts.

Bun text lockfile and GitHub Actions updates are proposed weekly by Dependabot. Major updates need explicit compatibility analysis and the same PR gates. The automation configuration does not bypass human approval requirements or repository protection.
