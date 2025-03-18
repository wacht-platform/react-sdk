interface LoaderProps {
	size?: number;
	color?: string;
	className?: string;
}

export const Loader: React.FC<LoaderProps> = ({
	size = 24,
	color = "currentColor",
	className = "",
}) => {
	return (
		<svg
			width={size}
			height={size}
			viewBox="0 0 24 24"
			fill="none"
			stroke={color}
			strokeWidth="2"
			strokeLinecap="round"
			strokeLinejoin="round"
			className={className}
			aria-label="Loading"
			role="img"
		>
			<title>Loading</title>
			<path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83" />
		</svg>
	);
};
