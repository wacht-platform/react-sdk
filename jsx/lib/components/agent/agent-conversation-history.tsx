import { useState } from "react";
import styled from "styled-components";
import { ChevronLeft, MessageCircle, Trash2 } from "lucide-react";
import { useAgentConversationContext } from "../../context/agent-conversation-provider";
import { ConversationSession } from "../../hooks/use-conversation-sessions";
import { DefaultStylesProvider } from "../utility/root";
import { ConfirmationPopover } from "../utility/confirmation-popover";

interface AgentConversationHistoryProps {
  showBackButton?: boolean;
}

const Container = styled.div`
  height: 100%;
  display: flex;
  flex-direction: column;
  background: var(--color-background);
`;

const Header = styled.div`
  display: flex;
  align-items: center;
  gap: var(--space-md);
  padding: var(--space-lg);
  border-bottom: 1px solid var(--color-border);
`;

const BackButton = styled.button`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  border: none;
  background: transparent;
  color: var(--color-foreground);
  cursor: pointer;
  border-radius: var(--radius-md);
  transition: background 0.2s;

  &:hover {
    background: var(--color-background-hover);
  }
`;

const Title = styled.h1`
  flex: 1;
  margin: 0;
  font-size: var(--font-lg);
  font-weight: 400;
  color: var(--color-foreground);
`;

const SearchContainer = styled.div`
  padding: var(--space-lg);
  border-bottom: 1px solid var(--color-border);
`;

const SearchInput = styled.input`
  width: 100%;
  padding: var(--space-sm) var(--space-md);
  background: var(--color-background-subtle);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  font-size: var(--font-sm);
  color: var(--color-foreground);
  transition: all 0.2s;

  &::placeholder {
    color: var(--color-secondary-text);
  }

  &:focus {
    outline: none;
    border-color: var(--color-primary);
    background: var(--color-background);
  }
`;

const SessionsList = styled.div`
  flex: 1;
  overflow-y: auto;
  padding: var(--space-lg);
`;

const SessionGroup = styled.div`
  margin-bottom: var(--space-xl);
`;

const GroupTitle = styled.h3`
  font-size: var(--font-xs);
  font-weight: 400;
  color: var(--color-muted);
  margin: 0 0 var(--space-sm) 0;
  text-transform: uppercase;
  letter-spacing: 0.05em;
`;

const SessionItem = styled.div`
  display: flex;
  align-items: center;
  gap: var(--space-md);
  padding: var(--space-md);
  margin-bottom: var(--space-xs);
  background: var(--color-surface, var(--color-background));
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  cursor: pointer;
  transition: all 0.15s;

  &:hover {
    background: var(--color-surface-hover, var(--color-background-hover));
    border-color: var(--color-border-hover, var(--color-border));
  }
`;

const SessionIcon = styled.div`
  width: 36px;
  height: 36px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--color-background-subtle);
  border-radius: var(--radius-md);
  color: var(--color-secondary-text);
`;

const SessionContent = styled.div`
  flex: 1;
  min-width: 0;
`;

const SessionTitle = styled.div`
  font-size: var(--font-sm);
  font-weight: 400;
  color: var(--color-foreground);
  margin-bottom: var(--space-2xs);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
`;

const SessionMeta = styled.div`
  font-size: var(--font-2xs);
  color: var(--color-secondary-text);
  display: flex;
  align-items: center;
  gap: var(--space-xs);
`;

const StatusBadge = styled.span<{ $status: string }>`
  display: inline-block;
  padding: 2px 6px;
  border-radius: var(--radius-sm);
  font-size: 10px;
  font-weight: 400;
  background: ${props => {
    switch (props.$status) {
      case 'running': return 'var(--color-success-bg)';
      case 'waiting_for_input': return 'var(--color-warning-bg)';
      case 'failed': return 'var(--color-error-bg)';
      default: return 'var(--color-background-subtle)';
    }
  }};
  color: ${props => {
    switch (props.$status) {
      case 'running': return 'var(--color-success)';
      case 'waiting_for_input': return 'var(--color-warning)';
      case 'failed': return 'var(--color-error)';
      default: return 'var(--color-secondary-text)';
    }
  }};
`;

const DeleteButton = styled.button`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  border: none;
  background: transparent;
  color: var(--color-secondary-text);
  cursor: pointer;
  border-radius: var(--radius-sm);
  transition: all 0.2s;

  &:hover {
    background: var(--color-error-bg);
    color: var(--color-error);
  }
`;

const EmptyState = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100%;
  padding: var(--space-2xl);
  color: var(--color-secondary-text);
  text-align: center;

  svg {
    width: 48px;
    height: 48px;
    margin-bottom: var(--space-md);
    opacity: 0.5;
  }
`;

const LoadingState = styled.div`
  display: flex;
  flex-direction: column;
  gap: var(--space-sm);
