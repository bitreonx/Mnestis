# @mnemos/cli

> The memory layer for software — CLI to transform codebases into structured intelligence

Mnemos turns any repository into architecture humans and AI understand instantly — flows, domains, APIs, and capabilities.

## Installation

```bash
npm install -g @mnemos/cli
```

## Quick Start

```bash
# Analyze your codebase
mnemos .

# Query with hybrid retrieval (BM25 + embeddings)
mnemos memory query "auth middleware"

# Get task context for AI agents
mnemos memory context "fix login bug" --budget 8000

# Persist episodic memory
mnemos memory remember "JWT in httpOnly cookie" --tag auth
```

## Features

- **100% On-Device** — No cloud, no API keys, no telemetry
- **Hybrid Retrieval** — BM25 + local 384-dim embeddings with RRF
- **Episodic Memory** — Agents remember decisions across sessions
- **Architecture DNA** — Flows, domains, services, and API contracts
- **Repository Intelligence** — Risk heatmaps, dead code, and trends

## Documentation

Full documentation at [mnemos.dev](https://mnemos.dev)

## License

MIT © [Mnemos](https://github.com/bitreonx/mnemos)
