import { useState, useRef, useEffect } from "react";
import styled from "styled-components";
import type { SSOProvider, SignUpParams } from "../../types/auth";
import { useSignUp } from "../../hooks/use-signup";
import { useDeployment } from "../../hooks/use-deployment";
import { TypographyProvider } from "../utility/typography";

const ssoConfig = {
	google_oauth: {
		shortLabel: "Google",
		fullLabel: "Continue with Google",
		icon: (
			<svg
				xmlns="http://www.w3.org/2000/svg"
				role="img"
				aria-label="Google"
				viewBox="0 0 48 48"
				width="24px"
				height="24px"
			>
				<path
					fill="#fbc02d"
					d="M43.611,20.083H42V20H24v8h11.303c-1.649,4.657-6.08,8-11.303,8c-6.627,0-12-5.373-12-12	s5.373-12,12-12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C12.955,4,4,12.955,4,24s8.955,20,20,20	s20-8.955,20-20C44,22.659,43.862,21.35,43.611,20.083z"
				/>
				<path
					fill="#e53935"
					d="M6.306,14.691l6.571,4.819C14.655,15.108,18.961,12,24,12c3.059,0,5.842,1.154,7.961,3.039	l5.657-5.657C34.046,6.053,29.268,4,24,4C16.318,4,9.656,8.337,6.306,14.691z"
				/>
				<path
					fill="#4caf50"
					d="M24,44c5.166,0,9.86-1.977,13.409-5.192l-6.19-5.238C29.211,35.091,26.715,36,24,36	c-5.202,0-9.619-3.317-11.283-7.946l-6.522,5.025C9.505,39.556,16.227,44,24,44z"
				/>
				<path
					fill="#1565c0"
					d="M43.611,20.083L43.595,20L42,20H24v8h11.303c-0.792,2.237-2.231,4.166-4.087,5.571	c0.001-0.001,0.002-0.001,0.003-0.002l6.19,5.238C36.971,39.205,44,34,44,24C44,22.659,43.862,21.35,43.611,20.083z"
				/>
			</svg>
		),
	},
	microsoft_oauth: {
		shortLabel: "Microsoft",
		fullLabel: "Continue with Microsoft",
		icon: (
			<svg
				xmlns="http://www.w3.org/2000/svg"
				viewBox="0 0 48 48"
				width="24px"
				height="24px"
				role="img"
				aria-label="Microsoft"
			>
				<path fill="#ff5722" d="M6 6H22V22H6z" transform="rotate(-180 14 14)" />
				<path
					fill="#4caf50"
					d="M26 6H42V22H26z"
					transform="rotate(-180 34 14)"
				/>
				<path
					fill="#ffc107"
					d="M26 26H42V42H26z"
					transform="rotate(-180 34 34)"
				/>
				<path
					fill="#03a9f4"
					d="M6 26H22V42H6z"
					transform="rotate(-180 14 34)"
				/>
			</svg>
		),
	},
	github_oauth: {
		shortLabel: "GitHub",
		fullLabel: "Continue with GitHub",
		icon: (
			<svg
				xmlns="http://www.w3.org/2000/svg"
				viewBox="0 0 30 30"
				width="24px"
				height="24px"
				role="img"
				aria-label="GitHub"
			>
				<path d="M15,3C8.373,3,3,8.373,3,15c0,5.623,3.872,10.328,9.092,11.63C12.036,26.468,12,26.28,12,26.047v-2.051 c-0.487,0-1.303,0-1.508,0c-0.821,0-1.551-0.353-1.905-1.009c-0.393-0.729-0.461-1.844-1.435-2.526 c-0.289-0.227-0.069-0.486,0.264-0.451c0.615,0.174,1.125,0.596,1.605,1.222c0.478,0.627,0.703,0.769,1.596,0.769 c0.433,0,1.081-0.025,1.691-0.121c0.328-0.833,0.895-1.6,1.588-1.962c-3.996-0.411-5.903-2.399-5.903-5.098 c0-1.162,0.495-2.286,1.336-3.233C9.053,10.647,8.706,8.73,9.435,8c1.798,0,2.885,1.166,3.146,1.481C13.477,9.174,14.461,9,15.495,9 c1.036,0,2.024,0.174,2.922,0.483C18.675,9.17,19.763,8,21.565,8c0.732,0.731,0.381,2.656,0.102,3.594 c0.836,0.945,1.328,2.066,1.328,3.226c0,2.697-1.904,4.684-5.894,5.097C18.199,20.49,19,22.1,19,23.313v2.734 c0,0.104-0.023,0.179-0.035,0.268C23.641,24.676,27,20.236,27,15C27,8.373,21.627,3,15,3z" />
			</svg>
		),
	},
};

const Container = styled.div`
	max-width: 400px;
	width: 400px;
	padding: 32px;
	background: white;
	border-radius: 12px;
	box-shadow: 0 4px 24px rgba(0, 0, 0, 0.1);
`;

const Header = styled.div`
	text-align: center;
	margin-bottom: 24px;
`;

