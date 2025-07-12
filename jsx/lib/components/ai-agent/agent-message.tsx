import React from "react";
import styled from "styled-components";
import { Bot, User, AlertCircle, Info, Wrench, Workflow, Zap, Code } from "lucide-react";
import type { AgentMessage as AgentMessageType } from "../../hooks/use-ai-agent";
import { MESSAGE_TYPES } from "../../constants/ai-agent";

const MessageContainer = styled.div`
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

const Avatar = styled.div<{ $type: string }>`
  width: 36px;
  height: 36px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  background: ${props => getAvatarBackground(props.$type, props.theme)};
  color: ${props => getAvatarColor(props.$type, props.theme)};
`;

const Content = styled.div`
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 8px;
`;

const Header = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 13px;
  color: ${props => props.theme?.mutedText || "#6b7280"};
`;

const MessageBubble = styled.div<{ $type: string }>`
  padding: 12px 16px;
  border-radius: 12px;
  font-size: 14px;
  line-height: 1.5;
  white-space: pre-wrap;
  word-break: break-word;
  background: ${props => getMessageBackground(props.$type, props.theme)};
  color: ${props => getMessageColor(props.$type, props.theme)};
  border: 1px solid ${props => getMessageBorder(props.$type, props.theme)};
`;

const MetadataContainer = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-top: 4px;
`;

const MetadataBadge = styled.div<{ $type: string }>`
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 4px 8px;
  border-radius: 6px;
  font-size: 12px;
  background: ${props => getBadgeBackground(props.$type, props.theme)};
  color: ${props => getBadgeColor(props.$type, props.theme)};
`;

const Timestamp = styled.time`
  font-size: 11px;
  color: ${props => props.theme?.timestampColor || "#9ca3af"};
