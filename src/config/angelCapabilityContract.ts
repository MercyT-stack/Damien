export type AngelCapabilityState =
  | 'implemented'
  | 'implemented_with_platform_limits'
  | 'integration_ready'
  | 'future_native'
  | 'security_hardening_required';

export interface AngelCapabilityContract {
  id: string;
  label: string;
  state: AngelCapabilityState;
  permissionRequired: boolean;
  notes: string;
}

/**
 * Canonical capability contract shared by Angel's UI/planning layers.
 *
 * This is intentionally descriptive rather than an execution registry. The
 * runtime must still verify authentication, authorization, connector state,
 * and execution results before claiming that an external action succeeded.
 */
export const ANGEL_CAPABILITY_CONTRACT: readonly AngelCapabilityContract[] = [
  {
    id: 'chat',
    label: 'Conversation and streaming chat',
    state: 'implemented',
    permissionRequired: false,
    notes: 'Chat is Angel’s primary workspace and supports streamed responses.',
  },
  {
    id: 'memory',
    label: 'Persistent memory and conversation history',
    state: 'implemented',
    permissionRequired: false,
    notes: 'Persistent data belongs in the authenticated Supabase data model.',
  },
  {
    id: 'projects',
    label: 'Projects and project-scoped context',
    state: 'implemented',
    permissionRequired: false,
    notes: 'Projects provide bounded context and memory in addition to global memory.',
  },
  {
    id: 'live_voice',
    label: 'Live voice conversation',
    state: 'implemented',
    permissionRequired: true,
    notes: 'Microphone access is platform-permission controlled.',
  },
  {
    id: 'voice_tone',
    label: 'Dynamic voice tone and delivery',
    state: 'implemented',
    permissionRequired: false,
    notes: 'Voice delivery can be adjusted without changing Angel’s core identity.',
  },
  {
    id: 'wake_word',
    label: 'Wake-word detection',
    state: 'implemented_with_platform_limits',
    permissionRequired: true,
    notes: 'The current web implementation depends on browser audio/runtime permissions; native background wake is separate future work.',
  },
  {
    id: 'vision',
    label: 'Camera, image, document and screen understanding',
    state: 'implemented_with_platform_limits',
    permissionRequired: true,
    notes: 'Camera and screen capture depend on platform permissions and browser capabilities.',
  },
  {
    id: 'agent_orchestration',
    label: 'Planning, tool selection and verification',
    state: 'implemented',
    permissionRequired: false,
    notes: 'Agent execution follows an understand/plan/permission/execute/verify lifecycle.',
  },
  {
    id: 'web_research',
    label: 'Web search and deep research',
    state: 'implemented',
    permissionRequired: false,
    notes: 'Current-information workflows must preserve source/verification boundaries.',
  },
  {
    id: 'creation_tools',
    label: 'Documents, presentations, spreadsheets, code and diagrams',
    state: 'implemented',
    permissionRequired: false,
    notes: 'Generated artifacts should be auditable and persisted through the workspace model where applicable.',
  },
  {
    id: 'external_integrations',
    label: 'GitHub, Google Workspace, Microsoft 365, Canva, WhatsApp and CapCut',
    state: 'integration_ready',
    permissionRequired: true,
    notes: 'A declared connector is not considered executable until its account is authenticated and the requested scope is authorized.',
  },
  {
    id: 'voice_identity',
    label: 'Speaker/voice identity',
    state: 'implemented_with_platform_limits',
    permissionRequired: true,
    notes: 'Useful for personalization and additional verification; not a replacement for production-grade authentication.',
  },
  {
    id: 'rls_hardening',
    label: 'Production-grade Supabase ownership/RLS hardening',
    state: 'security_hardening_required',
    permissionRequired: false,
    notes: 'Final production policies must enforce authenticated user ownership rather than universal true policies.',
  },
  {
    id: 'native_device_agent',
    label: 'Native mobile/desktop device agent',
    state: 'future_native',
    permissionRequired: true,
    notes: 'Covers background wake, native device services, push/background behavior and deeper OS integration.',
  },
] as const;

export function getAngelCapability(id: string): AngelCapabilityContract | undefined {
  return ANGEL_CAPABILITY_CONTRACT.find((capability) => capability.id === id);
}