const Title = styled.h1`
	font-size: 20px;
	font-weight: 600;
	color: #111827;
	margin-bottom: 4px;
`;

const Subtitle = styled.p`
	color: #6B7280;
	font-size: 14px;
`;

const SSOButtonsContainer = styled.div`
	display: flex;
	flex-direction: row;
	gap: 12px;
	margin-bottom: 24px;
`;

const SSOButton = styled.button`
	flex: 1;
	display: flex;
	align-items: center;
	justify-content: center;
	gap: 8px;
	padding: 4px 16px;
	border: 1px solid #E5E7EB;
	border-radius: 8px;
	background: white;
	cursor: pointer;
	transition: all 0.2s;
	font-size: 14px;
	color: #374151;
	font-weight: 500;

	&:hover {
		background-color: #F9FAFB;
		border-color: #D1D5DB;
	}

	img {
		width: 16px;
		height: 16px;
	}
`;

const Divider = styled.div`
	position: relative;
	text-align: center;
	margin: 24px 0;

	&::before {
		content: "";
		position: absolute;
		top: 50%;
		left: 0;
		right: 0;
		height: 1px;
		background: #E5E7EB;
	}
`;

const DividerText = styled.span`
	position: relative;
	background: white;
	padding: 0 12px;
	color: #6B7280;
	font-size: 14px;
`;

const Form = styled.form`
	display: flex;
	flex-direction: column;
	gap: 16px;
`;

const NameFields = styled.div<{ $isBothEnabled: boolean }>`
	display: grid;
	grid-template-columns: ${(props) => (props.$isBothEnabled ? "1fr 1fr" : "1fr")};
	gap: 12px;
`;

const FormGroup = styled.div`
	display: flex;
	flex-direction: column;
	gap: 6px;
`;

const Label = styled.label`
	font-size: 14px;
	text-align: left;
	font-weight: 500;
	color: #374151;
`;

const Input = styled.input`
	padding: 8px 12px;
	width: 100%;
	height: 35px;
	border: 1px solid #E5E7EB;
	border-radius: 8px;
	font-size: 14px;
	color: #111827;
	background: #F9FAFB;
	transition: all 0.2s;

	&:not(:placeholder-shown):invalid {
		outline: none;
		border: 1px solid #EF4444;
		background: white;
	}
	
	&:not(:placeholder-shown):valid {
		outline: none;
		background: white;
	}
	
	&:focus:valid {
		outline: none;
		border-color: #22c55e;
    box-shadow: 0 0 0 3px rgba(34, 197, 94, 0.1);
		background: white;
	}

	&:focus:invalid {
		outline: none;
		border-color: #6366F1;
		box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.1);
		background: white;
	}

	&::placeholder {
		color: #9CA3AF;
	}
`;

const PasswordGroup = styled.div`
	position: relative;
`;

const ErrorMessage = styled.p`
	font-size: 12px;
	color: #EF4444;
	margin: 0;
	margin-top: 2px;
`;

const RequiredAsterisk = styled.span`
	color: #EF4444;
	margin-left: 4px;
	vertical-align: middle;
`;

const SubmitButton = styled.button`
	width: 100%;
	padding: 9px 16px;
	background: #6366F1;
	color: white;
	border: none;
	border-radius: 8px;
	font-weight: 500;
	font-size: 14px;
	cursor: pointer;
	transition: background-color 0.2s;
	margin-top: 8px;

	&:hover:not(:disabled) {
		background: #4F46E5;
	}

	&:disabled {
		opacity: 0.7;
		cursor: not-allowed;
	}
`;

const Footer = styled.p`
	margin-top: 24px;
	text-align: center;
	font-size: 14px;
	color: #6B7280;
`;

const Link = styled.a`
	color: #6366F1;
	text-decoration: none;
	font-weight: 500;
	transition: color 0.2s;

	&:hover {
		color: #4F46E5;
	}
`;

const PhoneInputGroup = styled.div`
	display: flex;
	gap: 8px;
	width: 100%;
`;

const CountryCodeSelect = styled.div`
	position: relative;
`;

const CountryCodeButton = styled.button`
	display: flex;
	align-items: center;
	gap: 6px;
	padding: 8px 12px;
	width: 100%;
	border: 1px solid #E5E7EB;
	border-radius: 8px;
	font-size: 14px;
	color: #111827;
	background: #F9FAFB;
	cursor: pointer;
	transition: all 0.2s;

	&:hover {
		border-color: #D1D5DB;
	}

	&:focus {
		outline: none;
		border-color: #6366F1;
		box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.1);
		background: white;
	}
`;

const CountryCodeDropdown = styled.div<{ $isOpen: boolean }>`
	position: absolute;
	top: calc(100% + 4px);
	left: 0;
	width: 280px;
	max-height: 300px;
	overflow-y: auto;
	background: white;
	border: 1px solid #E5E7EB;
	border-radius: 8px;
	box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
	z-index: 50;
	display: ${(props) => (props.$isOpen ? "block" : "none")};
`;

