import { ContextManager, ContextManagerAPI } from '../context-manager/context-manager';
import { AgentConversationProps } from '../agent-conversation/agent-conversation';

interface AgentConversationManagerProps {
  agentName: string;
  onTokenNeeded: () => Promise<string>;
  platformAdapter?: AgentConversationProps['platformAdapter'];
}

// Default API implementation that throws errors - consuming apps should provide their own
const defaultAPI: ContextManagerAPI = {
  async listContexts() {
    throw new Error('listContexts not implemented. Please provide a proper API implementation.');
  },
  async createContext() {
    throw new Error('createContext not implemented. Please provide a proper API implementation.');
  }
};

/**
 * @deprecated Use ContextManager directly with the api prop instead
 * This component is kept for backward compatibility
 */
export function AgentConversationManager({
  agentName,
  onTokenNeeded,
  platformAdapter
}: AgentConversationManagerProps) {
  // For backward compatibility, just render ContextManager with default API
  // Apps should migrate to using ContextManager directly
  return (
    <ContextManager
      api={defaultAPI}
      agentName={agentName}
      onTokenNeeded={onTokenNeeded}
      platformAdapter={platformAdapter}
      onError={(error) => console.error('AgentConversationManager:', error)}
    />
  );
}