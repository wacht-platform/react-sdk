import styled, { keyframes } from "styled-components";
import { Bot } from "lucide-react";

const bounce = keyframes`
  0%, 80%, 100% {
    transform: scale(1);
    opacity: 0.5;
  }
  40% {
    transform: scale(1.3);
    opacity: 1;
  }
`;

const TypingContainer = styled.div`
  display: flex;
  gap: 12px;
  align-items: flex-start;
  animation: fadeIn 0.3s ease-in;

  @keyframes fadeIn {
    from {
      opacity: 0;
      transform: translateY(10px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }
`;

const AvatarContainer = styled.div`
  width: 36px;
  height: 36px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
`;

const TypingBubble = styled.div`
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 12px 16px;
  border-radius: 12px;
  background: #f3f4f6;
  border: 1px solid #e5e7eb;
`;

const Dot = styled.div<{ delay: number }>`
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: #6b7280;
  animation: ${bounce} 1.4s infinite ease-in-out;
  animation-delay: ${(props) => props.delay}s;
`;

const TypingLabel = styled.span`
  font-size: 13px;
  color: #6b7280;
  margin-right: 8px;
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
        <Bot size={20} />
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
