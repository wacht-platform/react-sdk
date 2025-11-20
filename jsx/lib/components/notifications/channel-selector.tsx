import styled from "styled-components";
import { ChannelCounts } from "@/types/notification";

const Container = styled.div`
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
  margin-bottom: 12px;
`;

const ChannelButton = styled.button<{ $active: boolean }>`
  padding: 4px 8px;
  border-radius: 12px;
  border: 1px solid var(--color-border);
  background: ${props => props.$active ? 'var(--color-primary)' : 'var(--color-background)'};
  color: ${props => props.$active ? 'var(--color-primary-foreground)' : 'var(--color-text)'};
  font-size: 12px;
  cursor: pointer;
  transition: all 0.2s ease;
  display: flex;
  align-items: center;
  gap: 4px;

  &:hover {
    background: ${props => props.$active ? 'var(--color-primary)' : 'var(--color-background-hover)'};
  }
`;

const CountBadge = styled.span`
  background: var(--color-background);
  color: var(--color-text);
  padding: 1px 4px;
  border-radius: 8px;
  font-size: 10px;
  font-weight: 400;
`;

interface ChannelSelectorProps {
  selectedChannels: string[];
  channelCounts?: ChannelCounts;
  onChannelsChange: (channels: string[]) => void;
}

const CHANNEL_LABELS = {
  user: "Personal",
  organization: "Organization",
  workspace: "Workspace",
  current: "Current Context"
};

export function ChannelSelector({ selectedChannels, channelCounts, onChannelsChange }: ChannelSelectorProps) {
  const toggleChannel = (channel: string) => {
    const isSelected = selectedChannels.includes(channel);

    if (isSelected) {
      // Remove channel
      const newChannels = selectedChannels.filter(c => c !== channel);
      if (newChannels.length === 0) {
        // Don't allow removing all channels, default to user
        onChannelsChange(["user"]);
      } else {
        onChannelsChange(newChannels);
      }
    } else {
      // Add channel
      onChannelsChange([...selectedChannels, channel]);
    }
  };

  return (
    <Container>
      {Object.entries(CHANNEL_LABELS).map(([channel, label]) => {
        const count = channelCounts?.[channel as keyof ChannelCounts] || 0;
        const isSelected = selectedChannels.includes(channel);

        return (
          <ChannelButton
            key={channel}
            $active={isSelected}
            onClick={() => toggleChannel(channel)}
          >
            {label}
            {count > 0 && <CountBadge>{count}</CountBadge>}
          </ChannelButton>
        );
      })}
    </Container>
  );
}