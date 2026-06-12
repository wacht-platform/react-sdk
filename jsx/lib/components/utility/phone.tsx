import { useEffect, useRef, useState } from "react";
import { CaretDown, MagnifyingGlass } from "@phosphor-icons/react";
import { countries } from "@/constants/geo";

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
		<div className="w-phone">
			<div style={{ position: "relative" }} ref={countryDropdownRef}>
				<button
					type="button"
					className="w-phone-cc"
					style={{ height: "100%" }}
					onClick={() => setIsCountryDropdownOpen((prev) => !prev)}
				>
					<span>{selectedCountry.flag}</span>
					<span>{selectedCountry.dialCode}</span>
					<CaretDown weight="bold" />
				</button>
				{isCountryDropdownOpen && (
					<div className="w-country-pop">
						<div className="w-country-search">
							<MagnifyingGlass />
							<input
								type="text"
								placeholder="Search country…"
								value={countrySearch}
								onChange={(e) => setCountrySearch(e.target.value)}
								onClick={(e) => e.stopPropagation()}
							/>
						</div>
						<div className="w-country-list">
							{filteredCountries.map((country) => (
								<button
									key={country.code}
									type="button"
									className="w-country-opt"
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
									<span className="dial">
										{country.dialCode}
									</span>
								</button>
							))}
						</div>
					</div>
				)}
			</div>
			<input
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
		</div>
	);
};
