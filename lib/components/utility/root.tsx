import styled from "styled-components";

export const DefaultStylesProvider = styled.div`
  /* Colors - Light Mode */
  --color-background: #f8f9fa;
  --color-foreground: #111827;
  --color-secondary-text: #6b7280;
  --color-muted: #64748b;
  --color-border: #e5e7eb;
  --color-input-background: #f8f9fa;
  --color-input-border: #e2e8f0;
  --color-input-focus-border: #a5b4fc;
  --color-primary: #6366f1;
  --color-primary-hover: #4f46e5;
  --color-primary-background: rgba(99, 102, 241, 0.1);
  --color-primary-shadow: rgba(99, 102, 241, 0.1);
  --color-background-hover: #f1f5f9;
  --color-border-hover: #e2e8f0;
  --color-text: #1e293b;
  --color-error: #ef4444;
  --color-error-background: rgba(239, 68, 68, 0.1);
  --color-warning: #854d0e;
  --color-warning-background: #fef9c3;
  --color-warning-border: #fef08a;
  --color-success: #166534;
  --color-success-background: #dcfce7;
  --color-divider: #e5e7eb;
  --color-scrollbar-track: #f1f1f1;
  --color-scrollbar-thumb: #888;
  --color-scrollbar-thumb-hover: #555;
  --color-shadow: rgba(0, 0, 0, 0.1);
  --color-dialog-backdrop: rgba(0, 0, 0, 0.86);

  /* Spacing */
  --space-2xs: 2px;
  --space-xs: 4px;
  --space-sm: 8px;
  --space-md: 12px;
  --space-lg: 16px;
  --space-xl: 20px;
  --space-2xl: 24px;
  --space-3xl: 28px;

  /* Font Sizes */
  --font-2xs: 11px;
  --font-xs: 13px;
  --font-sm: 14px;
  --font-md: 16px;
  --font-lg: 18px;
  --font-xl: 20px;

  /* Border Radius */
  --radius-sm: 4px;
  --radius-md: 8px;
  --radius-lg: 12px;

  .dark & {
    /* Colors - Dark Mode */
    --color-background: #1a1a1a;
    --color-foreground: #f5f5f5;
    --color-secondary-text: #a3a3a3;
    --color-muted: #737373;
    --color-border: #2a2a2a;
    --color-input-background: #2a2a2a;
    --color-input-border: #404040;
    --color-input-focus-border: rgba(99, 102, 241, 0.5);
    --color-primary: #6366f1;
    --color-primary-hover: #4f46e5;
    --color-primary-background: rgba(99, 102, 241, 0.1);
    --color-primary-shadow: rgba(99, 102, 241, 0.2);
    --color-background-hover: #262626;
    --color-border-hover: #404040;
    --color-text: #f5f5f5;
    --color-error: #f87171;
    --color-error-background: rgba(248, 113, 113, 0.1);
    --color-warning: #fbbf24;
    --color-warning-background: rgba(251, 191, 36, 0.1);
    --color-warning-border: rgba(251, 191, 36, 0.3);
    --color-success: #22c55e;
    --color-success-background: rgba(34, 197, 94, 0.1);
    --color-divider: #2a2a2a;
    --color-scrollbar-track: #2a2a2a;
    --color-scrollbar-thumb: #525252;
    --color-scrollbar-thumb-hover: #737373;
    --color-shadow: rgba(0, 0, 0, 0.1);
    --color-dialog-backdrop: rgba(0, 0, 0, 0.9);
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
