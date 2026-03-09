import { Search } from "lucide-react";
import styled from "styled-components";

const SearchWrapper = styled.div`
  display: flex;
  flex-grow: 1;
  align-items: center;
  border: var(--border-width-thin) solid var(--color-border);
  border-radius: var(--radius-md);
  padding: var(--space-4u) var(--space-6u);
  background-color: var(--color-input-background);
  min-width: calc(var(--space-10u) * 12.5);
`;

const SearchField = styled.input`
  border: none;
  outline: none;
  width: 100%;
  font-size: var(--font-size-lg);
  color: var(--color-text);
  background-color: transparent;
`;

const SearchIcon = styled(Search)`
  margin-right: var(--space-4u);
  color: var(--color-secondary-text);
`;

interface SearchInputProps {
  placeholder: string;
  value: string;
  onChange: (value: string) => void;
}

export const SearchInput = ({
  onChange,
  placeholder,
  value,
}: SearchInputProps) => {
  return (
    <SearchWrapper>
      <SearchIcon size={16} />
      <SearchField
        type="text"
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
    </SearchWrapper>
  );
};
