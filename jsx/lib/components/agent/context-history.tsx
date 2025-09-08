import { useState, useCallback, useEffect } from 'react';
import styled from 'styled-components';
import { useClient } from '../../hooks/use-client';
import { DefaultStylesProvider } from '../utility/root';
import { ExecutionContext } from '../../hooks/use-context-manager';

interface ContextHistoryProps {
  token: string;
  onSelectContext: (context: ExecutionContext) => void;
  onClose: () => void;
  theme?: any;
}

// Styled components
const Container = styled.div`
  height: 100%;
  display: flex;
  flex-direction: column;
  background: var(--color-background);
`;

const Header = styled.div`
  padding: var(--space-md) var(--space-lg);
  border-bottom: 1px solid var(--color-border);
  display: flex;
  align-items: center;
  gap: var(--space-md);
`;

const BackButton = styled.button`
  width: 32px;
  height: 32px;
  border-radius: var(--radius-sm);
  background: transparent;
  border: none;
  cursor: pointer;
  color: var(--color-text-secondary);
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s ease;
  
  &:hover {
    background: var(--color-background-hover);
    color: var(--color-text);
  }
`;


const SearchInput = styled.input`
  flex: 1;
  padding: var(--space-sm) var(--space-md);
  background: var(--color-surface, var(--color-background));
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  font-size: var(--font-sm);
  color: var(--color-text);
  transition: all 0.2s ease;
  
  &:focus {
    outline: none;
    border-color: var(--color-primary);
  }
  
  &::placeholder {
    color: var(--color-text-secondary);
  }
`;


const ContextList = styled.div`
  flex: 1;
  overflow-y: auto;
  padding: var(--space-lg);
`;

const ContextGrid = styled.div`
  display: flex;
  flex-direction: column;
  gap: var(--space-sm);
`;

const ContextCard = styled.div`
  padding: var(--space-md);
  background: var(--color-surface, var(--color-background));
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  cursor: pointer;
  transition: all 0.15s ease;
  
  &:hover {
    background: var(--color-surface-hover, var(--color-background-hover));
    border-color: var(--color-border-hover, var(--color-border));
  }
`;

const ContextTitle = styled.h3`
  font-size: var(--font-sm);
  font-weight: 400;
  color: var(--color-text);
  margin: 0 0 var(--space-xs) 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
`;

const ContextMeta = styled.div`
  display: flex;
  align-items: center;
  gap: var(--space-sm);
  font-size: var(--font-xs);
  color: var(--color-text-secondary);
`;


const LoadMoreButton = styled.button`
  width: 100%;
  padding: var(--space-sm) var(--space-md);
  margin-top: var(--space-md);
  background: transparent;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  color: var(--color-text-secondary);
  cursor: pointer;
  font-size: var(--font-sm);
  transition: all 0.2s ease;
  
  &:hover:not(:disabled) {
    background: var(--color-surface);
    color: var(--color-text);
  }
  
  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;

const EmptyState = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100%;
  text-align: center;
  color: var(--color-text-secondary);
  
  svg {
    opacity: 0.3;
    margin-bottom: var(--space-md);
  }
  
  p {
    font-size: var(--font-sm);
    opacity: 0.8;
  }
`;

const LoadingState = styled.div`
  display: flex;
  flex-direction: column;
  gap: var(--space-sm);
  padding: var(--space-lg);
`;

const SkeletonCard = styled.div`
  padding: var(--space-md);
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

const SkeletonTitle = styled.div`
  height: 14px;
  width: 60%;
  background: var(--color-border);
  border-radius: var(--radius-sm);
  margin-bottom: var(--space-xs);
`;

const SkeletonMeta = styled.div`
  height: 12px;
  width: 30%;
  background: var(--color-border);
  border-radius: var(--radius-sm);
  opacity: 0.6;
`;

export function ContextHistory({
  token,
  onSelectContext,
  onClose,
  theme
}: ContextHistoryProps) {
  const { client } = useClient();
  const [contexts, setContexts] = useState<ExecutionContext[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [offset, setOffset] = useState(0);
  const [hasMore, setHasMore] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  
  const fetchContexts = useCallback(async (search: string, offset: number, append = false, limit = 12) => {
    try {
      if (!append) setLoading(true);
      else setLoadingMore(true);
      
      const params = new URLSearchParams({
        token,
        limit: String(limit),
        offset: String(offset)
      });
      
      if (search) {
        params.append('search', search);
      }
      
      const response = await client(`/api/agent/contexts?${params}`, {
        method: 'GET'
      });
      
      const data = await response.json();
      
      if (data.status === 200 && data.data) {
        setContexts(prev => append ? [...prev, ...data.data.data] : data.data.data);
        setHasMore(data.data.has_more);
        setOffset(offset);
      }
    } catch (error) {
      console.error('Failed to fetch contexts:', error);
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }, [client, token]);
  
  // Initial load only
  useEffect(() => {
    fetchContexts('', 0);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Only on mount
  
  // Search with debounce
  useEffect(() => {
    if (!searchQuery) return; // Don't search if empty
    
    const timer = setTimeout(() => {
      fetchContexts(searchQuery, 0);
    }, 300);
    
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchQuery]); // Only when search changes
  
  const loadMore = () => {
    if (!loadingMore && hasMore) {
      fetchContexts(searchQuery, offset + 12, true);
    }
  };
  
  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString() + ' ' + date.toLocaleTimeString();
    } catch {
      return dateString;
    }
  };
  
  return (
    <DefaultStylesProvider theme={theme} style={{ height: '100%' }}>
      <Container>
        <Header>
          <BackButton onClick={onClose}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="19" y1="12" x2="5" y2="12"></line>
              <polyline points="12 19 5 12 12 5"></polyline>
            </svg>
          </BackButton>
          <SearchInput
            type="text"
            placeholder="Search conversations..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </Header>
        
        <ContextList>
          {loading ? (
            <LoadingState>
              {[1, 2, 3, 4].map((i) => (
                <SkeletonCard key={i}>
                  <SkeletonTitle />
                  <SkeletonMeta />
                </SkeletonCard>
              ))}
            </LoadingState>
          ) : contexts.length === 0 ? (
            <EmptyState>
              <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <path d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <p style={{ marginTop: 'var(--space-md)' }}>
                {searchQuery ? 'No conversations found' : 'No conversation history'}
              </p>
            </EmptyState>
          ) : (
            <>
              <ContextGrid>
                {contexts.map((context) => (
                  <ContextCard
                    key={context.id}
                    onClick={() => onSelectContext(context)}
                  >
                    <ContextTitle>{context.title}</ContextTitle>
                    <ContextMeta>
                      <span>{formatDate(context.last_activity_at)}</span>
                      {context.status === 'running' && <span>• Active</span>}
                    </ContextMeta>
                  </ContextCard>
                ))}
              </ContextGrid>
              
              {hasMore && (
                <LoadMoreButton 
                  onClick={loadMore}
                  disabled={loadingMore}
                >
                  {loadingMore ? 'Loading...' : 'Load More'}
                </LoadMoreButton>
              )}
            </>
          )}
        </ContextList>
      </Container>
    </DefaultStylesProvider>
  );
}