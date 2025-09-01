import React, { useState, useRef, useEffect } from "react";
import styled from "styled-components";
import { Send, Bot, Loader2, Paperclip, X } from "lucide-react";
import { useAgentConversation } from "../../hooks/use-agent-conversation";
import { UserInputRequest, ImageData } from "../../hooks/use-agent-conversation";
import { CONNECTION_STATES } from "../../constants/ai-agent";
import { FRONTEND_STATUS } from "../../constants/execution-status";
import { DefaultStylesProvider } from "../utility/root";

const ChatContainer = styled.div`
  display: flex;
  flex-direction: column;
  width: 100%;
  height: 100%;
  background: var(--color-background);
  overflow: hidden;
`;

const ChatHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px 20px;
  background: var(--color-background);
  border-bottom: 1px solid var(--color-border-subtle);
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
  background: var(--color-primary-gradient);
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
    if (props.$status === "Connecting...") return "var(--color-warning)";
    if (
      props.$status === "Connection error" ||
      props.$status === "Disconnected"
    )
      return "var(--color-error)";
    if (props.$status === "Waiting for your input...") return "var(--color-info)";
    if (props.$status === "Working...") return "var(--color-primary)";
    if (props.$status === "Ready") return "var(--color-success)";
    return "var(--color-secondary-text)";
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
  color: var(--color-foreground);
  letter-spacing: -0.01em;
