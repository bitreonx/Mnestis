# Contributing To Mnemos

Thanks for contributing to Mnemos.

Mnemos is a local-first architecture intelligence toolkit. The core product promise is simple: build once, then let humans, REST clients, and MCP clients consume the same repository memory without drift.

This guide explains how to work in the monorepo, how to validate changes, and what to update when you touch shared runtime, REST, or MCP behavior.

## Principles

- **Local-first**: Mnemos should work from local repository artifacts in `.mnemos/`
- **No API keys**: core workflows should not require remote services
- **One runtime**: `MnemosRuntime` is the source of truth for agent-facing behavior
- **Protocol parity**: if a feature exists in MCP and should exist in REST, keep them aligned
- **Actionable outputs**: prefer typed envelopes, explicit error codes, and concrete hints
- **Docs are product surface**: update docs whenever setup, endpoints, tools, or workflows change

## Monorepo Layout

- `packages/core`: analysis engine, shared runtime, REST server, MCP server
- `packages/cli`: end-user commands such as `mnemos build`, `mnemos serve`, `mnemos mcp`, and `mnemos setup`
- `packages/ui`: interactive dashboard
- `mnemos-bench`: reproducible benchmark and regression evaluation suite

## Getting Started

```bash
npm install
npm run build
npm test
```

To test the full local flow against this repository:

```bash
npx mnemos .
mnemos serve
mnemos mcp --setup
```

## Shared Runtime Rules

If you change agent-facing functionality, start with `packages/core/src/agent-runtime.ts`.

- Add new repository intelligence to `MnemosRuntime` first
- Reuse runtime methods from both `serve.ts` and `mcp-server.ts`
- Return typed `AgentEnvelope` responses for success cases
- Throw `MnemosAgentError` for expected failure cases
- Include actionable hints for user-fixable errors such as missing builds or unknown nodes

### Error codes

Prefer explicit codes over ad hoc strings:

- `NOT_BUILT`
- `NOT_FOUND`
- `GRAPH_UNAVAILABLE`
- `INVALID_INPUT`
- `INTERNAL`

If you add a new error code, document where it appears and why a client should branch on it.

## REST And MCP Checklist

When a change affects architecture queries, setup flow, or agent-facing output, review all of the following:

- `packages/core/src/agent-runtime.ts`
- `packages/core/src/mcp-server.ts`
- `packages/core/src/serve.ts`
- `packages/core/src/mcp-config.ts`
- `packages/cli/src/index.ts`
- `README.md`

For runtime-facing changes, ask these questions:

1. Does MCP expose it?
2. Should REST expose it too?
3. Does the response include both human-readable markdown and structured data?
4. Does the error path include a stable code and hint?
5. Does Cursor setup or `/mcp-setup` documentation need updating?

## MCP Expectations

Mnemos ships a production MCP server intended for community IDE integration.

Keep these behaviors stable unless there is a strong reason to change them:

- Tool names and descriptions should be clear and task-oriented
- Server instructions should tell clients to read DNA first and use workflow-aware tools
- Resources should stay discoverable under `mnemos://repository/*`
- Prompts should help a client bootstrap without guessing the repository workflow
- Responses should preserve the markdown body plus structured JSON pattern

If you add or remove a tool, resource, or prompt:

- update `README.md`
- update `buildMcpSetupMarkdown()` text if needed
- confirm `mnemos mcp --setup` still tells a correct story

## Cursor Setup Expectations

`mnemos setup --platform cursor` should continue to be the simplest supported path for IDE onboarding.

Today that setup writes:

- `.cursor/rules/mnemos-architecture.mdc`
- `.cursor/mcp.json`

If you change the setup format or supported workflow:

- keep manual config instructions available
- update CLI output text
- update `README.md`
- verify the generated JSON still works on Windows, macOS, and Linux

## Language And Parser Changes

Mnemos supports **52 programming languages** via `packages/core/src/languages/`. Changes here affect scanning, parsing, generated `.mnemos/context/languages.md`, and knowledge-graph quality.

### Architecture

```mermaid
flowchart TB
  registry[languages/registry.ts] --> infer[inferLanguage]
  registry --> profiles[Extractor profiles]
  infer --> mask[parser/source-mask.ts]
  mask --> extract[parser/index.ts]
  profiles --> extract
  extract --> graph[graph/builder.ts]
  docs[languages/docs.ts] --> context[context/languages.md]
```

### Checklist

When adding or changing language support:

1. Add `LanguageDefinition` + profile in `languages/registry.ts`
2. Add lexical tests in `languages/languages.test.ts`
3. Run `npm test` in `packages/core`
4. Update [docs/LANGUAGES.md](../docs/LANGUAGES.md) if the public language list changes — or run `npm run docs:sync`
5. Run `npx mnemos .` and verify `.mnemos/context/graphs.md` and `.mnemos/context/languages.md` render Mermaid charts

Dedicated extractors (14 legacy languages) live in `parser/index.ts`. Profile-based languages use `parser/profile-extractors.ts` with `codeMask` validation — do not regex raw files without the lexical pipeline.

## Documentation Standards

Treat documentation as part of the product.

Update docs whenever you change:

- quick start commands
- setup commands
- REST endpoints
- MCP tools, resources, or prompts
- error codes
- output file names
- benchmark claims or performance guidance

At minimum, review:

- `README.md`
- `CONTRIBUTING.md`
- package-specific READMEs if the change is package-local

## Testing

Before opening a PR for code changes, run:

```bash
npm run build
npm test
```

Use targeted validation when relevant:

```bash
npx mnemos .
mnemos serve
mnemos mcp --setup
```

If your change affects benchmarks or regression logic, also run the relevant bench scripts from `mnemos-bench`.

## Pull Requests

Good PRs for Mnemos usually include:

- a clear problem statement
- user-visible behavior change
- implementation notes when runtime or protocol behavior changes
- docs updates when commands or workflows change
- focused validation notes

If a PR changes the shared runtime, REST routes, or MCP tools, call that out explicitly in the PR description.

## Release Quality Bar

Mnemos should feel like reference infrastructure for local IDE integration.

Before merging user-facing changes, check that:

- a new user can understand the setup from `README.md`
- a contributor can see where shared runtime behavior lives
- REST and MCP still tell the same story
- local-first and zero-key workflows remain intact
- setup output is copy-pasteable
