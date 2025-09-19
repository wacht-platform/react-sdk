import styled from "styled-components";
import { Input } from "./input";
import { useEffect, useRef, useState } from "react";
import { countries } from "@/constants/geo";

const breakpoints = {
	sm: "36rem",
	md: "48rem",
	lg: "62rem",
	xl: "75rem",
};

const PhoneInputGroup = styled.div`
  display: flex;
  gap: var(--space-xs);
  width: 100%;

  @media (max-width: ${breakpoints.sm}) {
    gap: 0.375rem;
  }
`;

const CountryCodeSelect = styled.div`
  position: relative;
`;

const CountryCodeButton = styled.button`
  display: flex;
  align-items: center;
  gap: 0.375rem;
  padding: 0.5rem 0.75rem;
  width: 100%;
  border: 0.0625rem solid var(--color-border);
  border-radius: var(--radius-md);
  font-size: var(--font-xs);
  color: var(--color-foreground);
  background: var(--color-input-background);
  cursor: pointer;
  transition: all 0.2s;

  &:hover {
    border-color: var(--color-input-border);
  }

  &:focus {
    outline: none;
    border-color: var(--color-primary);
    box-shadow: 0 0 0 0.1875rem var(--color-input-focus-border);
    background: var(--color-background);
  }

  @media (max-width: ${breakpoints.sm}) {
    padding: 0.375rem 0.625rem;
    font-size: 0.8125rem;
  }
`;

const CountryCodeDropdown = styled.div<{ $isOpen: boolean }>`
  position: absolute;
  top: calc(100% + 0.25rem);
  left: 0;
  width: 17.5rem;
  max-height: 18.75rem;
  overflow-y: auto;
  background: var(--color-background);
  border: 0.0625rem solid var(--color-border);
  border-radius: var(--radius-md);
  box-shadow:
    0 0.25rem 0.375rem -0.0625rem var(--color-shadow),
    0 0.125rem 0.25rem -0.0625rem var(--color-shadow);
  z-index: 1000;
  display: ${(props) => (props.$isOpen ? "block" : "none")};

  @media (max-width: ${breakpoints.sm}) {
    width: 15rem;
    max-height: 15rem;
  }
`;

const CountrySearch = styled.input`
  width: 100%;
  padding: 0.5rem 0.75rem;
  border: none;
  border-bottom: 0.0625rem solid var(--color-border);
  font-size: var(--font-xs);
  color: var(--color-foreground);
  background: var(--color-background);

  &:focus {
    outline: none;
    border-color: var(--color-primary);
  }

  &::placeholder {
    color: var(--color-secondary-text);
  }

  @media (max-width: ${breakpoints.sm}) {
    padding: 0.375rem 0.625rem;
    font-size: 0.8125rem;
  }
`;

const CountryList = styled.div`
  max-height: 15.625rem;
  overflow-y: auto;

  @media (max-width: ${breakpoints.sm}) {
    max-height: 12.5rem;
  }
`;

const CountryOption = styled.button`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  width: 100%;
  padding: 0.5rem 0.75rem;
  border: none;
  background: transparent;
  font-size: var(--font-xs);
  color: var(--color-foreground);
  cursor: pointer;
  text-align: left;

  &:hover {
    background: var(--color-input-background);
  }

  .country-code {
    color: var(--color-secondary-text);
    margin-left: auto;
  }

  @media (max-width: ${breakpoints.sm}) {
    padding: 0.375rem 0.625rem;
    font-size: 0.8125rem;
    gap: 0.375rem;
  }
`;

const PhoneInput = styled(Input)`
  flex: 1;
`;

export const PhoneNumberInput = ({
	value,
	onChange,
	error,
	countryCode,
	setCountryCode,
}: {
	value: string | number | readonly string[] | undefined;
	onChange: React.ChangeEventHandler<HTMLInputElement>;
	error: string | undefined;
	countryCode: string | undefined;
	setCountryCode: React.Dispatch<React.SetStateAction<string | undefined>>;
}) => {
	const [isCountryDropdownOpen, setIsCountryDropdownOpen] = useState(false);
	const [selectedCountry, setSelectedCountry] = useState(
		countries.find((c) => c.code === countryCode) || countries[0],
	);
	const countryDropdownRef = useRef<HTMLDivElement>(null);
	const [countrySearch, setCountrySearch] = useState("");
	const phoneNumberInputRef = useRef<HTMLInputElement>(null);

	useEffect(() => {
		function handleClickOutside(event: MouseEvent) {
			if (
				countryDropdownRef.current &&
				!countryDropdownRef.current.contains(event.target as Node)
			) {
				setIsCountryDropdownOpen(false);
			}
		}

		document.addEventListener("mousedown", handleClickOutside);
		return () => {
			document.removeEventListener("mousedown", handleClickOutside);
		};
	}, []);

	const filteredCountries = countries.filter(
		(country) =>
			country.name.toLowerCase().includes(countrySearch.toLowerCase()) ||
			country.dialCode.includes(countrySearch),
	);

	useEffect(() => {
		setCountryCode(selectedCountry.dialCode);
	}, [selectedCountry, setCountryCode]);

	return (
		<PhoneInputGroup>
			<CountryCodeSelect ref={countryDropdownRef}>
				<CountryCodeButton
					type="button"
					onClick={() => setIsCountryDropdownOpen((prev) => !prev)}
				>
					<span>{selectedCountry.flag}</span>
					<span>{selectedCountry.dialCode}</span>
				</CountryCodeButton>
				<CountryCodeDropdown $isOpen={isCountryDropdownOpen}>
					<CountrySearch
						type="text"
						placeholder="Search country..."
						value={countrySearch}
						onChange={(e) => setCountrySearch(e.target.value)}
						onClick={(e) => e.stopPropagation()}
					/>
					<CountryList>
						{filteredCountries.map((country) => (
							<CountryOption
								key={country.code}
								onClick={(e) => {
									e.stopPropagation();
									e.preventDefault();
									setSelectedCountry(country);
									setIsCountryDropdownOpen(false);
									phoneNumberInputRef.current?.focus();
								}}
							>
								<span>{country.flag}</span>
								<span>{country.name}</span>
								<span className="country-code">{country.dialCode}</span>
							</CountryOption>
						))}
					</CountryList>
				</CountryCodeDropdown>
			</CountryCodeSelect>
			<PhoneInput
				style={{ height: "100%" }}
				type="tel"
				id="phone"
				name="phone"
				required
				minLength={7}
				maxLength={15}
				ref={phoneNumberInputRef}
				value={value}
				onChange={onChange}
				placeholder="Phone number"
				aria-invalid={!!error}
				pattern="^\d{7,15}$"
			/>
		</PhoneInputGroup>
	);
};
