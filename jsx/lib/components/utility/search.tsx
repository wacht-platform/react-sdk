import { MagnifyingGlass } from "@phosphor-icons/react";

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
    <div className="w-search">
      <MagnifyingGlass />
      <input
        type="text"
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
    </div>
  );
};
