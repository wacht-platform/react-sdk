import styled from "styled-components";

export const DefaultStylesProvider = styled.div`
  /* Colors - Light Mode */
  --color-background: #ffffff;
  --color-foreground: #111827;
  --color-secondary-text: #6b7280;
  --color-muted: #64748b;
  --color-border: #e5e7eb;
  --color-border-subtle: #f3f4f6;
  --color-input-background: #ffffff;
  --color-input-border: #e2e8f0;
  --color-input-focus-border: #a5b4fc;
  --color-primary: #6366f1;
  --color-primary-hover: #4f46e5;
  --color-primary-background: rgba(99, 102, 241, 0.08);
  --color-primary-border: #e5e7ff;
  --color-primary-shadow: rgba(99, 102, 241, 0.15);
  --color-background-hover: #f8fafb;
  --color-background-subtle: #f9fafb;
  --color-border-hover: #d1d5db;
  --color-text: #1e293b;
  --color-error: #ef4444;
  --color-error-background: rgba(239, 68, 68, 0.1);
  --color-error-border: rgba(239, 68, 68, 0.2);
  --color-warning: #854d0e;
  --color-warning-background: #fef9c3;
  --color-warning-border: #fef08a;
  --color-warning-text: #92400e;
  --color-success: #166534;
  --color-success-background: #dcfce7;
  --color-success-border: rgba(34, 197, 94, 0.3);
  --color-success-text: #065f46;
  --color-info: #3b82f6;
  --color-info-background: #dbeafe;
  --color-info-border: rgba(59, 130, 246, 0.3);
  --color-info-text: #1e40af;
  --color-placeholder: #9ca3af;
  --color-text-disabled: #d1d5db;
  --color-background-disabled: #f3f4f6;
  --color-secondary: #6b7280;
  --color-secondary-hover: #4b5563;
  --color-primary-gradient: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%);
  --color-divider: #e5e7eb;
  --color-scrollbar-track: #f5f5f5;
  --color-scrollbar-thumb: #d1d5db;
  --color-scrollbar-thumb-hover: #9ca3af;
  --color-shadow: rgba(0, 0, 0, 0.08);
  --color-shadow-light: rgba(0, 0, 0, 0.05);
  --color-shadow-medium: rgba(0, 0, 0, 0.15);
  --color-success-shadow: rgba(34, 197, 94, 0.2);
  --color-success-background-light: rgba(34, 197, 94, 0.05);
  --color-button-ripple: rgba(255, 255, 255, 0.2);
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
    --color-border: #242424;
    --color-border-subtle: #333333;
    --color-input-background: #2a2a2a;
    --color-input-border: #525252;
    --color-input-focus-border: rgba(99, 102, 241, 0.5);
    --color-primary: #6366f1;
    --color-primary-hover: #4f46e5;
    --color-primary-background: rgba(99, 102, 241, 0.1);
    --color-primary-border: rgba(99, 102, 241, 0.3);
    --color-primary-shadow: rgba(99, 102, 241, 0.2);
    --color-background-hover: #262626;
    --color-background-subtle: #232323;
    --color-border-hover: #525252;
    --color-text: #f5f5f5;
    --color-error: #f87171;
    --color-error-background: rgba(248, 113, 113, 0.1);
    --color-error-border: rgba(248, 113, 113, 0.3);
    --color-warning: #fbbf24;
    --color-warning-background: rgba(251, 191, 36, 0.1);
    --color-warning-border: rgba(251, 191, 36, 0.3);
    --color-warning-text: #fbbf24;
    --color-success: #22c55e;
    --color-success-background: rgba(34, 197, 94, 0.1);
    --color-success-border: rgba(34, 197, 94, 0.3);
    --color-success-text: #22c55e;
    --color-info: #60a5fa;
    --color-info-background: rgba(96, 165, 250, 0.1);
    --color-info-border: rgba(96, 165, 250, 0.3);
    --color-info-text: #60a5fa;
    --color-placeholder: #6b7280;
    --color-text-disabled: #525252;
    --color-background-disabled: #2a2a2a;
    --color-secondary: #9ca3af;
    --color-secondary-hover: #d1d5db;
    --color-primary-gradient: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%);
    --color-divider: #2a2a2a;
    --color-scrollbar-track: #2a2a2a;
    --color-scrollbar-thumb: #525252;
    --color-scrollbar-thumb-hover: #737373;
    --color-shadow: rgba(0, 0, 0, 0.1);
    --color-shadow-light: rgba(0, 0, 0, 0.08);
    --color-shadow-medium: rgba(0, 0, 0, 0.2);
    --color-success-shadow: rgba(34, 197, 94, 0.3);
    --color-success-background-light: rgba(34, 197, 94, 0.08);
    --color-button-ripple: rgba(255, 255, 255, 0.15);
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
