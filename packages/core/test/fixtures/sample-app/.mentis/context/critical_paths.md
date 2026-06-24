# Critical Paths

High-risk paths where changes have wide blast radius.

## Critical path diagram

```mermaid
flowchart TD
  subgraph P0 ["high Login Flow"]
    P0N0["page.tsx"]
    P0N1["page.tsx"]
    P0N0 --> P0N1
    P0N2["service.ts:7"]
    P0N1 --> P0N2
    P0N3["page.tsx:1"]
    P0N2 --> P0N3
    P0N4["page.tsx:3"]
    P0N3 --> P0N4
  end
```

## Login Flow

- **Risk**: HIGH
- **Nodes involved**: 5
- **Description**: Login Flow spanning 1 related files
