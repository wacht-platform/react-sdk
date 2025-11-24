import { Search } from "lucide-react";

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
    <div
      style={{
        display: "flex",
        flexGrow: 1,
        alignItems: "center",
        border: "1px solid var(--color-border)",
        borderRadius: "8px",
        padding: "8px 12px",
        backgroundColor: "var(--color-input-background)",
        minWidth: "250px",
      }}
    >
      <Search size={16} color="var(--color-secondary-text)" style={{ marginRight: "8px" }} />
      <input
        type="text"
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        style={{
          border: "none",
          outline: "none",
          width: "100%",
          fontSize: "14px",
          color: "var(--color-text)",
          backgroundColor: "transparent",
        }}
      />
    </div>
  );
};
