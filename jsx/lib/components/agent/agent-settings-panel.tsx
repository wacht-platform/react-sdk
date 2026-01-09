import { useState, useRef, useEffect } from "react";
import styled from "styled-components";
import { Settings, Check, Plug } from "lucide-react";
import { useAgentIntegrations } from "../../hooks/use-agent-integrations";

const PopoverContainer = styled.div`
  position: relative;
  display: inline-flex;
`;

const SettingsButton = styled.button`
  width: 32px;
  height: 32px;
  border: none;
  background: transparent;
  color: var(--color-secondary-text);
  cursor: pointer;
  border-radius: 6px;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s;

  &:hover {
    background: var(--color-background-hover);
    color: var(--color-foreground);
  }
`;

const Popover = styled.div<{ $isOpen: boolean }>`
  position: absolute;
  top: calc(100% + 8px);
  right: 0;
  width: 280px;
  max-height: 320px;
  background: var(--color-background);
  border: 1px solid var(--color-border);
  border-radius: 12px;
  box-shadow: 0 10px 40px -10px rgba(0, 0, 0, 0.25);
  display: ${(props) => (props.$isOpen ? "flex" : "none")};
  flex-direction: column;
  overflow: hidden;
  z-index: 1000;
`;

const PopoverHeader = styled.div`
  padding: 12px 16px;
  border-bottom: 1px solid var(--color-border);
  font-size: 13px;
  font-weight: 500;
  color: var(--color-foreground);
  display: flex;
  align-items: center;
  gap: 8px;
`;

const PopoverContent = styled.div`
  flex: 1;
  overflow-y: auto;
  padding: 8px;
`;

const IntegrationItem = styled.div<{ $isActive: boolean }>`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 10px 12px;
  background: ${(props) =>
        props.$isActive ? "var(--color-primary-background)" : "transparent"};
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.15s;

  &:hover {
    background: ${(props) =>
        props.$isActive
            ? "var(--color-primary-background)"
            : "var(--color-background-hover)"};
  }
`;

const IntegrationInfo = styled.div`
  display: flex;
  align-items: center;
  gap: 10px;
  min-width: 0;
`;

const IntegrationIcon = styled.div<{ $isActive: boolean }>`
  width: 28px;
  height: 28px;
  border-radius: 6px;
  background: ${(props) =>
        props.$isActive ? "var(--color-primary)" : "var(--color-border)"};
  color: ${(props) => (props.$isActive ? "white" : "var(--color-secondary-text)")};
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
`;

const IntegrationDetails = styled.div`
  display: flex;
  flex-direction: column;
  min-width: 0;
`;

const IntegrationName = styled.span`
  font-size: 13px;
  font-weight: 400;
  color: var(--color-foreground);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
`;

const IntegrationType = styled.span`
  font-size: 11px;
  color: var(--color-secondary-text);
  text-transform: capitalize;
`;

const Toggle = styled.div<{ $isActive: boolean; $isLoading: boolean }>`
  width: 36px;
  height: 20px;
  border-radius: 10px;
  background: ${(props) =>
        props.$isActive ? "var(--color-primary)" : "var(--color-border)"};
  position: relative;
  transition: background 0.2s;
  opacity: ${(props) => (props.$isLoading ? 0.6 : 1)};
  flex-shrink: 0;

  &::after {
    content: "";
    position: absolute;
    top: 2px;
    left: ${(props) => (props.$isActive ? "18px" : "2px")};
    width: 16px;
    height: 16px;
    border-radius: 50%;
    background: white;
    transition: left 0.2s;
    box-shadow: 0 1px 2px rgba(0, 0, 0, 0.2);
  }
`;

export function AgentSettingsButton() {
    const { integrations, loading, addIntegration, removeIntegration } =
        useAgentIntegrations();
    const [isOpen, setIsOpen] = useState(false);
    const [loadingIds, setLoadingIds] = useState<Set<string>>(new Set());
    const containerRef = useRef<HTMLDivElement>(null);

    // Close popover on outside click
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (
                containerRef.current &&
                !containerRef.current.contains(event.target as Node)
            ) {
                setIsOpen(false);
            }
        };

        if (isOpen) {
            document.addEventListener("mousedown", handleClickOutside);
        }

        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, [isOpen]);

    const handleToggle = async (integration: { id: string; is_active: boolean }) => {
        setLoadingIds((prev) => new Set(Array.from(prev).concat(integration.id)));

        try {
            if (integration.is_active) {
                await removeIntegration(integration.id);
            } else {
                await addIntegration(integration.id);
            }
        } finally {
            setLoadingIds((prev) => {
                const next = new Set(Array.from(prev));
                next.delete(integration.id);
                return next;
            });
        }
    };

    // Don't render button if no integrations or still loading
    if (loading || integrations.length === 0) {
        return null;
    }

    return (
        <PopoverContainer ref={containerRef}>
            <SettingsButton onClick={() => setIsOpen(!isOpen)} title="Integrations">
                <Settings size={18} />
            </SettingsButton>

            <Popover $isOpen={isOpen}>
                <PopoverHeader>
                    <Plug size={14} />
                    Integrations
                </PopoverHeader>
                <PopoverContent>
                    {integrations.map((integration) => (
                        <IntegrationItem
                            key={integration.id}
                            $isActive={integration.is_active}
                            onClick={() => handleToggle(integration)}
                        >
                            <IntegrationInfo>
                                <IntegrationIcon $isActive={integration.is_active}>
                                    {integration.is_active ? <Check size={14} /> : <Plug size={14} />}
                                </IntegrationIcon>
                                <IntegrationDetails>
                                    <IntegrationName>{integration.name}</IntegrationName>
                                    <IntegrationType>
                                        {integration.integration_type.replace(/_/g, " ")}
                                    </IntegrationType>
                                </IntegrationDetails>
                            </IntegrationInfo>
                            <Toggle
                                $isActive={integration.is_active}
                                $isLoading={loadingIds.has(integration.id)}
                            />
                        </IntegrationItem>
                    ))}
                </PopoverContent>
            </Popover>
        </PopoverContainer>
    );
}
