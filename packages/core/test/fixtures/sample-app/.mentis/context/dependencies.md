# Key Dependencies

Top dependency relationships by frequency.

## Dependency graph (top edges)

```mermaid
flowchart LR
  A0["app/login/page.tsx"] --> B0["login"]
  A0 -. 1x .-> B0
  A1["src/auth/service.ts"] --> B1["authenticate"]
  A1 -. 1x .-> B1
```

## Service dependency graph

```mermaid
flowchart TB
  SV0["app (1)"]
  SV1["src (1)"]
```

- **app/login/page.tsx → login**: 1 references
- **src/auth/service.ts → authenticate**: 1 references