const CountrySearch = styled.input`
	width: 100%;
	padding: 8px 12px;
	border: none;
	border-bottom: 1px solid #E5E7EB;
	font-size: 14px;
	color: #111827;

	&:focus {
		outline: none;
		border-color: #6366F1;
	}

	&::placeholder {
		color: #9CA3AF;
	}
`;

const CountryList = styled.div`
	max-height: 250px;
	overflow-y: auto;
`;

const CountryOption = styled.button`
	display: flex;
	align-items: center;
	gap: 8px;
	width: 100%;
	padding: 8px 12px;
	border: none;
	background: transparent;
	font-size: 14px;
	color: #111827;
	cursor: pointer;
	text-align: left;

	&:hover {
		background: #F9FAFB;
	}

	.country-code {
		color: #6B7280;
		margin-left: auto;
	}
`;

const PhoneInput = styled(Input)`
	flex: 1;
`;

interface Country {
	name: string;
	code: string;
	dialCode: string;
}

const countries: Country[] = [
	{ name: "Afghanistan", code: "AF", dialCode: "+93" },
	{ name: "Albania", code: "AL", dialCode: "+355" },
	{ name: "Algeria", code: "DZ", dialCode: "+213" },
	{ name: "American Samoa", code: "AS", dialCode: "+1684" },
	{ name: "Andorra", code: "AD", dialCode: "+376" },
	{ name: "Angola", code: "AO", dialCode: "+244" },
	{ name: "Anguilla", code: "AI", dialCode: "+1264" },
	{ name: "Antarctica", code: "AQ", dialCode: "+672" },
	{ name: "Antigua and Barbuda", code: "AG", dialCode: "+1268" },
	{ name: "Argentina", code: "AR", dialCode: "+54" },
	{ name: "Armenia", code: "AM", dialCode: "+374" },
	{ name: "Aruba", code: "AW", dialCode: "+297" },
	{ name: "Australia", code: "AU", dialCode: "+61" },
	{ name: "Austria", code: "AT", dialCode: "+43" },
	{ name: "Azerbaijan", code: "AZ", dialCode: "+994" },
	{ name: "Bahamas", code: "BS", dialCode: "+1242" },
	{ name: "Bahrain", code: "BH", dialCode: "+973" },
	{ name: "Bangladesh", code: "BD", dialCode: "+880" },
	{ name: "Barbados", code: "BB", dialCode: "+1246" },
	{ name: "Belarus", code: "BY", dialCode: "+375" },
	{ name: "Belgium", code: "BE", dialCode: "+32" },
	{ name: "Belize", code: "BZ", dialCode: "+501" },
	{ name: "Benin", code: "BJ", dialCode: "+229" },
	{ name: "Bermuda", code: "BM", dialCode: "+1441" },
	{ name: "Bhutan", code: "BT", dialCode: "+975" },
	{ name: "Bolivia", code: "BO", dialCode: "+591" },
	{ name: "Bosnia and Herzegovina", code: "BA", dialCode: "+387" },
	{ name: "Botswana", code: "BW", dialCode: "+267" },
	{ name: "Brazil", code: "BR", dialCode: "+55" },
	{ name: "British Indian Ocean Territory", code: "IO", dialCode: "+246" },
	{ name: "British Virgin Islands", code: "VG", dialCode: "+1284" },
	{ name: "Brunei", code: "BN", dialCode: "+673" },
	{ name: "Bulgaria", code: "BG", dialCode: "+359" },
	{ name: "Burkina Faso", code: "BF", dialCode: "+226" },
	{ name: "Burundi", code: "BI", dialCode: "+257" },
	{ name: "Cambodia", code: "KH", dialCode: "+855" },
	{ name: "Cameroon", code: "CM", dialCode: "+237" },
	{ name: "Canada", code: "CA", dialCode: "+1" },
	{ name: "Cape Verde", code: "CV", dialCode: "+238" },
	{ name: "Cayman Islands", code: "KY", dialCode: "+1345" },
	{ name: "Central African Republic", code: "CF", dialCode: "+236" },
	{ name: "Chad", code: "TD", dialCode: "+235" },
	{ name: "Chile", code: "CL", dialCode: "+56" },
	{ name: "China", code: "CN", dialCode: "+86" },
	{ name: "Christmas Island", code: "CX", dialCode: "+61" },
	{ name: "Cocos Islands", code: "CC", dialCode: "+61" },
	{ name: "Colombia", code: "CO", dialCode: "+57" },
	{ name: "Comoros", code: "KM", dialCode: "+269" },
	{ name: "Cook Islands", code: "CK", dialCode: "+682" },
	{ name: "Costa Rica", code: "CR", dialCode: "+506" },
	{ name: "Croatia", code: "HR", dialCode: "+385" },
	{ name: "Cuba", code: "CU", dialCode: "+53" },
	{ name: "Curacao", code: "CW", dialCode: "+599" },
	{ name: "Cyprus", code: "CY", dialCode: "+357" },
	{ name: "Czech Republic", code: "CZ", dialCode: "+420" },
	{ name: "Democratic Republic of the Congo", code: "CD", dialCode: "+243" },
	{ name: "Denmark", code: "DK", dialCode: "+45" },
	{ name: "Djibouti", code: "DJ", dialCode: "+253" },
	{ name: "Dominica", code: "DM", dialCode: "+1767" },
	{ name: "Dominican Republic", code: "DO", dialCode: "+1849" },
	{ name: "East Timor", code: "TL", dialCode: "+670" },
	{ name: "Ecuador", code: "EC", dialCode: "+593" },
	{ name: "Egypt", code: "EG", dialCode: "+20" },
	{ name: "El Salvador", code: "SV", dialCode: "+503" },
	{ name: "Equatorial Guinea", code: "GQ", dialCode: "+240" },
	{ name: "Eritrea", code: "ER", dialCode: "+291" },
	{ name: "Estonia", code: "EE", dialCode: "+372" },
	{ name: "Ethiopia", code: "ET", dialCode: "+251" },
	{ name: "Falkland Islands", code: "FK", dialCode: "+500" },
	{ name: "Faroe Islands", code: "FO", dialCode: "+298" },
	{ name: "Fiji", code: "FJ", dialCode: "+679" },
	{ name: "Finland", code: "FI", dialCode: "+358" },
	{ name: "France", code: "FR", dialCode: "+33" },
	{ name: "French Polynesia", code: "PF", dialCode: "+689" },
	{ name: "Gabon", code: "GA", dialCode: "+241" },
	{ name: "Gambia", code: "GM", dialCode: "+220" },
	{ name: "Georgia", code: "GE", dialCode: "+995" },
	{ name: "Germany", code: "DE", dialCode: "+49" },
	{ name: "Ghana", code: "GH", dialCode: "+233" },
	{ name: "Gibraltar", code: "GI", dialCode: "+350" },
	{ name: "Greece", code: "GR", dialCode: "+30" },
	{ name: "Greenland", code: "GL", dialCode: "+299" },
	{ name: "Grenada", code: "GD", dialCode: "+1473" },
	{ name: "Guam", code: "GU", dialCode: "+1671" },
	{ name: "Guatemala", code: "GT", dialCode: "+502" },
	{ name: "Guernsey", code: "GG", dialCode: "+44" },
	{ name: "Guinea", code: "GN", dialCode: "+224" },
	{ name: "Guinea-Bissau", code: "GW", dialCode: "+245" },
	{ name: "Guyana", code: "GY", dialCode: "+592" },
	{ name: "Haiti", code: "HT", dialCode: "+509" },
	{ name: "Honduras", code: "HN", dialCode: "+504" },
	{ name: "Hong Kong", code: "HK", dialCode: "+852" },
	{ name: "Hungary", code: "HU", dialCode: "+36" },
	{ name: "Iceland", code: "IS", dialCode: "+354" },
	{ name: "India", code: "IN", dialCode: "+91" },
	{ name: "Indonesia", code: "ID", dialCode: "+62" },
	{ name: "Iran", code: "IR", dialCode: "+98" },
	{ name: "Iraq", code: "IQ", dialCode: "+964" },
	{ name: "Ireland", code: "IE", dialCode: "+353" },
	{ name: "Isle of Man", code: "IM", dialCode: "+44" },
	{ name: "Israel", code: "IL", dialCode: "+972" },
	{ name: "Italy", code: "IT", dialCode: "+39" },
	{ name: "Ivory Coast", code: "CI", dialCode: "+225" },
	{ name: "Jamaica", code: "JM", dialCode: "+1876" },
	{ name: "Japan", code: "JP", dialCode: "+81" },
	{ name: "Jersey", code: "JE", dialCode: "+44" },
	{ name: "Jordan", code: "JO", dialCode: "+962" },
	{ name: "Kazakhstan", code: "KZ", dialCode: "+7" },
	{ name: "Kenya", code: "KE", dialCode: "+254" },
	{ name: "Kiribati", code: "KI", dialCode: "+686" },
	{ name: "Kosovo", code: "XK", dialCode: "+383" },
	{ name: "Kuwait", code: "KW", dialCode: "+965" },
	{ name: "Kyrgyzstan", code: "KG", dialCode: "+996" },
	{ name: "Laos", code: "LA", dialCode: "+856" },
	{ name: "Latvia", code: "LV", dialCode: "+371" },
	{ name: "Lebanon", code: "LB", dialCode: "+961" },
	{ name: "Lesotho", code: "LS", dialCode: "+266" },
	{ name: "Liberia", code: "LR", dialCode: "+231" },
	{ name: "Libya", code: "LY", dialCode: "+218" },
	{ name: "Liechtenstein", code: "LI", dialCode: "+423" },
	{ name: "Lithuania", code: "LT", dialCode: "+370" },
	{ name: "Luxembourg", code: "LU", dialCode: "+352" },
	{ name: "Macau", code: "MO", dialCode: "+853" },
	{ name: "Macedonia", code: "MK", dialCode: "+389" },
	{ name: "Madagascar", code: "MG", dialCode: "+261" },
	{ name: "Malawi", code: "MW", dialCode: "+265" },
	{ name: "Malaysia", code: "MY", dialCode: "+60" },
	{ name: "Maldives", code: "MV", dialCode: "+960" },
	{ name: "Mali", code: "ML", dialCode: "+223" },
	{ name: "Malta", code: "MT", dialCode: "+356" },
	{ name: "Marshall Islands", code: "MH", dialCode: "+692" },
	{ name: "Mauritania", code: "MR", dialCode: "+222" },
	{ name: "Mauritius", code: "MU", dialCode: "+230" },
	{ name: "Mayotte", code: "YT", dialCode: "+262" },
	{ name: "Mexico", code: "MX", dialCode: "+52" },
	{ name: "Micronesia", code: "FM", dialCode: "+691" },
	{ name: "Moldova", code: "MD", dialCode: "+373" },
	{ name: "Monaco", code: "MC", dialCode: "+377" },
	{ name: "Mongolia", code: "MN", dialCode: "+976" },
	{ name: "Montenegro", code: "ME", dialCode: "+382" },
	{ name: "Montserrat", code: "MS", dialCode: "+1664" },
	{ name: "Morocco", code: "MA", dialCode: "+212" },
	{ name: "Mozambique", code: "MZ", dialCode: "+258" },
	{ name: "Myanmar", code: "MM", dialCode: "+95" },
	{ name: "Namibia", code: "NA", dialCode: "+264" },
	{ name: "Nauru", code: "NR", dialCode: "+674" },
	{ name: "Nepal", code: "NP", dialCode: "+977" },
	{ name: "Netherlands", code: "NL", dialCode: "+31" },
	{ name: "Netherlands Antilles", code: "AN", dialCode: "+599" },
	{ name: "New Caledonia", code: "NC", dialCode: "+687" },
	{ name: "New Zealand", code: "NZ", dialCode: "+64" },
	{ name: "Nicaragua", code: "NI", dialCode: "+505" },
	{ name: "Niger", code: "NE", dialCode: "+227" },
	{ name: "Nigeria", code: "NG", dialCode: "+234" },
	{ name: "Niue", code: "NU", dialCode: "+683" },
	{ name: "North Korea", code: "KP", dialCode: "+850" },
	{ name: "Northern Mariana Islands", code: "MP", dialCode: "+1670" },
	{ name: "Norway", code: "NO", dialCode: "+47" },
	{ name: "Oman", code: "OM", dialCode: "+968" },
	{ name: "Pakistan", code: "PK", dialCode: "+92" },
	{ name: "Palau", code: "PW", dialCode: "+680" },
	{ name: "Palestine", code: "PS", dialCode: "+970" },
	{ name: "Panama", code: "PA", dialCode: "+507" },
	{ name: "Papua New Guinea", code: "PG", dialCode: "+675" },
	{ name: "Paraguay", code: "PY", dialCode: "+595" },
	{ name: "Peru", code: "PE", dialCode: "+51" },
	{ name: "Philippines", code: "PH", dialCode: "+63" },
	{ name: "Pitcairn", code: "PN", dialCode: "+64" },
	{ name: "Poland", code: "PL", dialCode: "+48" },
	{ name: "Portugal", code: "PT", dialCode: "+351" },
	{ name: "Puerto Rico", code: "PR", dialCode: "+1939" },
	{ name: "Qatar", code: "QA", dialCode: "+974" },
	{ name: "Republic of the Congo", code: "CG", dialCode: "+242" },
	{ name: "Reunion", code: "RE", dialCode: "+262" },
	{ name: "Romania", code: "RO", dialCode: "+40" },
	{ name: "Russia", code: "RU", dialCode: "+7" },
	{ name: "Rwanda", code: "RW", dialCode: "+250" },
	{ name: "Saint Barthelemy", code: "BL", dialCode: "+590" },
	{ name: "Saint Helena", code: "SH", dialCode: "+290" },
	{ name: "Saint Kitts and Nevis", code: "KN", dialCode: "+1869" },
	{ name: "Saint Lucia", code: "LC", dialCode: "+1758" },
	{ name: "Saint Martin", code: "MF", dialCode: "+590" },
	{ name: "Saint Pierre and Miquelon", code: "PM", dialCode: "+508" },
	{ name: "Saint Vincent and the Grenadines", code: "VC", dialCode: "+1784" },
	{ name: "Samoa", code: "WS", dialCode: "+685" },
	{ name: "San Marino", code: "SM", dialCode: "+378" },
	{ name: "Sao Tome and Principe", code: "ST", dialCode: "+239" },
	{ name: "Saudi Arabia", code: "SA", dialCode: "+966" },
	{ name: "Senegal", code: "SN", dialCode: "+221" },
	{ name: "Serbia", code: "RS", dialCode: "+381" },
	{ name: "Seychelles", code: "SC", dialCode: "+248" },
	{ name: "Sierra Leone", code: "SL", dialCode: "+232" },
	{ name: "Singapore", code: "SG", dialCode: "+65" },
	{ name: "Sint Maarten", code: "SX", dialCode: "+1721" },
	{ name: "Slovakia", code: "SK", dialCode: "+421" },
	{ name: "Slovenia", code: "SI", dialCode: "+386" },
	{ name: "Solomon Islands", code: "SB", dialCode: "+677" },
	{ name: "Somalia", code: "SO", dialCode: "+252" },
	{ name: "South Africa", code: "ZA", dialCode: "+27" },
	{ name: "South Korea", code: "KR", dialCode: "+82" },
	{ name: "South Sudan", code: "SS", dialCode: "+211" },
	{ name: "Spain", code: "ES", dialCode: "+34" },
	{ name: "Sri Lanka", code: "LK", dialCode: "+94" },
	{ name: "Sudan", code: "SD", dialCode: "+249" },
	{ name: "Suriname", code: "SR", dialCode: "+597" },
	{ name: "Svalbard and Jan Mayen", code: "SJ", dialCode: "+47" },
	{ name: "Swaziland", code: "SZ", dialCode: "+268" },
	{ name: "Sweden", code: "SE", dialCode: "+46" },
	{ name: "Switzerland", code: "CH", dialCode: "+41" },
	{ name: "Syria", code: "SY", dialCode: "+963" },
	{ name: "Taiwan", code: "TW", dialCode: "+886" },
	{ name: "Tajikistan", code: "TJ", dialCode: "+992" },
	{ name: "Tanzania", code: "TZ", dialCode: "+255" },
	{ name: "Thailand", code: "TH", dialCode: "+66" },
	{ name: "Togo", code: "TG", dialCode: "+228" },
	{ name: "Tokelau", code: "TK", dialCode: "+690" },
	{ name: "Tonga", code: "TO", dialCode: "+676" },
	{ name: "Trinidad and Tobago", code: "TT", dialCode: "+1868" },
	{ name: "Tunisia", code: "TN", dialCode: "+216" },
	{ name: "Turkey", code: "TR", dialCode: "+90" },
	{ name: "Turkmenistan", code: "TM", dialCode: "+993" },
	{ name: "Turks and Caicos Islands", code: "TC", dialCode: "+1649" },
	{ name: "Tuvalu", code: "TV", dialCode: "+688" },
	{ name: "U.S. Virgin Islands", code: "VI", dialCode: "+1340" },
	{ name: "Uganda", code: "UG", dialCode: "+256" },
	{ name: "Ukraine", code: "UA", dialCode: "+380" },
	{ name: "United Arab Emirates", code: "AE", dialCode: "+971" },
	{ name: "United Kingdom", code: "GB", dialCode: "+44" },
	{ name: "United States", code: "US", dialCode: "+1" },
	{ name: "Uruguay", code: "UY", dialCode: "+598" },
	{ name: "Uzbekistan", code: "UZ", dialCode: "+998" },
	{ name: "Vanuatu", code: "VU", dialCode: "+678" },
	{ name: "Vatican", code: "VA", dialCode: "+379" },
	{ name: "Venezuela", code: "VE", dialCode: "+58" },
	{ name: "Vietnam", code: "VN", dialCode: "+84" },
	{ name: "Wallis and Futuna", code: "WF", dialCode: "+681" },
	{ name: "Western Sahara", code: "EH", dialCode: "+212" },
	{ name: "Yemen", code: "YE", dialCode: "+967" },
	{ name: "Zambia", code: "ZM", dialCode: "+260" },
	{ name: "Zimbabwe", code: "ZW", dialCode: "+263" },
];