`;

const SkeletonCard = styled.div`
  display: flex;
  align-items: center;
  gap: var(--space-md);
  padding: var(--space-md);
  margin-bottom: var(--space-xs);
  background: var(--color-surface, var(--color-background));
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  animation: pulse 1.5s ease-in-out infinite;

  @keyframes pulse {
    0%, 100% {
      opacity: 1;
    }
    50% {
      opacity: 0.5;
    }
  }
`;

const SkeletonIcon = styled.div`
  width: 36px;
  height: 36px;
  background: var(--color-border);
  border-radius: var(--radius-md);
`;

const SkeletonContent = styled.div`
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: var(--space-xs);
`;

const SkeletonTitle = styled.div`
  height: 14px;
  width: 60%;
  background: var(--color-border);
  border-radius: var(--radius-sm);
`;

const SkeletonMeta = styled.div`
  height: 12px;
  width: 30%;
  background: var(--color-border);
  border-radius: var(--radius-sm);
  opacity: 0.6;
`;

export function AgentConversationHistory({
  showBackButton = false,
}: AgentConversationHistoryProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [sessionToDelete, setSessionToDelete] = useState<string | null>(null);
  const {
    sessions,
    loadingSessions: loading,
    selectSession,
    deleteSession,
    setShowHistory,
  } = useAgentConversationContext();

  const filteredSessions = sessions.filter(session =>
    session.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const groupSessionsByDate = (sessions: ConversationSession[]) => {
    const groups: { [key: string]: ConversationSession[] } = {};
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    const lastWeek = new Date(today);
    lastWeek.setDate(lastWeek.getDate() - 7);

    sessions.forEach(session => {
      const sessionDate = new Date(session.last_activity_at);
      let groupKey: string;

      if (sessionDate >= today) {
        groupKey = "Today";
      } else if (sessionDate >= yesterday) {
        groupKey = "Yesterday";
      } else if (sessionDate >= lastWeek) {
        groupKey = "This Week";
      } else {
        groupKey = "Older";
      }

      if (!groups[groupKey]) {
        groups[groupKey] = [];
      }
      groups[groupKey].push(session);
    });

    return groups;
  };

  const handleDeleteSession = (e: React.MouseEvent, sessionId: string) => {
    e.stopPropagation();
    setSessionToDelete(sessionId);
  };

  const confirmDelete = async () => {
    if (!sessionToDelete) return;

    try {
      await deleteSession(sessionToDelete);
      setSessionToDelete(null);
    } catch (error) {
      console.error("Failed to delete session:", error);
    }
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const sessionGroups = groupSessionsByDate(filteredSessions);

  return (
    <DefaultStylesProvider style={{ height: "100%", width: "100%" }}>
      <Container>
        <Header>
          {showBackButton && (
            <BackButton onClick={() => setShowHistory(false)}>
              <ChevronLeft size={20} />
            </BackButton>
          )}
          <Title>Conversation History</Title>
        </Header>

        <SearchContainer>
          <SearchInput
            type="text"
            placeholder="Search conversations..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </SearchContainer>

        <SessionsList>
          {loading ? (
            <LoadingState>
              {[1, 2, 3, 4, 5].map((i) => (
                <SkeletonCard key={i}>
                  <SkeletonIcon />
                  <SkeletonContent>
                    <SkeletonTitle />
                    <SkeletonMeta />
                  </SkeletonContent>
                </SkeletonCard>
              ))}
            </LoadingState>
          ) : filteredSessions.length === 0 ? (
            <EmptyState>
              <MessageCircle />
              <div>No conversations found</div>
              {searchQuery && (
                <div style={{ fontSize: 'var(--font-xs)', marginTop: 'var(--space-sm)' }}>
                  Try a different search term
                </div>
              )}
            </EmptyState>
          ) : (
            Object.entries(sessionGroups).map(([group, groupSessions]) => (
              <SessionGroup key={group}>
                <GroupTitle>{group}</GroupTitle>
                {groupSessions.map(session => (
                  <SessionItem
                    key={session.id}
                    onClick={() => selectSession(session)}
                  >
                    <SessionIcon>
                      <MessageCircle size={18} />
                    </SessionIcon>
                    <SessionContent>
                      <SessionTitle>{session.title}</SessionTitle>
                      <SessionMeta>
                        <span>{formatTime(session.last_activity_at)}</span>
                        {session.status !== 'idle' && (
                          <StatusBadge $status={session.status}>
                            {session.status.replace('_', ' ')}
                          </StatusBadge>
                        )}
                      </SessionMeta>
                    </SessionContent>
                    <div style={{ position: "relative" }} onClick={(e) => e.stopPropagation()}>
                      <DeleteButton
                        onClick={(e) => handleDeleteSession(e, session.id)}
                      >
                        <Trash2 size={16} />
                      </DeleteButton>
                      {sessionToDelete === session.id && (
                        <ConfirmationPopover
                          title="Delete this conversation?"
                          onConfirm={confirmDelete}
                          onCancel={() => setSessionToDelete(null)}
                        />
                      )}
                    </div>
                  </SessionItem>
                ))}
              </SessionGroup>
            ))
          )}
        </SessionsList>
      </Container>
    </DefaultStylesProvider>
  );
}