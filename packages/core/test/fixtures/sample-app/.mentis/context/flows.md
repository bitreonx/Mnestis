# Execution Flows

2 flows detected across the codebase.

## Flow overview

```mermaid
flowchart TB
  F0["/login"]
  F0 --> E0["app/login/page.tsx"]
  F1["Login Flow"]
  F1 --> E1["app/login/page.tsx"]
```

### /login

HTTP request: 5 steps through file → api → function → route

```mermaid
flowchart LR
  S0["file: app/login/page.tsx"]
  S1["api: /login"]
  S0 --> S1
  S2["function: login"]
  S1 --> S2
  S3["route: /login"]
  S2 --> S3
  S4["function: LoginPage"]
  S3 --> S4
```

### Login Flow

Login Flow spanning 1 related files

```mermaid
flowchart LR
  S0["file: app/login/page.tsx"]
  S1["api: /login"]
  S0 --> S1
  S2["function: login"]
  S1 --> S2
  S3["route: /login"]
  S2 --> S3
  S4["function: LoginPage"]
  S3 --> S4
```

## Request Flows

### /login

- **Type**: request
- **Confidence**: 90%
- **Entry**: `app/login/page.tsx`
- **Steps**: 5

```
1. [file] app/login/page.tsx (app/login/page.tsx)
2. [api] /login (app/login/page.tsx)
3. [function] login (src/auth/service.ts:7)
4. [route] /login (app/login/page.tsx:1)
5. [function] LoginPage (app/login/page.tsx:3)
```

HTTP request: 5 steps through file → api → function → route

## User Journey Flows

### Login Flow

- **Type**: user_journey
- **Confidence**: 65%
- **Entry**: `app/login/page.tsx`
- **Steps**: 5

```
1. [file] app/login/page.tsx (app/login/page.tsx)
2. [api] /login (app/login/page.tsx)
3. [function] login (src/auth/service.ts:7)
4. [route] /login (app/login/page.tsx:1)
5. [function] LoginPage (app/login/page.tsx:3)
```

Login Flow spanning 1 related files