`;

// Style helper functions
function getAvatarBackground(type: string, theme: any) {
  const styles = {
    [MESSAGE_TYPES.USER]: theme?.userAvatarBg || "#e0e7ff",
    [MESSAGE_TYPES.AGENT]: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
    [MESSAGE_TYPES.SYSTEM]: theme?.systemAvatarBg || "#f3f4f6",
    [MESSAGE_TYPES.ERROR]: "#fee",
  };
  return styles[type] || "#f3f4f6";
}

function getAvatarColor(type: string, theme: any) {
  const styles = {
    [MESSAGE_TYPES.USER]: theme?.userAvatarColor || "#4c1d95",
    [MESSAGE_TYPES.AGENT]: "white",
    [MESSAGE_TYPES.SYSTEM]: theme?.systemAvatarColor || "#6b7280",
    [MESSAGE_TYPES.ERROR]: "#c33",
  };
  return styles[type] || "#6b7280";
}

function getMessageBackground(type: string, theme: any) {
  const styles = {
    [MESSAGE_TYPES.USER]: theme?.userMessageBg || "#e0e7ff",
    [MESSAGE_TYPES.AGENT]: theme?.agentMessageBg || "#f3f4f6",
    [MESSAGE_TYPES.SYSTEM]: theme?.systemMessageBg || "#fef3c7",
    [MESSAGE_TYPES.ERROR]: "#fee",
  };
  return styles[type] || "#f3f4f6";
}

function getMessageColor(type: string, theme: any) {
  const styles = {
    [MESSAGE_TYPES.USER]: theme?.userMessageColor || "#1e1b4b",
    [MESSAGE_TYPES.AGENT]: theme?.agentMessageColor || "#111827",
    [MESSAGE_TYPES.SYSTEM]: theme?.systemMessageColor || "#78350f",
    [MESSAGE_TYPES.ERROR]: "#c33",
  };
  return styles[type] || "#111827";
}

function getMessageBorder(type: string, theme: any) {
  const styles = {
    [MESSAGE_TYPES.USER]: theme?.userMessageBorder || "#c7d2fe",
    [MESSAGE_TYPES.AGENT]: theme?.agentMessageBorder || "#e5e7eb",
    [MESSAGE_TYPES.SYSTEM]: theme?.systemMessageBorder || "#fde68a",
    [MESSAGE_TYPES.ERROR]: "#fcc",
  };
  return styles[type] || "#e5e7eb";
}

function getBadgeBackground(type: string, theme: any) {
  const styles = {
    task: theme?.taskBadgeBg || "#dbeafe",
    tool: theme?.toolBadgeBg || "#e0e7ff",
    workflow: theme?.workflowBadgeBg || "#d1fae5",
    platformEvent: theme?.platformEventBadgeBg || "#fef3c7",
    platformFunction: theme?.platformFunctionBadgeBg || "#fce7f3",
  };
  return styles[type] || "#f3f4f6";
}

function getBadgeColor(type: string, theme: any) {
  const styles = {
    task: theme?.taskBadgeColor || "#1e40af",
    tool: theme?.toolBadgeColor || "#4c1d95",
    workflow: theme?.workflowBadgeColor || "#065f46",
    platformEvent: theme?.platformEventBadgeColor || "#92400e",
    platformFunction: theme?.platformFunctionBadgeColor || "#9f1239",
  };
  return styles[type] || "#374151";
}

// Icon mapping
const MESSAGE_ICONS = {
  [MESSAGE_TYPES.USER]: User,
  [MESSAGE_TYPES.AGENT]: Bot,
  [MESSAGE_TYPES.SYSTEM]: Info,
  [MESSAGE_TYPES.ERROR]: AlertCircle,
};

// Label mapping
const MESSAGE_LABELS = {
  [MESSAGE_TYPES.USER]: "You",
  [MESSAGE_TYPES.AGENT]: "AI Agent",
  [MESSAGE_TYPES.SYSTEM]: "System",
  [MESSAGE_TYPES.ERROR]: "Error",
};

export interface AgentMessageProps {
  message: AgentMessageType;
  theme?: any;
}

export function AgentMessage({ message, theme }: AgentMessageProps) {
  const Icon = MESSAGE_ICONS[message.type] || Info;
  const label = MESSAGE_LABELS[message.type] || "";

  const formatTime = (date: Date) => {
    return new Intl.DateTimeFormat("en-US", {
      hour: "numeric",
      minute: "numeric",
      hour12: true,
    }).format(date);
  };

  return (
    <MessageContainer>
      <Avatar $type={message.type} theme={theme}>
        <Icon size={20} />
      </Avatar>
      
      <Content>
        <Header>
          <span>{label}</span>
          <Timestamp>{formatTime(message.timestamp)}</Timestamp>
        </Header>
        
        <MessageBubble $type={message.type} theme={theme}>
          {message.content}
        </MessageBubble>
        
        {message.metadata && (
          <MetadataContainer>
            {message.metadata.taskUpdate && (
              <MetadataBadge $type="task" theme={theme}>
                Tasks: {message.metadata.taskUpdate.completedTasks}/{message.metadata.taskUpdate.taskCount}
              </MetadataBadge>
            )}
            
            {message.metadata.toolExecution && (
              <MetadataBadge $type="tool" theme={theme}>
                <Wrench size={12} />
                {message.metadata.toolExecution.name}
              </MetadataBadge>
            )}
            
            {message.metadata.workflowExecution && (
              <MetadataBadge $type="workflow" theme={theme}>
                <Workflow size={12} />
                {message.metadata.workflowExecution.stage}
              </MetadataBadge>
            )}
            
            {message.metadata.platformEvent && (
              <MetadataBadge $type="platformEvent" theme={theme}>
                <Zap size={12} />
                Event: {message.metadata.platformEvent.label}
              </MetadataBadge>
            )}
            
            {message.metadata.platformFunction && (
              <MetadataBadge $type="platformFunction" theme={theme}>
                <Code size={12} />
                Function: {message.metadata.platformFunction.name}
              </MetadataBadge>
            )}
          </MetadataContainer>
        )}
      </Content>
    </MessageContainer>
  );
}