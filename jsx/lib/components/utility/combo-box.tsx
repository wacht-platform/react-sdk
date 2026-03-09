import React, { useState, useRef, useEffect } from "react";
import styled from "styled-components";
import { Check, ChevronDown, ChevronUp } from "lucide-react";

const ComboBoxContainer = styled.div`
  position: relative;
  width: 100%;
`;

const ComboBoxTrigger = styled.button`
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 100%;
  padding: var(--space-4u) var(--space-6u);
  background: var(--color-card);
  border: var(--border-width-thin) solid var(--color-border);
  border-radius: var(--radius-xs);
  font-size: var(--font-size-lg);
  color: var(--color-text);
  text-align: left;
  cursor: pointer;
  transition: all 0.2s ease;

  &:hover {
    background: var(--color-accent);
    color: var(--color-accent-foreground);
    border-color: var(--color-border-hover);
  }

  &:focus {
    outline: none;
    border-color: var(--color-primary);
    box-shadow: 0 0 0 var(--border-width-regular) var(--color-primary-shadow);
  }

  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }
`;

const DropdownMenu = styled.div<{ isOpen: boolean }>`
  position: absolute;
  top: calc(100% + var(--space-2u));
  left: 0;
  width: 100%;
  max-height: calc(calc(var(--size-50u) * 2) + var(--space-12u) + var(--space-1u));
  overflow-y: auto;
  background: var(--color-popover);
  border-radius: var(--radius-xs);
  border: var(--border-width-thin) solid var(--color-border);
  box-shadow: var(--shadow-md);
  z-index: 1000;
  opacity: ${(props) => (props.isOpen ? 1 : 0)};
  transform: ${(props) => (props.isOpen ? "scale(1)" : "scale(0.95)")};
  transform-origin: top;
  pointer-events: ${(props) => (props.isOpen ? "auto" : "none")};
  transition: all 0.2s ease;
`;

const SearchInput = styled.input`
  width: 100%;
  padding: var(--space-4u) var(--space-6u);
  border: none;
  border-bottom: var(--border-width-thin) solid var(--color-border);
  font-size: var(--font-size-lg);
  outline: none;
  background: var(--color-popover);
  color: var(--color-popover-foreground);

  &::placeholder {
    color: var(--color-muted);
  }
`;

const Option = styled.div<{ isSelected?: boolean; disabled?: boolean }>`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: var(--space-4u) var(--space-6u);
  cursor: ${(props) => (props.disabled ? "not-allowed" : "pointer")};
  font-size: var(--font-size-lg);
  background: ${(props) =>
    props.isSelected ? "var(--color-accent)" : "transparent"};
  color: ${(props) =>
    props.disabled ? "var(--color-muted)" : "var(--color-text)"};
  opacity: ${(props) => (props.disabled ? 0.6 : 1)};
  transition: background 0.2s ease;

  &:hover {
    background: ${(props) =>
    !props.disabled ? "var(--color-accent)" : "transparent"};
    color: ${(props) =>
      !props.disabled ? "var(--color-accent-foreground)" : "var(--color-muted)"};
  }
`;

const Placeholder = styled.span`
  color: var(--color-muted);
`;

const NoOptions = styled.div`
  padding: var(--space-4u) var(--space-6u);
  color: var(--color-muted);
  font-size: var(--font-size-lg);
  text-align: center;
`;

const GroupHeading = styled.div`
  padding: var(--space-3u) var(--space-6u);
  font-size: var(--font-size-sm);
  font-weight: 400;
  text-transform: uppercase;
  color: var(--color-muted);
  background: var(--color-secondary);
  color: var(--color-secondary-foreground);
`;

export interface ComboBoxOption {
  value: string;
  label: string;
  disabled?: boolean;
}

export interface ComboBoxGroup {
  label: string;
  options: ComboBoxOption[];
}

interface ComboBoxProps {
  options: ComboBoxOption[] | ComboBoxGroup[];
  value?: string | null;
  onChange: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
  searchable?: boolean;
  width?: string;
  name?: string;
  id?: string;
  groupsEnabled?: boolean;
  className?: string;
}

