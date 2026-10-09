# Angel Unified Specification

This document is the canonical merge contract for the Angel project. It consolidates the approved capabilities and architectural decisions from the original `Angel` repository, the current `Damien` repository, and the project decisions made during development.

## Source-of-truth rule

- `MercyT-stack/Damien` is the active Angel implementation baseline.
- `MercyT-stack/Angel` is treated as the historical/prototype source of earlier Angel features.
- Current implementations win over older implementations when both provide the same capability.
- Older code is not copied merely because it exists: it must provide a capability that is still approved and must not reintroduce a known regression, obsolete architecture, placeholder behavior, or contradictory UX.

## Approved Angel identity

Angel is a general-purpose intelligent personal agent. It is not restricted to one job, industry, or business workflow.

Angel should be able to understand a request, reason about it, use the appropriate capability, obtain permission where required, execute the action, verify the result, and report what happened honestly.

## Approved interaction model

- Chat is the primary workspace.
- Live voice is a mode of Chat, not a separate top-level workspace.
- Voice configuration belongs in Settings.
- A fresh application start opens a fresh chat rather than automatically resuming the previous conversation.
- Previous conversations remain available in history.
- Chat supports streaming responses.
- The composer supports text, dictation, vision/camera, live voice, attachments, and response/intelligence controls.

## Approved memory model

Supabase is the permanent backend source of truth for persistent Angel data.

Angel memory is layered:

1. Explicit memories requested by the user.
2. Useful implicit memories extracted from conversations.
3. Semantic memory retrieval for relevant context.
4. Conversation summaries containing goals, decisions, unresolved questions, and next steps.
5. Project-scoped memories and context.
6. Conversation history and message persistence.

Memory deletion and correction must be explicit, auditable, and user-controlled.

## Approved agent architecture

The preferred execution lifecycle is:

`UNDERSTAND -> PLAN -> PERMISSION -> ACCESS -> EXECUTE -> OBSERVE -> VERIFY -> REPORT -> RELEASE ACCESS`

The agent system must distinguish between:

- capability declared
- capability supported
- capability available
- account authenticated
- user authorized
- action executable
- action verified

Angel must never claim an external action succeeded unless the system actually performed and verified it.

## Approved tool families

- Web search and deep research
- File/document analysis
- Document creation
- Presentation creation
- Spreadsheet/data analysis
- Code generation/workspace operations
- Diagram/visual creation
- Communication drafting
- Task planning
- Vision analysis
- World/current-information intelligence
- GitHub integration architecture
- Google Workspace integration architecture
- Microsoft 365 integration architecture
- Canva integration architecture
- WhatsApp integration architecture
- CapCut integration architecture
- Location/geographic intelligence

External integrations remain explicitly stateful. An integration that is not authenticated/connected must be represented as unavailable for execution rather than simulated as successful.

## Approved voice system

- Live voice conversation
- Streaming microphone input and Angel audio output
- User and Angel transcription
- Interruption/barge-in handling
- Voice selection
- Voice samples
- Dynamic voice tone/delivery configuration
- Wake phrases including `Hey Angel` and related configured variants
- End-conversation/end-live commands
- Voice identity/speaker recognition architecture
- Sensitive-action verification using stronger authorization rules

The current web wake-word implementation must not be represented as equivalent to a native OS-level background wake-word service. Native background wake word remains a future device-layer capability.

## Approved vision/device capabilities

- In-Angel camera capture
- Image analysis
- Document/image understanding
- OCR
- UI/screenshot analysis
- Screen capture where the platform grants permission
- Device capability awareness

Continuous background device awareness is not assumed from browser APIs and remains a future native-platform capability.

## Approved security principles

- User permission is required for sensitive external actions.
- Permissions should be scoped and revocable.
- High-impact actions require stronger confirmation/verification.
- Audit task runs, tool calls, permission changes, and externally meaningful actions.
- Supabase Row Level Security must enforce authenticated user ownership; permissive `true` policies are not acceptable as the final production security model.
- Voice identity is a convenience/security layer, not the sole production authentication factor for high-impact actions.

## Approved future platform direction

Angel is intended to evolve from a web-first application into a cross-device agent with native mobile/desktop capabilities.

Native platform work should provide the capabilities browser applications cannot reliably provide, including background wake-word services, native device permissions, push/background behavior, and deeper OS/device integration.

## Deliberately superseded approaches

These are not to be reintroduced as the primary architecture:

- Standalone Live/Voice top-level navigation.
- Old hex-logo navigation as the canonical Angel identity.
- Automatically resuming the previous chat on fresh application launch.
- The old monolithic server/task architecture when an equivalent newer service architecture exists.
- Placeholder integrations presented as real connected integrations.
- Old UI components that depend on obsolete types, endpoints, or assumptions.

## Merge principle

The goal is not a literal file-for-file merge. The goal is a **capability merge**: preserve the strongest working implementation from the current repository, recover genuinely valuable approved capabilities from the historical repository, and reject regressions, obsolete code, duplicated systems, unsafe defaults, and mock behavior that can be mistaken for real execution.
