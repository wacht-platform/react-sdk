import styled, { keyframes } from "styled-components";
import { Bot } from "lucide-react";

const bounce = keyframes`
  0%, 80%, 100% {
    transform: scale(1);
    opacity: 0.4;
  }
  40% {
    transform: scale(1.2);
    opacity: 1;
  }
`;

const TypingContainer = styled.div`
  display: flex;
  gap: 8px;
  align-items: flex-start;
  animation: fadeIn 0.2s ease-out;

  @keyframes fadeIn {
    from {
      opacity: 0;
      transform: translateY(4px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }
`;

const AvatarContainer = styled.div`
  width: 24px;
  height: 24px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  background: linear-gradient(135deg, var(--color-primary, #6366f1) 0%, #8b5cf6 100%);
  color: white;
`;

const TypingBubble = styled.div`
  display: flex;
  align-items: center;
  gap: 3px;
  padding: 6px 10px;
  border-radius: 8px;
  background: var(--color-background-hover, #f8fafb);
  border: 1px solid var(--color-border, #e5e7eb);
  display: inline-flex;
`;

const Dot = styled.div<{ delay: number }>`
  width: 4px;
  height: 4px;
  border-radius: 50%;
  background: var(--color-muted, #64748b);
  animation: ${bounce} 1.4s infinite ease-in-out;
  animation-delay: ${(props) => props.delay}s;
`;

const TypingLabel = styled.span`
  font-size: 10px;
  color: var(--color-secondary-text, #6b7280);
  margin-right: 6px;
`;

export interface AgentTypingIndicatorProps {
  theme?: any;
  showLabel?: boolean;
}

export function AgentTypingIndicator({
  theme,
  showLabel = false,
}: AgentTypingIndicatorProps) {
  return (
    <TypingContainer>
      <AvatarContainer>
        <Bot size={12} strokeWidth={2} />
      </AvatarContainer>
      <TypingBubble theme={theme}>
        {showLabel && (
          <TypingLabel theme={theme}>AI Agent is thinking</TypingLabel>
        )}
        <Dot delay={0} theme={theme} />
        <Dot delay={0.2} theme={theme} />
        <Dot delay={0.4} theme={theme} />
      </TypingBubble>
    </TypingContainer>
  );
}
