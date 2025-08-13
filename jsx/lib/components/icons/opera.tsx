export const OperaIcon = (props: React.SVGProps<SVGSVGElement>) => (
	<svg
		width="20"
		height="20"
		viewBox="0 0 24 24"
		xmlns="http://www.w3.org/2000/svg"
		{...props}
		role="img"
		aria-label="Opera"
	>
		<defs>
			<linearGradient id="opera-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
				<stop offset="0%" stopColor="#FF1B2D" />
				<stop offset="50%" stopColor="#CC0000" />
				<stop offset="100%" stopColor="#A02128" />
			</linearGradient>
		</defs>
		<circle cx="12" cy="12" r="11" fill="url(#opera-gradient)" />
		<ellipse cx="12" cy="12" rx="6.5" ry="8.5" fill="none" stroke="#fff" strokeWidth="1.2" opacity="0.9" />
		<ellipse cx="12" cy="12" rx="3.5" ry="5.5" fill="#fff" />
		<path d="M12 8.5c-1.4 0-2.5 1.6-2.5 3.5s1.1 3.5 2.5 3.5 2.5-1.6 2.5-3.5-1.1-3.5-2.5-3.5z" fill="url(#opera-gradient)" />
	</svg>
);