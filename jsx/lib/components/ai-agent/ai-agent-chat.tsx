import React, { useState, useRef, useEffect } from "react";
import styled from "styled-components";
import { Send, Bot, Loader2, WifiOff, Wifi } from "lucide-react";
import { useAIAgent } from "../../hooks/use-ai-agent";
import { AgentMessage } from "./agent-message";
import { AgentTypingIndicator } from "./agent-typing-indicator";
import { CONNECTION_STATES } from "../../constants/ai-agent";

const ChatContainer = styled.div`
  display: flex;
  flex-direction: column;
  height: 100%;
  background: #ffffff;
  border-radius: 12px;
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
  overflow: hidden;
`;

const ChatHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px 20px;
  background: #f9fafb;
  border-bottom: 1px solid #e5e7eb;
`;

const AgentInfo = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
`;

const AgentAvatar = styled.div`
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
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
  font-size: 16px;
  font-weight: 600;
  color: #111827;
`;

const ConnectionStatus = styled.div<{ $connected: boolean }>`
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 12px;
  color: ${props => props.$connected ? "#10b981" : "#ef4444"};
`;

const MessagesContainer = styled.div`
  flex: 1;
  overflow-y: auto;
  padding: 20px;
  display: flex;
  flex-direction: column;
  gap: 16px;
  scroll-behavior: smooth;
`;

const EmptyState = styled.div`
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  text-align: center;
  color: #6b7280;
  gap: 12px;
`;

const InputForm = styled.form`
  display: flex;
  gap: 12px;
  padding: 16px 20px;
  background: #f9fafb;
  border-top: 1px solid #e5e7eb;
`;

const MessageInput = styled.input`
  flex: 1;
  padding: 12px 16px;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  font-size: 14px;
  background: #ffffff;
  color: #111827;
  outline: none;
  transition: border-color 0.2s;

  &:focus {
    border-color: #667eea;
  }

  &::placeholder {
    color: #9ca3af;
  }
`;

const SendButton = styled.button<{ $disabled: boolean }>`
  padding: 12px 16px;
  border: none;
  border-radius: 8px;
  background: ${props => props.$disabled 
    ? "#e5e7eb"
    : "#667eea"};
  color: white;
  font-weight: 500;
  cursor: ${props => props.$disabled ? "not-allowed" : "pointer"};
  display: flex;
  align-items: center;
  gap: 8px;
  transition: all 0.2s;

  &:hover:not(:disabled) {
    background: #5a67d8;
    transform: translateY(-1px);
  }

  &:active:not(:disabled) {
    transform: translateY(0);
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

  // Connection status text
  const getConnectionStatusText = () => {
    switch (connectionState.status) {
      case CONNECTION_STATES.CONNECTING:
        return "Connecting...";
      case CONNECTION_STATES.CONNECTED:
        return "Connected";
      default:
        return "Disconnected";
    }
  };

  return (
    <ChatContainer className={className} theme={theme}>
      {/* Header */}
      <ChatHeader>
        <AgentInfo>
          <AgentAvatar>
            <Bot size={24} />
          </AgentAvatar>
          <AgentDetails>
            <AgentName>{agentName}</AgentName>
            <ConnectionStatus $connected={isConnected}>
              {isConnected ? <Wifi size={12} /> : <WifiOff size={12} />}
              {getConnectionStatusText()}
            </ConnectionStatus>
          </AgentDetails>
        </AgentInfo>
      </ChatHeader>

      {/* Messages */}
      <MessagesContainer>
        {messages.length === 0 ? (
          <EmptyState>
            <Bot size={48} strokeWidth={1.5} />
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
            <Send size={18} />
          )}
          Send
        </SendButton>
      </InputForm>
    </ChatContainer>
  );
}