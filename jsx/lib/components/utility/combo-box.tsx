import React, { useState, useRef, useEffect } from "react";
import { Check, CaretDown, CaretUp } from "@phosphor-icons/react";

const MENU_STYLE = (isOpen: boolean): React.CSSProperties => ({
  position: "absolute",
  top: "calc(100% + 6px)",
  left: 0,
  width: "100%",
  maxHeight: 260,
  overflowY: "auto",
  zIndex: 1000,
  opacity: isOpen ? 1 : 0,
  transform: isOpen ? "scale(1)" : "scale(0.97)",
  transformOrigin: "top",
  pointerEvents: isOpen ? "auto" : "none",
  transition: "opacity 0.15s ease, transform 0.15s ease",
});

const COMBO_SEARCH_STYLE: React.CSSProperties = {
  width: "100%",
  height: 32,
  padding: "0 9px",
  border: "none",
  borderBottom: "0.5px solid var(--wa-border)",
  borderRadius: 0,
  fontFamily: "var(--wa-font-sans)",
  fontSize: 13,
  outline: "none",
  background: "transparent",
  color: "var(--wa-text)",
  marginBottom: 4,
};

const NoOptions = ({ children }: { children: React.ReactNode }) => (
  <div
    style={{
      padding: "10px 9px",
      color: "var(--wa-text-faint)",
      fontFamily: "var(--wa-font-sans)",
      fontSize: 12.5,
      textAlign: "center",
    }}
  >
    {children}
  </div>
);

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
    <div
      ref={containerRef}
      style={{ position: "relative", width: width || "100%" }}
      className={className}
    >
      <button
        type="button"
        className="w-combo"
        data-open={isOpen ? "" : undefined}
        onClick={handleToggle}
        disabled={disabled}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        id={id}
      >
        <span
          className="w-combo-val"
          data-ph={selectedOption ? undefined : ""}
        >
          {selectedOption ? selectedOption.label : placeholder}
        </span>
        {isOpen ? <CaretUp size={16} /> : <CaretDown size={16} />}
      </button>

      <div className="w-combo-menu" style={MENU_STYLE(isOpen)} role="listbox">
        {searchable && (
          <input
            ref={searchInputRef}
            type="text"
            style={COMBO_SEARCH_STYLE}
            placeholder="Search..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onClick={(e) => e.stopPropagation()}
          />
        )}

        {isGrouped ? (
          (filteredOptions as ComboBoxGroup[]).map((group, groupIndex) => (
            <React.Fragment key={`group-${groupIndex}`}>
              <div className="w-combo-grp">{group.label}</div>
              {group.options.length === 0 ? (
                <NoOptions>No options available</NoOptions>
              ) : (
                group.options.map((option) => (
                  <button
                    type="button"
                    key={option.value}
                    className="w-combo-opt"
                    data-disabled={option.disabled ? "" : undefined}
                    onClick={() =>
                      handleOptionClick(option.value, option.disabled)
                    }
                    role="option"
                    aria-selected={option.value === value}
                  >
                    {option.label}
                    {option.value === value && (
                      <span className="w-combo-check">
                        <Check size={16} />
                      </span>
                    )}
                  </button>
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
                <button
                  type="button"
                  key={option.value}
                  className="w-combo-opt"
                  data-disabled={option.disabled ? "" : undefined}
                  onClick={() =>
                    handleOptionClick(option.value, option.disabled)
                  }
                  role="option"
                  aria-selected={option.value === value}
                >
                  {option.label}
                  {option.value === value && (
                    <span className="w-combo-check">
                      <Check size={16} />
                    </span>
                  )}
                </button>
              ))
            )}
          </>
        )}
      </div>

      {/* Hidden select for form submission */}
      {name && <input type="hidden" name={name} value={value || ""} />}
    </div>
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
    <div
      ref={containerRef}
      style={{ position: "relative", width: width || "100%" }}
      className={className}
    >
      <button
        type="button"
        className="w-combo"
        data-open={isOpen ? "" : undefined}
        onClick={handleToggle}
        disabled={disabled}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        id={id}
      >
        <span
          className="w-combo-val"
          data-ph={selectedOptions.length > 0 ? undefined : ""}
        >
          {selectedOptions.length > 0
            ? selectedOptions.map((opt) => opt.label).join(", ")
            : placeholder}
        </span>
        {isOpen ? <CaretUp size={16} /> : <CaretDown size={16} />}
      </button>

      <div className="w-combo-menu" style={MENU_STYLE(isOpen)} role="listbox">
        {searchable && (
          <input
            ref={searchInputRef}
            type="text"
            style={COMBO_SEARCH_STYLE}
            placeholder="Search..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onClick={(e) => e.stopPropagation()}
          />
        )}

        {isGrouped ? (
          (filteredOptions as ComboBoxGroup[]).map((group, groupIndex) => (
            <React.Fragment key={`group-${groupIndex}`}>
              <div className="w-combo-grp">{group.label}</div>
              {group.options.length === 0 ? (
                <NoOptions>No options available</NoOptions>
              ) : (
                group.options.map((option) => (
                  <button
                    type="button"
                    key={option.value}
                    className="w-combo-opt"
                    data-disabled={option.disabled ? "" : undefined}
                    onClick={() =>
                      handleOptionClick(option.value, option.disabled)
                    }
                    role="option"
                    aria-selected={value.includes(option.value)}
                  >
                    {option.label}
                    {value.includes(option.value) && (
                      <span className="w-combo-check">
                        <Check size={16} />
                      </span>
                    )}
                  </button>
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
                <button
                  type="button"
                  key={option.value}
                  className="w-combo-opt"
                  data-disabled={option.disabled ? "" : undefined}
                  onClick={() =>
                    handleOptionClick(option.value, option.disabled)
                  }
                  role="option"
                  aria-selected={value.includes(option.value)}
                >
                  {option.label}
                  {value.includes(option.value) && (
                    <span className="w-combo-check">
                      <Check size={16} />
                    </span>
                  )}
                </button>
              ))
            )}
          </>
        )}
      </div>

      {/* Hidden input for form submission */}
      {name && <input type="hidden" name={name} value={value.join(",")} />}
    </div>
  );
};
