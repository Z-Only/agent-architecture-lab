# Agent Architecture Lab · Agent 架构实验室

An explainable, browser-local workbench for selecting an agent architecture and rehearsing failure boundaries. Change requirements, inspect the resulting blueprint, inject a fault, and export a design brief. 中文 / English; light / dark / system themes.

**This is a deterministic educational simulation, not a hosted agent, LLM call, benchmark, or production safety guarantee.** It does not execute tools, run user code, or contact a model provider. No account, API key, backend, or database is needed.

## Why this product

Agent complexity is easy to add and hard to justify. This workbench makes its rules visible: fixed versus dynamic steps, parallel work, side effects, retrieval, checkpoint needs, and retry limits. Recommendations are a starting point for engineering review, not a universal framework ranking.

The business core is TypeScript, shared directly with the Vue application. A separate Rust service would add deployment complexity without improving this local-only product. The original requirement for a useful AI-related product is met by the architecture workbench rather than unnecessary model integration.

## Run locally

Use Node 24 and Bun 1.4.2. Exact dependency versions are in `package.json` and `bun.lock`. Current pins: Vue 3.5.43, Vite 8.3.2, TypeScript 6.0.3, vue-tsc 3.3.11, Vitest 5.0.3, Vue Test Utils 2.5.1 and happy-dom 20.14.5. TypeScript 7.0.2 was evaluated but rejected because current vue-tsc requires a TypeScript entrypoint that 7.0.2 does not export; the compatible stable 6.0.3 release is pinned instead.

```sh
bun install --frozen-lockfile
bun run dev
bun run typecheck
bun run test:coverage
bun run build
python3 -m unittest discover -s scripts -p 'test_*.py'
python3 scripts/check_coverage.py --base origin/main --report coverage/lcov.info . --total-min 95 --changed-min 95
```

`dist/` is a static website. It can run on any static host; ChatGPT Sites is the managed production host. There are no environment variables or secrets required for application behavior.

## Structure

- `src/domain/`: validated inputs, explainable blueprint rules, deterministic bounded simulator
- `src/components/`: native accessible controls and responsive workspace
- `src/`: application state, translations, browser-local persistence and export
- `tests/`: regression tests for transitions, rendering and failure states
- `scripts/`: fail-closed aggregate and changed-line coverage gate, with its own tests
- `.github/`: CI and dependency updates

## Simulation contract and limitations

A fixed sequential task maps to a pipeline; fixed parallel work maps to routed/fan-out work; dynamic tasks map to bounded orchestration. The displayed blueprint explains its choice. These deliberately small rules are inspectable, not an AI inference.

Faults occur in modeled reads/work validation before external side effects. Retry counts are bounded. An irreversible action requires approval; a denied approval must not execute that action. Retrying an uncertain external write is **not** modeled as safe.

Checkpoint indicators describe a proposed architecture. They are not durable execution state. Browser storage only saves local configuration. The app does not resume real interrupted processes or predict model quality, latency, prices, or reliability. Do not enter secrets in configuration files.

## Research basis

Evidence reviewed 2026-10-01. Conceptual guidance is linked rather than copying version-sensitive SDK code:

- [Anthropic: Building effective agents](https://www.anthropic.com/engineering/building-effective-agents): predefined workflows versus model-directed agents; prefer the simplest sufficient design. Its original tooling discussion is historical.
- [LangGraph persistence](https://docs.langchain.com/oss/javascript/langgraph/persistence): checkpoints and threads; in-memory state does not survive process restarts.
- [LangGraph interrupts](https://docs.langchain.com/oss/javascript/langgraph/interrupts): approval interruption and resume; interrupted nodes restart, so pre-interrupt effects require care.
- [LangGraph fault tolerance](https://docs.langchain.com/oss/javascript/langgraph/fault-tolerance): bounded retries, timeouts, and recovery handling.
- [OpenAI Agents SDK human-in-the-loop](https://openai.github.io/openai-agents-python/human_in_the_loop/): approval as an execution boundary.

The product is not affiliated with or endorsed by these providers.

## Quality and release workflow

After the explicitly approved README-only initialization, every implementation change goes through a branch and pull request. Required `ci-gate` combines type checking, tests, production build, and coverage. Overall and changed executable lines must each reach 95%. Missing source reports fail; CSS-only changes are evaluated with browser geometry, not invented executable coverage.

CodeRabbit is advisory and quota-aware. Valid findings must be handled, but quota exhaustion is not a required status failure. Dependabot proposes weekly Bun text-lockfile and Actions updates; compatibility, tests and the same gates remain mandatory. [GitHub documents Bun support](https://docs.github.com/en/code-security/reference/supply-chain-security/supported-ecosystems-and-repositories).

Release sequence: verify exact PR head → merge under protection → build merged source → prepare Sites source and static archive → deploy → test the actual public version. The platform's source SHA may differ from GitHub's; deployment records must map the identical source content.

Sites ownership and its manifest belong to the deployment checkout. Do not put credentials or personal browser state in this repository. Reusing this open-source project does not require access to the original Site.

## Visitor acceptance

Verify all constraints, fault outcomes, rejection blocking, retry exhaustion, exports, local persistence/reset, keyboard focus, locale/theme changes, and error states. Check desktop and measured 320/390 CSS-pixel viewports for overlapping controls and horizontal overflow. Ordinary window resize plus page zoom tests narrow layouts, not real phone touch, keyboard, safe-area or browser behavior. Do not bypass browser security policies to emulate devices.

Stop a release loop when the agreed matrix passes and no new actionable in-scope defect remains; disclose untested capabilities. See [CONTRIBUTING.md](CONTRIBUTING.md) and [SECURITY.md](SECURITY.md).

## License

MIT. See [LICENSE](LICENSE).