export const ComboBox: React.FC<ComboBoxProps> = ({
  options,
  value,
  onChange,
  placeholder = "Select an option",
  disabled = false,
  searchable = false,
  width,
  name,
  id,
  groupsEnabled = false,
  className,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const containerRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  const isGrouped = groupsEnabled && "options" in options[0];

  // Flatten options if they are grouped
  const flatOptions = isGrouped
    ? (options as ComboBoxGroup[]).flatMap((group) => group.options)
    : (options as ComboBoxOption[]);

  const selectedOption = flatOptions.find((option) => option.value === value);

  const filteredOptions = searchQuery
    ? isGrouped
      ? (options as ComboBoxGroup[])
        .map((group) => ({
          ...group,
          options: group.options.filter((option) =>
            option.label.toLowerCase().includes(searchQuery.toLowerCase())
          ),
        }))
        .filter((group) => group.options.length > 0)
      : (options as ComboBoxOption[]).filter((option) =>
        option.label.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : options;

  const handleOptionClick = (
    optionValue: string,
    disabled: boolean = false
  ) => {
    if (disabled) return;
    onChange(optionValue);
    setIsOpen(false);
    setSearchQuery("");
  };

  const handleToggle = () => {
    if (disabled) return;
    setIsOpen(!isOpen);
  };

  // Focus search input when dropdown opens
  useEffect(() => {
    if (isOpen && searchable && searchInputRef.current) {
      setTimeout(() => {
        searchInputRef.current?.focus();
      }, 10);
    }
  }, [isOpen, searchable]);

  // Handle click outside to close dropdown
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
        setSearchQuery("");
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  return (
    <ComboBoxContainer
      ref={containerRef}
      style={{ width }}
      className={className}
    >
      <ComboBoxTrigger
        type="button"
        onClick={handleToggle}
        disabled={disabled}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        id={id}
      >
        {selectedOption ? (
          selectedOption.label
        ) : (
          <Placeholder>{placeholder}</Placeholder>
        )}
        {isOpen ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
      </ComboBoxTrigger>

      <DropdownMenu isOpen={isOpen} role="listbox">
        {searchable && (
          <SearchInput
            ref={searchInputRef}
            type="text"
            placeholder="Search..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onClick={(e) => e.stopPropagation()}
          />
        )}

        {isGrouped ? (
          (filteredOptions as ComboBoxGroup[]).map((group, groupIndex) => (
            <React.Fragment key={`group-${groupIndex}`}>
              <GroupHeading>{group.label}</GroupHeading>
              {group.options.length === 0 ? (
                <NoOptions>No options available</NoOptions>
              ) : (
                group.options.map((option) => (
                  <Option
                    key={option.value}
                    isSelected={option.value === value}
                    disabled={option.disabled}
                    onClick={() =>
                      handleOptionClick(option.value, option.disabled)
                    }
                    role="option"
                    aria-selected={option.value === value}
                  >
                    {option.label}
                    {option.value === value && <Check size={16} />}
                  </Option>
                ))
              )}
            </React.Fragment>
          ))
        ) : (
          <>
            {(filteredOptions as ComboBoxOption[]).length === 0 ? (
              <NoOptions>No options available</NoOptions>
            ) : (
              (filteredOptions as ComboBoxOption[]).map((option) => (
                <Option
                  key={option.value}
                  isSelected={option.value === value}
                  disabled={option.disabled}
                  onClick={() =>
                    handleOptionClick(option.value, option.disabled)
                  }
                  role="option"
                  aria-selected={option.value === value}
                >
                  {option.label}
                  {option.value === value && <Check size={16} />}
                </Option>
              ))
            )}
          </>
        )}
      </DropdownMenu>

      {/* Hidden select for form submission */}
      {name && <input type="hidden" name={name} value={value || ""} />}
    </ComboBoxContainer>
  );
};

// Multi-select ComboBox
interface ComboBoxMultiProps {
  options: ComboBoxOption[] | ComboBoxGroup[];
  value: string[];
  onChange: (value: string[]) => void;
  placeholder?: string;
  disabled?: boolean;
  searchable?: boolean;
  width?: string;
  name?: string;
  id?: string;
  groupsEnabled?: boolean;
  className?: string;
}

export const ComboBoxMulti: React.FC<ComboBoxMultiProps> = ({
  options,
  value,
  onChange,
  placeholder = "Select options",
  disabled = false,
  searchable = false,
  width,
  name,
  id,
  groupsEnabled = false,
  className,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const containerRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  const isGrouped = groupsEnabled && "options" in options[0];

  // Flatten options if they are grouped
  const flatOptions = isGrouped
    ? (options as ComboBoxGroup[]).flatMap((group) => group.options)
    : (options as ComboBoxOption[]);

  const selectedOptions = flatOptions.filter((option) =>
    value.includes(option.value)
  );

  const filteredOptions = searchQuery
    ? isGrouped
      ? (options as ComboBoxGroup[])
        .map((group) => ({
          ...group,
          options: group.options.filter((option) =>
            option.label.toLowerCase().includes(searchQuery.toLowerCase())
          ),
        }))
        .filter((group) => group.options.length > 0)
      : (options as ComboBoxOption[]).filter((option) =>
        option.label.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : options;

  const handleOptionClick = (
    optionValue: string,
    disabled: boolean = false
  ) => {
    if (disabled) return;
    if (value.includes(optionValue)) {
      onChange(value.filter((v) => v !== optionValue));
    } else {
      onChange([...value, optionValue]);
    }
  };

  const handleToggle = () => {
    if (disabled) return;
    setIsOpen(!isOpen);
  };

  // Focus search input when dropdown opens
  useEffect(() => {
    if (isOpen && searchable && searchInputRef.current) {
      setTimeout(() => {
        searchInputRef.current?.focus();
      }, 10);
    }
  }, [isOpen, searchable]);

  // Handle click outside to close dropdown
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
        setSearchQuery("");
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  return (
    <ComboBoxContainer
      ref={containerRef}
      style={{ width }}
      className={className}
    >
      <ComboBoxTrigger
        type="button"
        onClick={handleToggle}
        disabled={disabled}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        id={id}
      >
        {selectedOptions.length > 0 ? (
          selectedOptions.map((opt) => opt.label).join(", ")
        ) : (
          <Placeholder>{placeholder}</Placeholder>
        )}
        {isOpen ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
      </ComboBoxTrigger>

      <DropdownMenu isOpen={isOpen} role="listbox">
        {searchable && (
          <SearchInput
            ref={searchInputRef}
            type="text"
            placeholder="Search..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onClick={(e) => e.stopPropagation()}
          />
        )}

        {isGrouped ? (
          (filteredOptions as ComboBoxGroup[]).map((group, groupIndex) => (
            <React.Fragment key={`group-${groupIndex}`}>
              <GroupHeading>{group.label}</GroupHeading>
              {group.options.length === 0 ? (
                <NoOptions>No options available</NoOptions>
              ) : (
                group.options.map((option) => (
                  <Option
                    key={option.value}
                    isSelected={value.includes(option.value)}
                    disabled={option.disabled}
                    onClick={() =>
                      handleOptionClick(option.value, option.disabled)
                    }
                    role="option"
                    aria-selected={value.includes(option.value)}
                  >
                    {option.label}
                    {value.includes(option.value) && <Check size={16} />}
                  </Option>
                ))
              )}
            </React.Fragment>
          ))
        ) : (
          <>
            {(filteredOptions as ComboBoxOption[]).length === 0 ? (
              <NoOptions>No options available</NoOptions>
            ) : (
              (filteredOptions as ComboBoxOption[]).map((option) => (
                <Option
                  key={option.value}
                  isSelected={value.includes(option.value)}
                  disabled={option.disabled}
                  onClick={() =>
                    handleOptionClick(option.value, option.disabled)
                  }
                  role="option"
                  aria-selected={value.includes(option.value)}
                >
                  {option.label}
                  {value.includes(option.value) && <Check size={16} />}
                </Option>
              ))
            )}
          </>
        )}
      </DropdownMenu>

      {/* Hidden input for form submission */}
      {name && <input type="hidden" name={name} value={value.join(",")} />}
    </ComboBoxContainer>
  );
};