`;

const StatusText = styled.p<{ $status?: string }>`
  margin: 0;
  font-size: 11px;
  color: ${(props) => {
    if (props.$status === "Connecting...") return "var(--color-warning)";
    if (
      props.$status === "Connection error" ||
      props.$status === "Disconnected"
    )
      return "var(--color-error)";
    if (props.$status === "Waiting for your input...") return "var(--color-info)";
    if (props.$status === "Working...") return "var(--color-primary)";
    if (props.$status === "Ready") return "var(--color-success)";
    return "var(--color-secondary-text)";
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
          background-color: var(--color-warning-background);
          color: var(--color-warning-text);
        `;
      case "running":
        return `
          background-color: var(--color-info-background);
          color: var(--color-info-text);
        `;
      case "completed":
        return `
          background-color: var(--color-success-background);
          color: var(--color-success-text);
        `;
      case "failed":
        return `
          background-color: var(--color-error-background);
          color: var(--color-error-text);
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
    background: var(--color-border);
    border-radius: 3px;

    &:hover {
      background: var(--color-border-hover);
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
    background: var(--color-primary);
    color: white;
    margin-left: auto;
    font-weight: 400;
  `
      : `
    background: var(--color-background-subtle);
    color: var(--color-foreground);
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
  display: inline-block;
  padding-right: 36px; /* Make room for spinner */
  
  &::after {
    content: "";
    position: absolute;
    bottom: 50%;
    right: 12px;
    transform: translateY(50%);
    width: 16px;
    height: 16px;
    border: 2px solid var(--color-primary-muted);
    border-top-color: var(--color-primary);
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
    background: var(--color-border);
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
      background: var(--color-border);
    }
  `}

  .log-content {
    font-size: 11px;
    color: var(--color-secondary-text);
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
  color: var(--color-secondary-text);
  gap: 12px;

  p {
    margin: 0;
    font-size: 13px;
  }
`;

const UserInputRequestContainer = styled.div`
  background: var(--color-primary-background);
  border: 1px solid var(--color-primary-border);
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
    color: var(--color-foreground);
    margin-bottom: 6px;
    line-height: 1.4;
  }

  .context {
    font-size: 12px;
    color: var(--color-secondary-text);
    margin-bottom: 10px;
    line-height: 1.4;
  }

  .instruction {
    font-size: 11px;
    color: var(--color-primary);
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
    border: 1px solid var(--color-border);
    background: var(--color-background);
    font-size: 12px;
    font-family: inherit;
    transition: border-color 0.15s;

    &:focus:not(:disabled) {
      outline: none;
      border-color: var(--color-primary);
    }

    &:disabled {
      background: var(--color-background-disabled);
      color: var(--color-text-disabled);
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
    color: var(--color-foreground);

    input {
      margin-right: 8px;
      cursor: pointer;

      &:disabled {
        cursor: not-allowed;
        opacity: 0.5;
      }
    }

    &:hover:not(:has(input:disabled)) {
      color: var(--color-foreground);
    }

    &:has(input:disabled) {
      cursor: not-allowed;
      color: var(--color-text-disabled);
    }
  }

  .radio-group {
    flex-direction: row;
    gap: 20px;
  }
`;

const InputForm = styled.form`
  padding: 20px;
  background: var(--color-background);
  border-top: 1px solid var(--color-border);
  flex-shrink: 0;
`;

const InputContainer = styled.div`
  position: relative;
  display: flex;
  align-items: flex-end;
  background: var(--color-background-subtle);
  border: 1px solid var(--color-border);
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
  color: var(--color-foreground);
  outline: none;
  resize: none;
  font-family: inherit;
  min-height: 24px;
  max-height: 200px;

  &::placeholder {
    color: var(--color-placeholder);
  }

  &:disabled {
    color: var(--color-text-disabled);
    cursor: not-allowed;
  }
`;

const ActionButtons = styled.div`
  display: flex;
  gap: 8px;
  margin-top: 4px;
`;

const ImagePreviewContainer = styled.div`
  display: flex;
  gap: 8px;
  padding: 8px 20px;
  border-top: 1px solid var(--color-border-subtle);
  background: var(--color-background);
  overflow-x: auto;
  max-height: 120px;
`;

const ImagePreview = styled.div`
  position: relative;
  width: 80px;
  height: 80px;
  border-radius: 8px;
  overflow: hidden;
  border: 1px solid var(--color-border);
  flex-shrink: 0;
  
  img {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }
`;

const RemoveImageButton = styled.button`
  position: absolute;
  top: 4px;
  right: 4px;
  width: 20px;
  height: 20px;
  border-radius: 50%;
  background: rgba(0, 0, 0, 0.7);
  color: white;
  border: none;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  
  &:hover {
    background: rgba(0, 0, 0, 0.9);
  }
`;

const HiddenFileInput = styled.input`
  display: none;
`;

const ActionButton = styled.button`
  padding: 4px 10px;
  border: 1px solid var(--color-border);
  border-radius: 8px;
  background: transparent;
  color: var(--color-foreground);
  font-size: 12px;
  font-weight: 400;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 4px;
  transition: all 0.2s ease;
  white-space: nowrap;

  &:hover {
    background: var(--color-background-hover);
    border-color: var(--color-border-hover);
  }

  &:disabled {
    color: var(--color-text-disabled);
    border-color: var(--color-border);
    cursor: not-allowed;
  }
`;

const SendButton = styled.button`
  align-self: flex-end;
  padding: 6px;
  border: none;
  border-radius: 6px;
  background: var(--color-secondary);
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
    background: var(--color-secondary-hover);
  }

  &:disabled {
    background: var(--color-background-disabled);
    color: var(--color-text-disabled);
    cursor: not-allowed;
  }
`;

export interface AgentConversationProps {
  contextId: string;
  agentName: string;
  onTokenNeeded: () => Promise<string>;
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
  onTokenNeeded,
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
  const [uploadedImages, setUploadedImages] = useState<ImageData[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const {
    messages,
    pendingMessage,
    pendingImages,
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
    onTokenNeeded,
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
      sendMessage(input, uploadedImages.length > 0 ? uploadedImages : undefined);
      setInput("");
      setUploadedImages([]); // Clear immediately after sending
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    Array.from(files).forEach(file => {
      if (file.type.startsWith('image/')) {
        const reader = new FileReader();
        reader.onload = (event) => {
          if (event.target?.result) {
            const base64 = event.target.result as string;
            const base64Data = base64.split(',')[1]; // Remove data:image/jpeg;base64, prefix
            setUploadedImages(prev => [...prev, {
              mime_type: file.type,
              data: base64Data
            }]);
          }
        };
        reader.readAsDataURL(file);
      }
    });
    
    // Reset file input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const removeImage = (index: number) => {
    setUploadedImages(prev => prev.filter((_, i) => i !== index));
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
          {executionStatus !== FRONTEND_STATUS.IDLE && (
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
                      <div>{message.content}</div>
                      {message.images && message.images.length > 0 && (
                        <div style={{ display: 'flex', gap: '8px', marginTop: '8px', flexWrap: 'wrap' }}>
                          {message.images.map((img, imgIndex) => (
                            <img
                              key={imgIndex}
                              src={img.url || `data:${img.mime_type};base64,${img.data}`}
                              alt={`Image ${imgIndex + 1}`}
                              style={{
                                maxWidth: '200px',
                                maxHeight: '200px',
                                borderRadius: '8px',
                                border: '1px solid var(--color-border)'
                              }}
                            />
                          ))}
                        </div>
                      )}
                      {message.isStreaming && <StreamingIndicator />}
                    </Message>
                  </MessageWrapper>
                );
              })}
              
              {/* Show pending message at the bottom */}
              {pendingMessage && (
                <MessageWrapper $isUser={true}>
                  <PendingMessage $isUser={true}>
                    <div>{pendingMessage}</div>
                    {pendingImages && pendingImages.length > 0 && (
                      <div style={{ display: 'flex', gap: '8px', marginTop: '8px', flexWrap: 'wrap' }}>
                        {pendingImages.map((img, imgIndex) => (
                          <img
                            key={imgIndex}
                            src={img.data ? `data:${img.mime_type};base64,${img.data}` : '#'}
                            alt={`Image ${imgIndex + 1}`}
                            style={{
                              maxWidth: '200px',
                              maxHeight: '200px',
                              borderRadius: '8px',
                              border: '1px solid var(--color-border)'
                            }}
                          />
                        ))}
                      </div>
                    )}
                  </PendingMessage>
                </MessageWrapper>
              )}
              
              <div ref={messagesEndRef} />
            </>
          )}
        </MessagesContainer>

        {uploadedImages.length > 0 && (
          <ImagePreviewContainer>
            {uploadedImages.map((img, index) => (
              <ImagePreview key={index}>
                <img 
                  src={img.data ? `data:${img.mime_type};base64,${img.data}` : '#'} 
                  alt={`Upload ${index + 1}`}
                />
                <RemoveImageButton 
                  type="button"
                  onClick={() => removeImage(index)}
                >
                  <X size={12} />
                </RemoveImageButton>
              </ImagePreview>
            ))}
          </ImagePreviewContainer>
        )}

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
                  onClick={() => fileInputRef.current?.click()}
                >
                  <Paperclip size={16} />
                  Attach
                </ActionButton>
                {/* Audio recording - commented out for now
                <ActionButton
                  type="button"
                  disabled={!isConnected || isExecuting}
                >
                  <Mic size={16} />
                  Record
                </ActionButton>
                */}
              </ActionButtons>
              <HiddenFileInput
                ref={fileInputRef}
                type="file"
                accept="image/*"
                multiple
                onChange={handleFileSelect}
              />
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
                    ? "var(--color-error)"
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
