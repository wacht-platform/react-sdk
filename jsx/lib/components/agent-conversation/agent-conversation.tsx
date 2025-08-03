import React, { useState, useRef, useEffect } from "react";
import styled from "styled-components";
import { Send, Bot, Loader2, Paperclip, Mic, X } from "lucide-react";
import { useAgentConversation } from "../../hooks/use-agent-conversation";
import { UserInputRequest } from "../../hooks/use-agent-conversation";
import { CONNECTION_STATES } from "../../constants/ai-agent";
import { DefaultStylesProvider } from "../utility/root";

const ChatContainer = styled.div`
  display: flex;
  flex-direction: column;
  width: 100%;
  height: 100%;
  background: #ffffff;
  overflow: hidden;
`;

const ChatHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px 20px;
  background: #ffffff;
  border-bottom: 1px solid #f3f4f6;
  flex-shrink: 0;
`;

const AgentInfo = styled.div`
  display: flex;
  align-items: center;
  gap: 10px;
`;

const AgentAvatar = styled.div`
  width: 36px;
  height: 36px;
  border-radius: 50%;
  background: linear-gradient(135deg, #5b47e0 0%, #8b5cf6 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
`;

const AgentDetails = styled.div`
  display: flex;
  flex-direction: column;
`;

const StatusIndicator = styled.div<{ $status: string }>`
  width: 6px;
  height: 6px;
  border-radius: 50%;
  margin-right: 6px;
  flex-shrink: 0;
  background-color: ${(props) => {
    if (props.$status === "Connecting...") return "#f59e0b";
    if (
      props.$status === "Connection error" ||
      props.$status === "Disconnected"
    )
      return "#ef4444";
    if (props.$status === "Waiting for your input...") return "#3b82f6";
    if (props.$status === "Working...") return "#8b5cf6";
    if (props.$status === "Ready") return "#10b981";
    return "#6b7280";
  }};
  ${(props) =>
    props.$status === "Working..." &&
    `
    animation: pulse 1.5s ease-in-out infinite;
    @keyframes pulse {
      0%, 100% { opacity: 1; }
      50% { opacity: 0.5; }
    }
  `}
`;

const AgentName = styled.h3`
  margin: 0;
  font-size: 14px;
  font-weight: 600;
  color: #111827;
  letter-spacing: -0.01em;
`;

const StatusText = styled.p<{ $status?: string }>`
  margin: 0;
  font-size: 11px;
  color: ${(props) => {
    if (props.$status === "Connecting...") return "#f59e0b";
    if (
      props.$status === "Connection error" ||
      props.$status === "Disconnected"
    )
      return "#ef4444";
    if (props.$status === "Waiting for your input...") return "#3b82f6";
    if (props.$status === "Working...") return "#8b5cf6";
    if (props.$status === "Ready") return "#10b981";
    return "#6b7280";
  }};
  font-weight: 400;
`;

const StatusBadge = styled.div<{ $status: string }>`
  font-size: 10px;
  padding: 2px 6px;
  border-radius: 9999px;
  font-weight: 500;

  ${(props) => {
    switch (props.$status) {
      case "waiting_for_input":
        return `
          background-color: #fef3c7;
          color: #92400e;
        `;
      case "running":
        return `
          background-color: #dbeafe;
          color: #1e40af;
        `;
      case "completed":
        return `
          background-color: #d1fae5;
          color: #065f46;
        `;
      case "failed":
        return `
          background-color: #fee2e2;
          color: #991b1b;
        `;
      default:
        return "display: none;";
    }
  }}
`;

const MessagesContainer = styled.div`
  flex: 1;
  overflow-y: auto;
  overflow-x: hidden;
  padding: 20px 16px;
  display: flex;
  flex-direction: column;
  gap: 8px;

  &::-webkit-scrollbar {
    width: 6px;
  }

  &::-webkit-scrollbar-track {
    background: transparent;
  }

  &::-webkit-scrollbar-thumb {
    background: #e5e7eb;
    border-radius: 3px;

    &:hover {
      background: #d1d5db;
    }
  }
`;

const MessageWrapper = styled.div<{ $isUser: boolean }>`
  display: flex;
  justify-content: ${(props) => (props.$isUser ? "flex-end" : "flex-start")};
`;

const Message = styled.div<{ $isUser: boolean }>`
  max-width: 85%;
  padding: 10px 14px;
  border-radius: 12px;
  font-size: 13px;
  line-height: 1.5;
  white-space: pre-wrap;
  word-wrap: break-word;
  word-break: break-word;
  overflow-wrap: break-word;
  hyphens: auto;

  ${(props) =>
    props.$isUser
      ? `
    background: #5b47e0;
    color: white;
    margin-left: auto;
    font-weight: 400;
  `
      : `
    background: #f3f4f6;
    color: #1e293b;
    margin-right: auto;
    font-weight: 400;
  `}
`;

const StreamingIndicator = styled.span`
  display: inline-flex;
  gap: 2px;
  margin-left: 8px;
  align-items: center;

  &::after {
    content: "";
    width: 2px;
    height: 2px;
    border-radius: 50%;
    background: currentColor;
    animation: pulse 1.5s ease-in-out infinite;
  }

  @keyframes pulse {
    0%,
    100% {
      opacity: 0.2;
    }
    50% {
      opacity: 1;
    }
  }
`;

const PendingMessage = styled(Message)`
  opacity: 0.7;
  position: relative;
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding-right: 36px; /* Make room for spinner */
  
  &::after {
    content: "";
    position: absolute;
    bottom: 50%;
    right: 12px;
    transform: translateY(50%);
    width: 16px;
    height: 16px;
    border: 2px solid rgba(255, 255, 255, 0.3);
    border-top-color: white;
    border-radius: 50%;
    animation: spin 1s linear infinite;
  }
  
  @keyframes spin {
    to {
      transform: rotate(360deg);
    }
  }
`;

const LogMessage = styled.div<{
  $isGrouped?: boolean;
  $isFirstInGroup?: boolean;
  $isLastInGroup?: boolean;
}>`
  display: flex;
  justify-content: flex-start;
  align-items: center;
  margin: ${(props) => (props.$isGrouped ? "0" : "12px 0")};
  padding-left: 0;
  position: relative;

  &::before {
    content: "";
    position: absolute;
    left: 8px;
    top: 50%;
    width: 6px;
    height: 6px;
    background: #e5e7eb;
    border-radius: 50%;
    transform: translateY(-50%);
  }

  ${(props) =>
    props.$isGrouped &&
    !props.$isFirstInGroup &&
    `
    &::after {
      content: '';
      position: absolute;
      left: 10.5px;
      top: -14px;
      width: 1px;
      height: 18px;
      background: #e5e7eb;
    }
  `}

  .log-content {
    font-size: 11px;
    color: #6b7280;
    background: transparent;
    padding: 2px 0 2px 24px;
    line-height: 1.4;
    text-align: left;
    word-wrap: break-word;
    word-break: break-word;
    overflow-wrap: break-word;
    max-width: calc(100% - 24px);
  }
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

  p {
    margin: 0;
    font-size: 13px;
  }
`;

const UserInputRequestContainer = styled.div`
  background: linear-gradient(to right, #f8f9ff 0%, #f3f4ff 100%);
  border: 1px solid #e5e7ff;
  border-radius: 8px;
  padding: 16px 20px;
  margin: 8px 0;
  width: 100%;
  word-wrap: break-word;
  word-break: break-word;
  overflow-wrap: break-word;

  .question {
    font-size: 13px;
    font-weight: 500;
    color: #1f2937;
    margin-bottom: 6px;
    line-height: 1.4;
  }

  .context {
    font-size: 12px;
    color: #6b7280;
    margin-bottom: 10px;
    line-height: 1.4;
  }

  .instruction {
    font-size: 11px;
    color: #6366f1;
    margin-top: 10px;
  }

  .controls {
    margin: 12px 0;
  }

  select,
  input[type="date"] {
    width: 100%;
    padding: 6px 10px;
    border-radius: 6px;
    border: 1px solid #e2e8f0;
    background: white;
    font-size: 12px;
    font-family: inherit;
    transition: border-color 0.15s;

    &:focus:not(:disabled) {
      outline: none;
      border-color: #6366f1;
    }

    &:disabled {
      background: #f9fafb;
      color: #9ca3af;
      cursor: not-allowed;
    }
  }

  .checkbox-group,
  .radio-group {
    display: flex;
    flex-direction: column;
    gap: 8px;
  }

  .checkbox-label,
  .radio-label {
    display: flex;
    align-items: center;
    cursor: pointer;
    font-size: 12px;
    color: #374151;

    input {
      margin-right: 8px;
      cursor: pointer;

      &:disabled {
        cursor: not-allowed;
        opacity: 0.5;
      }
    }

    &:hover:not(:has(input:disabled)) {
      color: #1f2937;
    }

    &:has(input:disabled) {
      cursor: not-allowed;
      color: #9ca3af;
    }
  }

  .radio-group {
    flex-direction: row;
    gap: 20px;
  }
`;

const InputForm = styled.form`
  padding: 20px;
  background: #ffffff;
  border-top: 1px solid #e5e7eb;
  flex-shrink: 0;
`;

const InputContainer = styled.div`
  position: relative;
  display: flex;
  align-items: flex-end;
  background: #f3f4f6;
  border: 1px solid #e5e7eb;
  border-radius: 12px;
  padding: 8px 8px 8px 20px;
  min-height: 56px;
`;

const InputWrapper = styled.div`
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding-right: 12px;
`;

const MessageInput = styled.textarea`
  width: 100%;
  padding: 0;
  border: none;
  background: transparent;
  font-size: 13px;
  line-height: 1.5;
  color: #111827;
  outline: none;
  resize: none;
  font-family: inherit;
  min-height: 24px;
  max-height: 200px;

  &::placeholder {
    color: #6b7280;
  }

  &:disabled {
    color: #9ca3af;
    cursor: not-allowed;
  }
`;

const ActionButtons = styled.div`
  display: flex;
  gap: 8px;
  margin-top: 4px;
`;

const ActionButton = styled.button`
  padding: 4px 10px;
  border: 1px solid #d1d5db;
  border-radius: 8px;
  background: transparent;
  color: #374151;
  font-size: 12px;
  font-weight: 400;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 4px;
  transition: all 0.2s ease;
  white-space: nowrap;

  &:hover {
    background: rgba(229, 231, 235, 0.5);
    border-color: #9ca3af;
  }

  &:disabled {
    color: #9ca3af;
    border-color: #e5e7eb;
    cursor: not-allowed;
  }
`;

const SendButton = styled.button`
  align-self: flex-end;
  padding: 6px;
  border: none;
  border-radius: 6px;
  background: #6b7280;
  color: white;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  transition: all 0.2s ease;
  flex-shrink: 0;

  &:hover:not(:disabled) {
    background: #4b5563;
  }

  &:disabled {
    background: #e5e7eb;
    color: #9ca3af;
    cursor: not-allowed;
  }
`;

export interface AgentConversationProps {
  contextId: string;
  agentName: string;
  platformAdapter?: {
    onPlatformEvent?: (eventName: string, eventData: unknown) => void;
    onPlatformFunction?: (
      functionName: string,
      parameters: unknown,
      executionId: string,
    ) => Promise<unknown>;
  };
  autoConnect?: boolean;
  showEmptyState?: boolean;
  emptyStateMessage?: string;
  theme?: any;
}

export function AgentConversation({
  contextId,
  agentName,
  platformAdapter,
  autoConnect = true,
  showEmptyState = true,
  emptyStateMessage = "Start a conversation by typing a message below",
  theme,
}: AgentConversationProps) {
  const [input, setInput] = useState("");
  const [isHoveringCancel, setIsHoveringCancel] = useState(false);
  const [activeInputRequest, setActiveInputRequest] =
    useState<UserInputRequest | null>(null);
  const [selectedOptions, setSelectedOptions] = useState<string[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const {
    messages,
    pendingMessage,
    connectionState,
    isConnected,
    isExecuting,
    executionStatus,
    isWaitingForInput,
    sendMessage,
    submitUserInput,
    cancelExecution,
  } = useAgentConversation({
    contextId,
    agentName,
    platformAdapter,
    autoConnect,
  });

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Track active input request
  useEffect(() => {
    if (isWaitingForInput) {
      // Find the most recent user input request
      const inputRequest = messages
        .slice()
        .reverse()
        .find((msg) => msg.metadata?.type === "user_input_request");

      if (inputRequest?.metadata?.userInputRequest) {
        setActiveInputRequest(inputRequest.metadata.userInputRequest);
      }
    } else {
      setActiveInputRequest(null);
      setSelectedOptions([]);
    }
  }, [isWaitingForInput, messages]);

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isConnected) return;

    // If waiting for input, submit based on input type
    if (isWaitingForInput && activeInputRequest) {
      let value = input.trim();

      // For multiselect, use selectedOptions
      if (activeInputRequest.input_type === "multiselect") {
        value = selectedOptions.join(",");
      }

      // Only proceed if we have a value
      if (value) {
        submitUserInput(value);
        setInput("");
        setSelectedOptions([]);
      }
    } else if (!isExecuting && input.trim()) {
      sendMessage(input);
      setInput("");
    }
  };

  const getStatusText = () => {
    if (connectionState.status === CONNECTION_STATES.CONNECTING)
      return "Connecting...";
    if (connectionState.status === CONNECTION_STATES.ERROR)
      return "Connection error";
    if (connectionState.status === CONNECTION_STATES.DISCONNECTED)
      return "Disconnected";
    if (!isConnected) return "Disconnected";
    if (isWaitingForInput) return "Waiting for your input...";
    if (isExecuting) return "Working...";
    return "Ready";
  };

  const getInputPlaceholder = () => {
    if (!isWaitingForInput || !activeInputRequest) return "Ask anything";

    switch (activeInputRequest.input_type) {
      case "select":
      case "boolean":
      case "date":
        return "Use controls above to make selection";
      case "multiselect":
        return "Select options above";
      default:
        return "Enter your response...";
    }
  };

  const shouldDisableTextInput = () => {
    if (!isWaitingForInput || !activeInputRequest) return false;

    const nonTextTypes = ["select", "multiselect", "boolean", "date"];
    return nonTextTypes.includes(activeInputRequest.input_type || "");
  };

  return (
    <DefaultStylesProvider theme={theme} style={{ height: "100%" }}>
      <ChatContainer>
        <ChatHeader>
          <AgentInfo>
            <AgentAvatar>
              <Bot size={20} />
            </AgentAvatar>
            <AgentDetails>
              <AgentName>{agentName}</AgentName>
              <div style={{ display: "flex", alignItems: "center" }}>
                <StatusIndicator $status={getStatusText()} />
                <StatusText $status={getStatusText()}>
                  {getStatusText()}
                </StatusText>
              </div>
            </AgentDetails>
          </AgentInfo>
          {executionStatus !== "idle" && (
            <StatusBadge $status={executionStatus}>
              {executionStatus.replace("_", " ")}
            </StatusBadge>
          )}
        </ChatHeader>

        <MessagesContainer>
          {messages.length === 0 && showEmptyState ? (
            <EmptyState>
              <Bot size={48} strokeWidth={1.5} />
              <p>{emptyStateMessage}</p>
            </EmptyState>
          ) : (
            <>
              {messages.map((message, index) => {
                // Render user input request as a special message
                if (
                  message.metadata?.type === "user_input_request" &&
                  message.metadata.userInputRequest
                ) {
                  const request = message.metadata.userInputRequest;
                  const isTextInput =
                    !request.input_type ||
                    request.input_type === "text" ||
                    request.input_type === "number";
                  const isActiveRequest =
                    isWaitingForInput &&
                    activeInputRequest?.input_type === request.input_type;

                  return (
                    <MessageWrapper key={message.id} $isUser={false}>
                      <UserInputRequestContainer>
                        <div className="question">{request.question}</div>
                        {request.context && request.context.trim() && (
                          <div className="context">{request.context}</div>
                        )}

                        {/* Show inline controls for non-text inputs */}
                        {!isTextInput && (
                          <div className="controls">
                            {request.input_type === "select" &&
                              request.options && (
                                <select
                                  value={isActiveRequest ? input : ""}
                                  onChange={(e) => setInput(e.target.value)}
                                  disabled={!isActiveRequest}
                                >
                                  <option value="">Choose an option...</option>
                                  {request.options.map((opt) => (
                                    <option key={opt} value={opt}>
                                      {opt}
                                    </option>
                                  ))}
                                </select>
                              )}

                            {request.input_type === "multiselect" &&
                              request.options && (
                                <div className="checkbox-group">
                                  {request.options.map((opt) => (
                                    <label key={opt} className="checkbox-label">
                                      <input
                                        type="checkbox"
                                        checked={
                                          isActiveRequest &&
                                          selectedOptions.includes(opt)
                                        }
                                        onChange={(e) => {
                                          if (e.target.checked) {
                                            setSelectedOptions([
                                              ...selectedOptions,
                                              opt,
                                            ]);
                                          } else {
                                            setSelectedOptions(
                                              selectedOptions.filter(
                                                (o) => o !== opt,
                                              ),
                                            );
                                          }
                                        }}
                                        disabled={!isActiveRequest}
                                      />
                                      <span>{opt}</span>
                                    </label>
                                  ))}
                                </div>
                              )}

                            {request.input_type === "boolean" && (
                              <div className="radio-group">
                                <label className="radio-label">
                                  <input
                                    type="radio"
                                    name="boolean"
                                    value="true"
                                    checked={
                                      isActiveRequest && input === "true"
                                    }
                                    onChange={(e) => setInput(e.target.value)}
                                    disabled={!isActiveRequest}
                                  />
                                  <span>Yes</span>
                                </label>
                                <label className="radio-label">
                                  <input
                                    type="radio"
                                    name="boolean"
                                    value="false"
                                    checked={
                                      isActiveRequest && input === "false"
                                    }
                                    onChange={(e) => setInput(e.target.value)}
                                    disabled={!isActiveRequest}
                                  />
                                  <span>No</span>
                                </label>
                              </div>
                            )}

                            {request.input_type === "date" && (
                              <input
                                type="date"
                                value={isActiveRequest ? input : ""}
                                onChange={(e) => setInput(e.target.value)}
                                disabled={!isActiveRequest}
                              />
                            )}
                          </div>
                        )}

                        {/* Show instruction based on input type */}
                        <div className="instruction">
                          {!isActiveRequest
                            ? ""
                            : isTextInput
                              ? "Type your response below"
                              : request.input_type === "multiselect"
                                ? "Select options above and click send"
                                : "Make your selection above and click send"}
                        </div>
                      </UserInputRequestContainer>
                    </MessageWrapper>
                  );
                }

                // Render log messages
                if (message.metadata?.type === "log") {
                  // Check if previous and next messages are also logs
                  const prevMessage = messages[index - 1];
                  const nextMessage = messages[index + 1];
                  const isPrevLog = prevMessage?.metadata?.type === "log";
                  const isNextLog = nextMessage?.metadata?.type === "log";

                  const isGrouped = isPrevLog || isNextLog;
                  const isFirstInGroup = !isPrevLog && isNextLog;
                  const isLastInGroup = isPrevLog && !isNextLog;

                  return (
                    <LogMessage
                      key={message.id}
                      $isGrouped={isGrouped}
                      $isFirstInGroup={isFirstInGroup}
                      $isLastInGroup={isLastInGroup}
                    >
                      <div className="log-content">{message.content}</div>
                    </LogMessage>
                  );
                }

                // Render regular messages - only if they have content
                if (!message.content) {
                  return null;
                }

                return (
                  <MessageWrapper
                    key={message.id}
                    $isUser={message.role === "user"}
                  >
                    <Message $isUser={message.role === "user"}>
                      {message.content}
                      {message.isStreaming && <StreamingIndicator />}
                    </Message>
                  </MessageWrapper>
                );
              })}
              
              {/* Show pending message at the bottom */}
              {pendingMessage && (
                <MessageWrapper $isUser={true}>
                  <PendingMessage $isUser={true}>
                    {pendingMessage}
                  </PendingMessage>
                </MessageWrapper>
              )}
              
              <div ref={messagesEndRef} />
            </>
          )}
        </MessagesContainer>

        <InputForm onSubmit={handleSend}>
          <InputContainer>
            <InputWrapper>
              <MessageInput
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleSend(e);
                  }
                }}
                placeholder={getInputPlaceholder()}
                disabled={
                  !isConnected ||
                  (isExecuting && !isWaitingForInput) ||
                  shouldDisableTextInput()
                }
                rows={1}
              />
              <ActionButtons>
                <ActionButton
                  type="button"
                  disabled={!isConnected || isExecuting}
                >
                  <Paperclip size={16} />
                  Attach
                </ActionButton>
                <ActionButton
                  type="button"
                  disabled={!isConnected || isExecuting}
                >
                  <Mic size={16} />
                  Record
                </ActionButton>
              </ActionButtons>
            </InputWrapper>
            <SendButton
              type={isExecuting ? "button" : "submit"}
              disabled={
                !isConnected ||
                (!isWaitingForInput && !isExecuting && !input.trim())
              }
              onClick={
                isExecuting ? cancelExecution : undefined
              }
              onMouseEnter={() => setIsHoveringCancel(true)}
              onMouseLeave={() => setIsHoveringCancel(false)}
              style={{
                background:
                  isExecuting && isHoveringCancel
                    ? "#ef4444"
                    : undefined,
              }}
            >
              {isExecuting ? (
                isHoveringCancel ? (
                  <X size={14} />
                ) : (
                  <Loader2 size={14} className="animate-spin" />
                )
              ) : (
                <Send size={14} />
              )}
            </SendButton>
          </InputContainer>
        </InputForm>
      </ChatContainer>
    </DefaultStylesProvider>
  );
}
