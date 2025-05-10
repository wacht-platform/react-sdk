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
        border: "1px solid #e2e8f0",
        borderRadius: "8px",
        padding: "8px 12px",
        backgroundColor: "#fff",
        minWidth: "250px",
      }}
    >
      <Search size={16} color="#94a3b8" style={{ marginRight: "8px" }} />
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
          color: "#1e293b",
        }}
      />
    </div>
  );
};
