import React, { useState, useRef, useEffect } from "react";
import styled from "styled-components";
import { Send, Bot, Loader2 } from "lucide-react";
import { useAIAgent } from "../../hooks/use-ai-agent";
import { AgentMessage } from "./agent-message";
import { AgentTypingIndicator } from "./agent-typing-indicator";
import { CONNECTION_STATES } from "../../constants/ai-agent";
import { DefaultStylesProvider } from "../utility/root";

const ChatContainer = styled.div`
  display: flex;
  flex-direction: column;
  height: 100%;
  max-height: 600px;
  background: var(--color-background, #ffffff);
  border-radius: var(--radius-lg, 12px);
  box-shadow: 0 4px 12px var(--color-shadow, rgba(0, 0, 0, 0.08));
  overflow: hidden;
  border: 1px solid var(--color-border, #e5e7eb);
`;

const ChatHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 16px;
  background: var(--color-background, #ffffff);
  border-bottom: 1px solid var(--color-border, #e5e7eb);
`;

const AgentInfo = styled.div`
  display: flex;
  align-items: center;
  gap: 10px;
`;

const AgentAvatar = styled.div`
  width: 32px;
  height: 32px;
  border-radius: 50%;
  background: linear-gradient(135deg, var(--color-primary, #6366f1) 0%, #8b5cf6 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
`;

const AgentDetails = styled.div`
  display: flex;
  flex-direction: column;
`;

const AgentName = styled.h3`
  margin: 0;
  font-size: var(--font-md, 16px);
  font-weight: 600;
  color: var(--color-foreground, #111827);
  letter-spacing: -0.01em;
`;

const ConnectionIndicator = styled.div<{ $status: string }>`
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background-color: ${props => {
    switch(props.$status) {
      case 'connected': return '#10b981';
      case 'connecting': return '#f59e0b';
      case 'error': return '#ef4444';
      default: return '#6b7280';
    }
  }};
  animation: ${props => props.$status === 'connecting' ? 'pulse 1.5s ease-in-out infinite' : 'none'};
  
  @keyframes pulse {
    0%, 100% { 
      opacity: 1;
      transform: scale(1);
    }
    50% { 
      opacity: 0.5;
      transform: scale(0.8);
    }
  }
`;

const ConnectionStatus = styled.div`
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 10px;
  color: #6b7280;
  cursor: help;
`;

const MessagesContainer = styled.div`
  flex: 1;
  overflow-y: auto;
  padding: 12px 16px;
  display: flex;
  flex-direction: column;
  gap: 12px;
  scroll-behavior: smooth;
  background: var(--color-background, #ffffff);
  
  &::-webkit-scrollbar {
    width: 4px;
  }
  
  &::-webkit-scrollbar-track {
    background: transparent;
  }
  
  &::-webkit-scrollbar-thumb {
    background: var(--color-scrollbar-thumb, #d1d5db);
    border-radius: 2px;
  }
`;

const EmptyState = styled.div`
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  text-align: center;
  color: var(--color-secondary-text, #6b7280);
  gap: 8px;
  
  p {
    margin: 0;
    font-size: 13px;
    line-height: 1.4;
  }
`;

const InputForm = styled.form`
  display: flex;
  gap: 8px;
  padding: 12px 16px;
  background: var(--color-background, #ffffff);
  border-top: 1px solid var(--color-border, #e5e7eb);
`;

const MessageInput = styled.input`
  flex: 1;
  padding: 8px 12px;
  border: 1px solid var(--color-input-border, #e2e8f0);
  border-radius: 6px;
  font-size: 13px;
  background: var(--color-input-background, #ffffff);
  color: var(--color-foreground, #111827);
  outline: none;
  transition: border-color 0.2s;
  height: 36px;

  &:focus {
    border-color: var(--color-input-focus-border, #a5b4fc);
  }

  &::placeholder {
    color: var(--color-muted, #64748b);
  }
  
  &:disabled {
    background: var(--color-background-hover, #f8fafb);
    cursor: not-allowed;
    opacity: 0.6;
  }
`;

const SendButton = styled.button<{ $disabled: boolean }>`
  padding: 0 16px;
  border: none;
  border-radius: 6px;
  background: ${props => props.$disabled 
    ? "var(--color-border, #e5e7eb)"
    : "var(--color-primary, #6366f1)"};
  color: white;
  font-weight: 500;
  font-size: 13px;
  cursor: ${props => props.$disabled ? "not-allowed" : "pointer"};
  display: flex;
  align-items: center;
  gap: 6px;
  transition: all 0.2s;
  height: 36px;
  min-width: 72px;
  justify-content: center;

  &:hover:not(:disabled) {
    background: var(--color-primary-hover, #4f46e5);
  }

  &:active:not(:disabled) {
    transform: scale(0.98);
  }
`;

export interface AIAgentChatProps {
  contextId: string;
  agentName: string;
  placeholder?: string;
  emptyStateMessage?: string;
  className?: string;
  theme?: any;
}

export function AIAgentChat({
  contextId,
  agentName,
  placeholder = "Type your message...",
  emptyStateMessage = "Start a conversation with the AI agent",
  className,
  theme,
}: AIAgentChatProps) {
  const [inputValue, setInputValue] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  const {
    messages,
    connectionState,
    isAgentTyping,
    sendMessage,
  } = useAIAgent({
    contextId,
    agentName,
  });

  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isAgentTyping]);

  // Form submission handler
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedInput = inputValue.trim();
    
    if (!trimmedInput) return;
    if (connectionState.status !== CONNECTION_STATES.CONNECTED) return;
    
    sendMessage(trimmedInput);
    setInputValue("");
  };

  // Connection status helpers
  const isConnected = connectionState.status === CONNECTION_STATES.CONNECTED;
  const isConnecting = connectionState.status === CONNECTION_STATES.CONNECTING;
  const canSend = isConnected && inputValue.trim().length > 0;
  
  // Show status indicator only when not connected
  const showStatusIndicator = connectionState.status !== CONNECTION_STATES.CONNECTED;

  return (
    <DefaultStylesProvider>
      <ChatContainer className={className} theme={theme}>
        {/* Header */}
        <ChatHeader>
        <AgentInfo>
          <AgentAvatar>
            <Bot size={18} />
          </AgentAvatar>
          <AgentDetails>
            <AgentName>{agentName}</AgentName>
            {showStatusIndicator && (
              <ConnectionStatus 
                title={
                  connectionState.status === CONNECTION_STATES.CONNECTING ? "Establishing connection to agent..." :
                  connectionState.status === CONNECTION_STATES.ERROR ? `Connection error: ${connectionState.error || 'Unknown error'}` :
                  "Agent is offline"
                }
              >
                <ConnectionIndicator $status={connectionState.status} />
                {connectionState.status === CONNECTION_STATES.CONNECTING && "Connecting"}
                {connectionState.status === CONNECTION_STATES.ERROR && "Error"}
                {connectionState.status === CONNECTION_STATES.DISCONNECTED && "Offline"}
              </ConnectionStatus>
            )}
          </AgentDetails>
        </AgentInfo>
      </ChatHeader>

      {/* Messages */}
      <MessagesContainer>
        {messages.length === 0 ? (
          <EmptyState>
            <Bot size={32} strokeWidth={1.5} />
            <p>{emptyStateMessage}</p>
          </EmptyState>
        ) : (
          <>
            {messages.map(message => (
              <AgentMessage 
                key={message.id} 
                message={message} 
                theme={theme} 
              />
            ))}
            {isAgentTyping && <AgentTypingIndicator theme={theme} />}
          </>
        )}
        <div ref={messagesEndRef} />
      </MessagesContainer>

      {/* Input */}
      <InputForm onSubmit={handleSubmit}>
        <MessageInput
          type="text"
          value={inputValue}
          onChange={e => setInputValue(e.target.value)}
          placeholder={placeholder}
          disabled={!isConnected}
          theme={theme}
        />
        <SendButton 
          type="submit" 
          $disabled={!canSend} 
          theme={theme}
        >
          {isConnecting ? (
            <Loader2 size={18} className="animate-spin" />
          ) : (
            <Send size={16} />
          )}
          Send
        </SendButton>
      </InputForm>
    </ChatContainer>
    </DefaultStylesProvider>
  );
}