interface SignUpFormProps {
	className?: string;
	signInUrl: string;
}

export function SignUpForm({ className = "", signInUrl }: SignUpFormProps) {
	const { isLoaded, signUp, initSSO, identifierAvailability } = useSignUp();
	const { deployment } = useDeployment();
	const countryDropdownRef = useRef<HTMLDivElement>(null);
	const [formData, setFormData] = useState<SignUpParams>({
		first_name: "",
		last_name: "",
		email: "",
		password: "",
		username: "",
		phone_number: "",
	});
	const [errors, setErrors] = useState<Record<string, string>>({});
	const [isSubmitting, setIsSubmitting] = useState(false);
	const [isCountryDropdownOpen, setIsCountryDropdownOpen] = useState(false);
	const [selectedCountry, setSelectedCountry] = useState(
		countries.find((c) => c.code === "US") || countries[0],
	);
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

	const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		let { name, value } = e.target;
		if (name === "phone_number") {
			value = value.replace(/[^0-9-]/g, "");
		}
		else if (name === "email") {
			value = value.toLowerCase();
		}
		setFormData((prev) => ({ ...prev, [name]: value }));
		setErrors((prev) => ({ ...prev, [name]: "" }));
	};

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		if (!isLoaded || isSubmitting) return;

		const newErrors: Record<string, string> = {};

		const namePattern = /^[a-zA-Z]{3,30}$/;
		const usernamePattern = /^[a-zA-Z][a-zA-Z0-9_.]{2,29}$/;
		const emailPattern = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
		const phonePattern = /^\d{7,15}$/;
		const passwordPattern = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,125}$/;

		if (authSettings?.username.enabled && formData.username) {
			const { data } = await identifierAvailability(formData.username, "username");
			if (data.exists) {
				newErrors.username = "Username is not available";
			}
		}

		if (authSettings?.email_address.enabled && formData.email) {
			const { data } = await identifierAvailability(formData.email, "email");
			if (data.exists) {
				newErrors.email = "Email address is not available";
			}
		}

		if (authSettings?.first_name.required && !formData.first_name) {
			newErrors.first_name = "First name is required";
		} else if (
			authSettings?.first_name.enabled &&
			formData.first_name &&
			!namePattern.test(formData.first_name)
		) {
			newErrors.first_name = "Invalid name";
		}

		if (authSettings?.last_name.required && !formData.last_name) {
			newErrors.last_name = "Last name is required";
		} else if (
			authSettings?.last_name.enabled &&
			formData.last_name &&
			!namePattern.test(formData.last_name)
		) {
			newErrors.last_name = "Invalid last name";
		}

		if (authSettings?.username.required && !formData.username) {
			newErrors.username = "Username is required";
		} else if (
			authSettings?.username.enabled &&
			formData.username &&
			!usernamePattern.test(formData.username)
		) {
			newErrors.username = "Username must be 3-20 characters";
		}

		if (authSettings?.email_address.required && !formData.email) {
			newErrors.email = "Email address is required";
		} else if (
			authSettings?.email_address.enabled &&
			formData.email &&
			!emailPattern.test(formData.email)
		) {
			newErrors.email = "Invalid email address";
		}

		if (authSettings?.phone_number.required && !formData.phone_number) {
			newErrors.phone_number = "Phone number is required";
		} else if (
			authSettings?.phone_number.enabled &&
			formData.phone_number &&
			!phonePattern.test(formData.phone_number)
		) {
			newErrors.phone_number = "Phone number must contain 7-15 digits";
		}

		if (authSettings?.password.required && !formData.password) {
			newErrors.password = "Password is required";
		} else if (
			authSettings?.password.enabled &&
			formData.password &&
			!passwordPattern.test(formData.password)
		) {
			newErrors.password =
				"Password must be 8-125 characters and include uppercase, lowercase, number, and special character";
		}

		setErrors(newErrors);

		if (Object.keys(newErrors).length > 0) {
			return;
		}

		setIsSubmitting(true);
		try {
			await signUp(formData);
		} catch (err) {
			setErrors({ submit: (err as Error).message });
		} finally {
			setIsSubmitting(false);
		}
	};


	const handleSSOSignUp = async (provider: SSOProvider) => {
		if (!isLoaded || isSubmitting) return;

		setIsSubmitting(true);
		try {
			const { data } = await initSSO(provider);
			window.location.href = data.oauth_url;
		} catch (err) {
			setErrors({ submit: (err as Error).message });
		} finally {
			setIsSubmitting(false);
		}
	};

	const enabledSSOProviders =
		deployment?.social_connections.filter((conn) => conn.enabled) || [];

	const authSettings = deployment?.auth_settings;

	const filteredCountries = countries.filter(
		(country) =>
			country.name.toLowerCase().includes(countrySearch.toLowerCase()) ||
			country.dialCode.includes(countrySearch),
	);

	const isBothNamesEnabled = Boolean(
		authSettings?.first_name.enabled && authSettings?.last_name.enabled,
	);

	return (
		<TypographyProvider>
			<Container className={className}>
				<Header>
					<Title>Create your account</Title>
					<Subtitle>Welcome! Please fill in the details to get started.</Subtitle>
				</Header>

				{enabledSSOProviders.length > 0 && (
					<>
						<SSOButtonsContainer>
							{enabledSSOProviders.map((conn) => {
								const provider = conn.provider.toLowerCase() as SSOProvider;
								if (!ssoConfig[provider]) return null;
								const numProviders = enabledSSOProviders.length;

								return (
									<SSOButton
										key={conn.id}
										onClick={() => handleSSOSignUp(provider)}
										type="button"
									>
										{ssoConfig[provider].icon}
										{numProviders > 1
											? ssoConfig[provider].shortLabel
											: ssoConfig[provider].fullLabel}
									</SSOButton>
								);
							})}
						</SSOButtonsContainer>

						<Divider>
							<DividerText>or</DividerText>
						</Divider>
					</>
				)}

				<Form onSubmit={handleSubmit} noValidate>
					{(authSettings?.first_name.enabled ||
						authSettings?.last_name.enabled) && (
							<NameFields $isBothEnabled={isBothNamesEnabled}>
								{authSettings?.first_name.enabled && (
									<FormGroup>
										<Label htmlFor="first_name">
											First name
											{authSettings.first_name.required && (
												<RequiredAsterisk>*</RequiredAsterisk>
											)}
										</Label>
										<Input
											type="text"
											id="first_name"
											name="first_name"
											required
											minLength={3}
											maxLength={30}
											value={formData.first_name}
											onChange={handleInputChange}
											placeholder="First name"
											aria-invalid={!!errors.first_name}
											pattern="^[a-zA-Z]{3,30}$"
										/>
										{errors.first_name && (
											<ErrorMessage>{errors.first_name}</ErrorMessage>
										)}
									</FormGroup>
								)}
								{authSettings?.last_name.enabled && (
									<FormGroup>
										<Label htmlFor="last_name">
											Last name
											{authSettings.last_name.required && (
												<RequiredAsterisk>*</RequiredAsterisk>
											)}
										</Label>
										<Input
											type="text"
											id="last_name"
											name="last_name"
											required
											minLength={3}
											maxLength={30}
											value={formData.last_name}
											onChange={handleInputChange}
											placeholder="Last name"
											aria-invalid={!!errors.last_name}
											pattern="^[a-zA-Z]{3,30}$"
										/>
										{errors.last_name && (
											<ErrorMessage>{errors.last_name}</ErrorMessage>
										)}
									</FormGroup>
								)}
							</NameFields>
						)}

					{authSettings?.username.enabled && (
						<FormGroup>
							<Label htmlFor="username">
								Username
								{authSettings.username.required && (
									<RequiredAsterisk>*</RequiredAsterisk>
								)}
							</Label>
							<Input
								type="text"
								id="username"
								name="username"
								minLength={3}
								maxLength={20}
								value={formData.username}
								onChange={handleInputChange}
								placeholder="Choose a username"
								aria-invalid={!!errors.username}
								required
								pattern="^[a-zA-Z][a-zA-Z0-9_.]{2,29}$"
							/>

							{errors.username && <ErrorMessage>{errors.username}</ErrorMessage>}
						</FormGroup>
					)}

					{authSettings?.email_address.enabled && (
						<FormGroup>
							<Label htmlFor="email">
								Email address
								{authSettings.email_address.required && (
									<RequiredAsterisk>*</RequiredAsterisk>
								)}
							</Label>
							<Input
								type="email"
								id="email"
								name="email"
								maxLength={320}
								value={formData.email}
								onChange={handleInputChange}
								placeholder="Enter your email address"
								aria-invalid={!!errors.email}
								required
								pattern="^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$"
							/>
							{errors.email && <ErrorMessage>{errors.email}</ErrorMessage>}
						</FormGroup>
					)}

					{authSettings?.phone_number.enabled && (
						<FormGroup>
							<Label htmlFor="phone_number">
								Phone number
								{authSettings.phone_number.required && (
									<RequiredAsterisk>*</RequiredAsterisk>
								)}
							</Label>
							<PhoneInputGroup>
								<CountryCodeSelect ref={countryDropdownRef}>
									<CountryCodeButton
										type="button"
										onClick={() => setIsCountryDropdownOpen((prev) => !prev)}
									>
										<img
											src={`https://flagcdn.com/16x12/${selectedCountry.code.toLocaleLowerCase()}.png`}
											srcSet={`https://flagcdn.com/32x24/${selectedCountry.code.toLocaleLowerCase()}.png 2x, https://flagcdn.com/48x36/${selectedCountry.code.toLocaleLowerCase()}.png 3x`}
											alt={selectedCountry.name}
										/>
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
													<img
														src={`https://flagcdn.com/16x12/${country.code.toLocaleLowerCase()}.png`}
														srcSet={`https://flagcdn.com/32x24/${country.code.toLocaleLowerCase()}.png 2x, https://flagcdn.com/48x36/${country.code.toLocaleLowerCase()}.png 3x`}
														alt={country.name}
													/>
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
									id="phone_number"
									name="phone_number"
									required
									minLength={7}
									maxLength={15}
									ref={phoneNumberInputRef}
									value={formData.phone_number}
									onChange={handleInputChange}
									placeholder="Phone number"
									aria-invalid={!!errors.phone_number}
									pattern="^\d{7,15}$"
								/>
							</PhoneInputGroup>
							{errors.phone_number && (
								<ErrorMessage>{errors.phone_number}</ErrorMessage>
							)}
						</FormGroup>
					)}

					{authSettings?.password.enabled && (
						<FormGroup>
							<Label htmlFor="password">
								Password
								{authSettings.password.required && (
									<RequiredAsterisk>*</RequiredAsterisk>
								)}
							</Label>
							<PasswordGroup>
								<Input
									type="password"
									id="password"
									name="password"
									value={formData.password}
									onChange={handleInputChange}
									placeholder="Enter your password"
									aria-invalid={!!errors.password}
									required
									minLength={8}
									maxLength={128}
									pattern="^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,125}$"
								/>
							</PasswordGroup>
							{errors.password && <ErrorMessage>{errors.password}</ErrorMessage>}
						</FormGroup>
					)}

					{errors.submit && <ErrorMessage>{errors.submit}</ErrorMessage>}

					<SubmitButton type="submit" disabled={isSubmitting || !isLoaded}>
						{isSubmitting ? "Creating account..." : "Continue"}
					</SubmitButton>
				</Form>

				<Footer>
					Already have an account? <Link href={signInUrl}>Sign in</Link>
				</Footer>
			</Container>
		</TypographyProvider>
	);
}
