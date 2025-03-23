import styled from "styled-components";

export const DefaultStylesProvider = styled.div`
	/* Colors - Light Mode */
	--color-background: #ffffff;
	--color-foreground: #111827;
	--color-secondary-text: #6b7280;
	--color-muted: #64748b;
	--color-border: #e5e7eb;
	--color-input-background: #ffffff;
	--color-input-border: #d1d5db;
	--color-input-focus-border: #a5b4fc;
	--color-primary: #6366f1;
	--color-primary-hover: #4f46e5;
	--color-error: #ef4444;
	--color-divider: #e5e7eb;
	--color-scrollbar-track: #f1f1f1;
	--color-scrollbar-thumb: #888;
	--color-scrollbar-thumb-hover: #555;
	--color-shadow: rgba(0, 0, 0, 0.1);
	
	/* Spacing */
	--space-2xs: 4px;
	--space-xs: 8px;
	--space-sm: 12px;
	--space-md: 16px;
	--space-lg: 24px;
	--space-xl: 32px;
	--space-2xl: 40px;
	
	/* Font Sizes */
	--font-2xs: 12px;
	--font-xs: 14px;
	--font-sm: 16px;
	--font-md: 18px;
	--font-lg: 20px;
	--font-xl: 24px;
	
	/* Border Radius */
	--radius-sm: 4px;
	--radius-md: 8px;
	--radius-lg: 12px;

	.dark & {
		/* Colors - Dark Mode */
		--color-background: #2a2a2a;
		--color-foreground: #e6e9f0;
		--color-secondary-text: #b0b7c9;
		--color-muted: #9aa3b8;
		--color-border: #454b60;
		--color-input-background: #383c52;
		--color-input-border: #565c78;
		--color-input-focus-border: rgba(130, 150, 255, 0.4);
		--color-primary: #8b94ff;
		--color-primary-hover: #7a84ff;
		--color-error: #e67171;
		--color-divider: #454b60;
		--color-scrollbar-track: #353535;
		--color-scrollbar-thumb: #565c78;
		--color-scrollbar-thumb-hover: #686f8c;
		--color-shadow: rgba(0, 0, 0, 0.2);
	}
	
	* {
		box-sizing: border-box;
		font-family: Inter, system-ui, Avenir, Helvetica, Arial, sans-serif;
		scrollbar-width: thin;
		scrollbar-color: var(--color-scrollbar-thumb) var(--color-scrollbar-track);

		::-webkit-scrollbar {
			width: var(--space-xs);
		}
		::-webkit-scrollbar-track {
			background: var(--color-scrollbar-track);
		}

		::-webkit-scrollbar-thumb {
			background: var(--color-scrollbar-thumb);
			border-radius: var(--radius-sm);
		}

		::-webkit-scrollbar-thumb:hover {
			background: var(--color-scrollbar-thumb-hover);
		}
	}
`;
