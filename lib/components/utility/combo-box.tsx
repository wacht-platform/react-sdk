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
  padding: 8px 12px;
  background: #f8fafc;
  border: 1px solid #e2e8f0;
  border-radius: 6px;
  font-size: 14px;
  color: #1e293b;
  text-align: left;
  cursor: pointer;
  transition: all 0.2s ease;

  &:hover {
    background: #f1f5f9;
    border-color: #cbd5e1;
  }

  &:focus {
    outline: none;
    border-color: #6366f1;
    box-shadow: 0 0 0 2px rgba(99, 102, 241, 0.1);
  }

  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }
`;

const DropdownMenu = styled.div<{ isOpen: boolean }>`
  position: absolute;
  top: calc(100% + 4px);
  left: 0;
  width: 100%;
  max-height: 250px;
  overflow-y: auto;
  background: white;
  border-radius: 6px;
  border: 1px solid #e2e8f0;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  z-index: 50;
  opacity: ${(props) => (props.isOpen ? 1 : 0)};
  transform: ${(props) => (props.isOpen ? "scale(1)" : "scale(0.95)")};
  transform-origin: top;
  pointer-events: ${(props) => (props.isOpen ? "auto" : "none")};
  transition: all 0.2s ease;
`;

const SearchInput = styled.input`
  width: 100%;
  padding: 8px 12px;
  border: none;
  border-bottom: 1px solid #f1f5f9;
  font-size: 14px;
  outline: none;

  &::placeholder {
    color: #94a3b8;
  }
`;

const Option = styled.div<{ isSelected?: boolean; disabled?: boolean }>`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 8px 12px;
  cursor: ${(props) => (props.disabled ? "not-allowed" : "pointer")};
  font-size: 14px;
  background: ${(props) => (props.isSelected ? "#f1f5f9" : "transparent")};
  color: ${(props) => (props.disabled ? "#94a3b8" : "#1e293b")};
  opacity: ${(props) => (props.disabled ? 0.6 : 1)};
  transition: background 0.2s ease;

  &:hover {
    background: ${(props) => (!props.disabled ? "#f8fafc" : "transparent")};
  }
`;

const Placeholder = styled.span`
  color: #94a3b8;
`;

const NoOptions = styled.div`
  padding: 8px 12px;
  color: #94a3b8;
  font-size: 14px;
  text-align: center;
`;

const GroupHeading = styled.div`
  padding: 6px 12px;
  font-size: 12px;
  font-weight: 500;
  text-transform: uppercase;
  color: #64748b;
  background: #f8fafc;
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
