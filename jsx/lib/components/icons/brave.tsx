export const BraveIcon = (props: React.SVGProps<SVGSVGElement>) => (
	<svg
		width="20"
		height="20"
		viewBox="0 0 24 24"
		xmlns="http://www.w3.org/2000/svg"
		{...props}
		role="img"
		aria-label="Brave"
	>
		<defs>
			<linearGradient id="brave-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
				<stop offset="0%" stopColor="#FB542B" />
				<stop offset="50%" stopColor="#FF6B35" />
				<stop offset="100%" stopColor="#FF4500" />
			</linearGradient>
		</defs>
		<circle cx="12" cy="12" r="11" fill="url(#brave-gradient)" />
		<path d="M12 3.5l1.5 2h2.5l-.8 3 1.3 2.5-2.5.8v2.7l-2-.7-2 .7v-2.7l-2.5-.8L8.8 8.5 8 5.5h2.5L12 3.5z" fill="#fff" />
		<path d="M12 6.5c-.8 0-1.5.7-1.5 1.5v3c0 .8.7 1.5 1.5 1.5s1.5-.7 1.5-1.5V8c0-.8-.7-1.5-1.5-1.5z" fill="url(#brave-gradient)" />
		<circle cx="12" cy="16" r="1" fill="url(#brave-gradient)" />
	</svg>
);