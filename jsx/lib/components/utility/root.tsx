import { useContext, type CSSProperties, type ComponentPropsWithoutRef } from "react";
import styled from "styled-components";
import { DeploymentContext } from "@/context/deployment-provider";

type ThemeVars = Record<`--${string}`, string>;
type UITokenOverrides = {
  space_unit?: string;
  space_0u?: string;
  space_1u?: string;
  space_2u?: string;
  space_3u?: string;
  space_4u?: string;
  space_5u?: string;
  space_6u?: string;
  space_7u?: string;
  space_8u?: string;
  space_10u?: string;
  space_12u?: string;
  space_14u?: string;
  space_16u?: string;
  space_24u?: string;
  font_size_2xs?: string;
  font_size_xs?: string;
  font_size_sm?: string;
  font_size_md?: string;
  font_size_lg?: string;
  font_size_xl?: string;
  font_size_2xl?: string;
  font_size_3xl?: string;
  size_8u?: string;
  size_10u?: string;
  size_12u?: string;
  size_18u?: string;
  size_20u?: string;
  size_24u?: string;
  size_32u?: string;
  size_36u?: string;
  size_40u?: string;
  size_45u?: string;
  size_50u?: string;
  shadow_sm?: string;
  shadow_md?: string;
  shadow_lg?: string;
  shadow_xl?: string;
  ring_primary?: string;
  card?: string;
  card_foreground?: string;
  popover?: string;
  popover_foreground?: string;
  primary_foreground?: string;
  secondary?: string;
  secondary_foreground?: string;
  accent?: string;
  accent_foreground?: string;
  ring?: string;
  foreground?: string;
  secondary_text?: string;
  muted?: string;
  border?: string;
  border_hover?: string;
  divider?: string;
  input_background?: string;
  input_border?: string;
  input_focus_border?: string;
  background_subtle?: string;
  background_hover?: string;
  primary_hover?: string;
  error?: string;
  error_background?: string;
  error_border?: string;
  warning?: string;
  warning_background?: string;
  warning_border?: string;
  warning_text?: string;
  success?: string;
  success_background?: string;
  success_border?: string;
  info?: string;
  info_background?: string;
  radius_md?: string;
  radius_lg?: string;
  radius_xl?: string;
  radius_2xl?: string;
  radius_2xs?: string;
  radius_xs?: string;
  radius_full?: string;
  border_width_thin?: string;
  border_width_regular?: string;
  letter_spacing_tight?: string;
};

type ThemeSettings = {
  primary_color?: string | null;
  background_color?: string | null;
  text_color?: string | null;
  token_overrides?: UITokenOverrides | null;
};

type DefaultStylesProviderProps = ComponentPropsWithoutRef<"div">;

const StyledDefaultStylesProvider = styled.div`
  display: contents;

  /* Colors - Light Mode */
  --color-background: var(--theme-light-background, oklch(1 0 0));
  --color-foreground: var(--theme-light-foreground, oklch(0.145 0 0));
  --color-card: var(--theme-light-card, oklch(1 0 0));
  --color-card-foreground: var(--theme-light-card-foreground, oklch(0.145 0 0));
  --color-popover: var(--theme-light-popover, oklch(1 0 0));
  --color-popover-foreground: var(--theme-light-popover-foreground, oklch(0.145 0 0));
  --color-foreground-inverse: #ffffff;
  --color-secondary-text: var(--theme-light-secondary-text, oklch(0.556 0 0));
  --color-secondary: var(--theme-light-secondary, oklch(0.97 0 0));
  --color-secondary-foreground: var(--theme-light-secondary-foreground, oklch(0.205 0 0));
  --color-muted: var(--theme-light-muted, oklch(0.556 0 0));
  --color-accent: var(--theme-light-accent, oklch(0.97 0 0));
  --color-accent-foreground: var(--theme-light-accent-foreground, oklch(0.205 0 0));
  --color-border: var(--theme-light-border, oklch(0.922 0 0));
  --color-input-background: var(--theme-light-input-background, oklch(1 0 0));
  --color-input-border: var(--theme-light-input-border, oklch(0.922 0 0));
  --color-input-focus-border: var(--theme-light-input-focus-border, oklch(0.708 0 0));
  --color-primary: var(--theme-light-primary, oklch(0.205 0 0));
  --color-primary-foreground: var(--theme-light-primary-foreground, oklch(0.985 0 0));
  --color-primary-hover: var(--theme-light-primary-hover, oklch(0.205 0 0));
  --color-primary-background: color-mix(
    in srgb,
    var(--theme-light-primary, oklch(0.205 0 0)) 8%,
    transparent
  );
  --color-primary-shadow: color-mix(
    in srgb,
    var(--theme-light-primary, oklch(0.205 0 0)) 15%,
    transparent
  );
  --color-background-hover: var(--theme-light-background-hover, oklch(0.97 0 0));
  --color-background-subtle: var(--theme-light-background-subtle, oklch(0.97 0 0));
  --color-border-hover: var(--theme-light-border-hover, oklch(0.922 0 0));
  --color-text: var(--theme-light-text, oklch(0.145 0 0));
  --color-error: var(--theme-light-error, #ef4444);
  --color-error-background: var(--theme-light-error-background, rgba(239, 68, 68, 0.1));
  --color-error-border: var(--theme-light-error-border, rgba(239, 68, 68, 0.2));
  --color-warning: var(--theme-light-warning, #854d0e);
  --color-warning-background: var(--theme-light-warning-background, #fef9c3);
  --color-warning-border: var(--theme-light-warning-border, #fef08a);
  --color-warning-text: var(--theme-light-warning-text, #92400e);
  --color-success: var(--theme-light-success, #166534);
  --color-success-background: var(--theme-light-success-background, #dcfce7);
  --color-success-border: var(--theme-light-success-border, rgba(34, 197, 94, 0.3));
  --color-info: var(--theme-light-info, #3b82f6);
  --color-info-background: var(--theme-light-info-background, #dbeafe);
  --color-divider: var(--theme-light-divider, oklch(0.922 0 0));
  --color-ring: var(--theme-light-ring, oklch(0.708 0 0));
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
  --space-0u: 0px;
  --space-1u: var(--theme-global-space-1u, calc(var(--theme-global-space-unit, 2px) * 1));
  --space-2u: var(--theme-global-space-2u, calc(var(--theme-global-space-unit, 2px) * 2));
  --space-3u: var(--theme-global-space-3u, calc(var(--theme-global-space-unit, 2px) * 3));
  --space-4u: var(--theme-global-space-4u, calc(var(--theme-global-space-unit, 2px) * 4));
  --space-5u: var(--theme-global-space-5u, calc(var(--theme-global-space-unit, 2px) * 5));
  --space-6u: var(--theme-global-space-6u, calc(var(--theme-global-space-unit, 2px) * 6));
  --space-7u: var(--theme-global-space-7u, calc(var(--theme-global-space-unit, 2px) * 7));
  --space-8u: var(--theme-global-space-8u, calc(var(--theme-global-space-unit, 2px) * 8));
  --space-10u: var(--theme-global-space-10u, calc(var(--theme-global-space-unit, 2px) * 10));
  --space-12u: var(--theme-global-space-12u, calc(var(--theme-global-space-unit, 2px) * 12));
  --space-14u: var(--theme-global-space-14u, calc(var(--theme-global-space-unit, 2px) * 14));
  --space-16u: var(--theme-global-space-16u, calc(var(--theme-global-space-unit, 2px) * 16));
  --space-24u: var(--theme-global-space-24u, calc(var(--theme-global-space-unit, 2px) * 24));
  --font-size-2xs: var(--theme-global-font-size-2xs, 10px);
  --font-size-xs: var(--theme-global-font-size-xs, 11px);
  --font-size-sm: var(--theme-global-font-size-sm, 12px);
  --font-size-md: var(--theme-global-font-size-md, 13px);
  --font-size-lg: var(--theme-global-font-size-lg, 14px);
  --font-size-xl: var(--theme-global-font-size-xl, 16px);
  --font-size-2xl: var(--theme-global-font-size-2xl, 18px);
  --font-size-3xl: var(--theme-global-font-size-3xl, 20px);

  /* Border Radius */
  --radius-2xs: var(--theme-global-radius-2xs, 4px);
  --radius-xs: var(--theme-global-radius-xs, 6px);
  --radius-md: var(--theme-global-radius-md, 8px);
  --radius-lg: var(--theme-global-radius-lg, 12px);
  --radius-xl: var(--theme-global-radius-xl, 16px);
  --radius-2xl: var(--theme-global-radius-2xl, 20px);
  --radius-full: var(--theme-global-radius-full, 9999px);

  /* Border Width */
  --border-width-thin: var(--theme-global-border-width-thin, 0.5px);
  --border-width-regular: var(--theme-global-border-width-regular, 2px);

  /* Common Sizes */
  --size-8u: var(--theme-global-size-8u, 16px);
  --size-10u: var(--theme-global-size-10u, 20px);
  --size-12u: var(--theme-global-size-12u, 24px);
  --size-18u: var(--theme-global-size-18u, 36px);
  --size-20u: var(--theme-global-size-20u, 40px);
  --size-24u: var(--theme-global-size-24u, 48px);
  --size-32u: var(--theme-global-size-32u, 64px);
  --size-36u: var(--theme-global-size-36u, 72px);
  --size-40u: var(--theme-global-size-40u, 80px);
  --size-45u: var(--theme-global-size-45u, 90px);
  --size-50u: var(--theme-global-size-50u, 100px);

  /* Shadows */
  --shadow-sm: var(--theme-global-shadow-sm, 0 1px 2px var(--color-shadow-light));
  --shadow-md: var(--theme-global-shadow-md, 0 2px 8px var(--color-shadow));
  --shadow-lg: var(--theme-global-shadow-lg, 0 8px 24px var(--color-shadow));
  --shadow-xl: var(--theme-global-shadow-xl, 0 16px 40px var(--color-shadow-medium));
  --shadow-success: 0 2px 8px var(--color-success-shadow);
  --ring-primary: var(
    --theme-global-ring-primary,
    0 0 0 3px color-mix(in srgb, var(--color-ring) 35%, transparent)
  );

  /* Letter Spacing */
  --letter-spacing-tight: var(--theme-global-letter-spacing-tight, 0.5px);

  .dark & {

    /* Colors - Dark Mode */
    --color-background: var(--theme-dark-background, oklch(0.205 0 0));
    --color-foreground: var(--theme-dark-foreground, oklch(0.985 0 0));
    --color-card: var(--theme-dark-card, oklch(0.24 0 0));
    --color-card-foreground: var(--theme-dark-card-foreground, oklch(0.985 0 0));
    --color-popover: var(--theme-dark-popover, oklch(0.24 0 0));
    --color-popover-foreground: var(--theme-dark-popover-foreground, oklch(0.985 0 0));
    --color-foreground-inverse: #ffffff;
    --color-secondary-text: var(--theme-dark-secondary-text, oklch(0.708 0 0));
    --color-secondary: var(--theme-dark-secondary, oklch(0.28 0 0));
    --color-secondary-foreground: var(--theme-dark-secondary-foreground, oklch(0.985 0 0));
    --color-muted: var(--theme-dark-muted, oklch(0.708 0 0));
    --color-accent: var(--theme-dark-accent, oklch(0.371 0 0));
    --color-accent-foreground: var(--theme-dark-accent-foreground, oklch(0.985 0 0));
    --color-border: var(--theme-dark-border, oklch(1 0 0 / 10%));
  --color-input-background: var(--theme-dark-input-background, oklch(0.24 0 0));
  --color-input-border: var(--theme-dark-input-border, oklch(1 0 0 / 15%));
  --color-input-focus-border: var(--theme-dark-input-focus-border, oklch(0.556 0 0));
    --color-primary: var(--theme-dark-primary, oklch(0.87 0 0));
    --color-primary-foreground: var(--theme-dark-primary-foreground, oklch(0.205 0 0));
    --color-primary-hover: var(--theme-dark-primary-hover, oklch(0.87 0 0));
    --color-primary-background: color-mix(
      in srgb,
      var(--theme-dark-primary, oklch(0.87 0 0)) 10%,
      transparent
    );
    --color-primary-shadow: color-mix(
      in srgb,
      var(--theme-dark-primary, oklch(0.87 0 0)) 20%,
      transparent
    );
    --color-background-hover: var(--theme-dark-background-hover, oklch(0.28 0 0));
    --color-background-subtle: var(--theme-dark-background-subtle, oklch(0.24 0 0));
    --color-border-hover: var(--theme-dark-border-hover, oklch(1 0 0 / 15%));
    --color-text: var(--theme-dark-text, oklch(0.985 0 0));
    --color-error: var(--theme-dark-error, #f87171);
    --color-error-background: var(--theme-dark-error-background, rgba(248, 113, 113, 0.1));
    --color-error-border: var(--theme-dark-error-border, rgba(248, 113, 113, 0.3));
    --color-warning: var(--theme-dark-warning, #fbbf24);
    --color-warning-background: var(--theme-dark-warning-background, rgba(251, 191, 36, 0.1));
    --color-warning-border: var(--theme-dark-warning-border, rgba(251, 191, 36, 0.3));
    --color-warning-text: var(--theme-dark-warning-text, #fbbf24);
    --color-success: var(--theme-dark-success, #22c55e);
    --color-success-background: var(--theme-dark-success-background, rgba(34, 197, 94, 0.1));
    --color-success-border: var(--theme-dark-success-border, rgba(34, 197, 94, 0.3));
    --color-info: var(--theme-dark-info, #60a5fa);
    --color-info-background: var(--theme-dark-info-background, rgba(96, 165, 250, 0.1));
    --color-divider: var(--theme-dark-divider, oklch(1 0 0 / 10%));
    --color-ring: var(--theme-dark-ring, oklch(0.556 0 0));
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
      width: var(--space-2u);
    }
    ::-webkit-scrollbar-track {
      background: var(--color-scrollbar-track);
    }

    ::-webkit-scrollbar-thumb {
      background: var(--color-scrollbar-thumb);
      border-radius: var(--radius-2xs);
    }

    ::-webkit-scrollbar-thumb:hover {
      background: var(--color-scrollbar-thumb-hover);
    }
  }
`;

function isSafeColor(value?: string | null): value is string {
  if (!value) {
    return false;
  }

  return /^(#([\da-f]{3,8})|rgba?\([^)]*\)|hsla?\([^)]*\)|oklch\([^)]*\)|oklab\([^)]*\)|lch\([^)]*\)|lab\([^)]*\)|transparent|currentColor)$/i.test(
    value.trim(),
  );
}

function isSafeLength(value?: string | null): value is string {
  if (!value) {
    return false;
  }

  return /^(0|\d+(\.\d+)?(px|rem|em|%)?)$/i.test(value.trim());
}

function isSafeCssVarValue(value?: string | null): value is string {
  if (!value) {
    return false;
  }

  const normalized = value.trim();
  if (!normalized || /[;{}<>]/.test(normalized)) {
    return false;
  }

  return /^(?!.*(?:url|expression)\s*\()[\w\s.,%#()\-+/]*$/i.test(normalized);
}

function applyColorVar(style: ThemeVars, key: string, value?: string | null) {
  if (isSafeColor(value)) {
    style[key as `--${string}`] = value.trim();
  }
}

function applyLengthVar(style: ThemeVars, key: string, value?: string | null) {
  if (isSafeLength(value)) {
    style[key as `--${string}`] = value.trim();
  }
}

function applyCssVar(style: ThemeVars, key: string, value?: string | null) {
  if (isSafeCssVarValue(value)) {
    style[key as `--${string}`] = value.trim();
  }
}

function resolveGlobalTokenOverrides(
  lightModeSettings?: ThemeSettings | null,
  darkModeSettings?: ThemeSettings | null,
) {
  return {
    ...(darkModeSettings?.token_overrides ?? {}),
    ...(lightModeSettings?.token_overrides ?? {}),
  };
}

function applyGlobalThemeStyle(style: ThemeVars, tokenOverrides?: UITokenOverrides) {
  if (!tokenOverrides) {
    return;
  }

  applyLengthVar(style, "--theme-global-space-unit", tokenOverrides.space_unit);
  applyLengthVar(style, "--theme-global-space-0u", tokenOverrides.space_0u);
  applyLengthVar(style, "--theme-global-space-1u", tokenOverrides.space_1u);
  applyLengthVar(style, "--theme-global-space-2u", tokenOverrides.space_2u);
  applyLengthVar(style, "--theme-global-space-3u", tokenOverrides.space_3u);
  applyLengthVar(style, "--theme-global-space-4u", tokenOverrides.space_4u);
  applyLengthVar(style, "--theme-global-space-5u", tokenOverrides.space_5u);
  applyLengthVar(style, "--theme-global-space-6u", tokenOverrides.space_6u);
  applyLengthVar(style, "--theme-global-space-7u", tokenOverrides.space_7u);
  applyLengthVar(style, "--theme-global-space-8u", tokenOverrides.space_8u);
  applyLengthVar(style, "--theme-global-space-10u", tokenOverrides.space_10u);
  applyLengthVar(style, "--theme-global-space-12u", tokenOverrides.space_12u);
  applyLengthVar(style, "--theme-global-space-14u", tokenOverrides.space_14u);
  applyLengthVar(style, "--theme-global-space-16u", tokenOverrides.space_16u);
  applyLengthVar(style, "--theme-global-space-24u", tokenOverrides.space_24u);
  applyLengthVar(style, "--theme-global-font-size-2xs", tokenOverrides.font_size_2xs);
  applyLengthVar(style, "--theme-global-font-size-xs", tokenOverrides.font_size_xs);
  applyLengthVar(style, "--theme-global-font-size-sm", tokenOverrides.font_size_sm);
  applyLengthVar(style, "--theme-global-font-size-md", tokenOverrides.font_size_md);
  applyLengthVar(style, "--theme-global-font-size-lg", tokenOverrides.font_size_lg);
  applyLengthVar(style, "--theme-global-font-size-xl", tokenOverrides.font_size_xl);
  applyLengthVar(style, "--theme-global-font-size-2xl", tokenOverrides.font_size_2xl);
  applyLengthVar(style, "--theme-global-font-size-3xl", tokenOverrides.font_size_3xl);
  applyLengthVar(style, "--theme-global-radius-2xs", tokenOverrides.radius_2xs);
  applyLengthVar(style, "--theme-global-radius-xs", tokenOverrides.radius_xs);
  applyLengthVar(style, "--theme-global-radius-md", tokenOverrides.radius_md);
  applyLengthVar(style, "--theme-global-radius-lg", tokenOverrides.radius_lg);
  applyLengthVar(style, "--theme-global-radius-xl", tokenOverrides.radius_xl);
  applyLengthVar(style, "--theme-global-radius-2xl", tokenOverrides.radius_2xl);
  applyLengthVar(style, "--theme-global-radius-full", tokenOverrides.radius_full);
  applyLengthVar(style, "--theme-global-border-width-thin", tokenOverrides.border_width_thin);
  applyLengthVar(
    style,
    "--theme-global-border-width-regular",
    tokenOverrides.border_width_regular,
  );
  applyLengthVar(style, "--theme-global-size-8u", tokenOverrides.size_8u);
  applyLengthVar(style, "--theme-global-size-10u", tokenOverrides.size_10u);
  applyLengthVar(style, "--theme-global-size-12u", tokenOverrides.size_12u);
  applyLengthVar(style, "--theme-global-size-18u", tokenOverrides.size_18u);
  applyLengthVar(style, "--theme-global-size-20u", tokenOverrides.size_20u);
  applyLengthVar(style, "--theme-global-size-24u", tokenOverrides.size_24u);
  applyLengthVar(style, "--theme-global-size-32u", tokenOverrides.size_32u);
  applyLengthVar(style, "--theme-global-size-36u", tokenOverrides.size_36u);
  applyLengthVar(style, "--theme-global-size-40u", tokenOverrides.size_40u);
  applyLengthVar(style, "--theme-global-size-45u", tokenOverrides.size_45u);
  applyLengthVar(style, "--theme-global-size-50u", tokenOverrides.size_50u);
  applyCssVar(style, "--theme-global-shadow-sm", tokenOverrides.shadow_sm);
  applyCssVar(style, "--theme-global-shadow-md", tokenOverrides.shadow_md);
  applyCssVar(style, "--theme-global-shadow-lg", tokenOverrides.shadow_lg);
  applyCssVar(style, "--theme-global-shadow-xl", tokenOverrides.shadow_xl);
  applyCssVar(style, "--theme-global-ring-primary", tokenOverrides.ring_primary);
  applyLengthVar(
    style,
    "--theme-global-letter-spacing-tight",
    tokenOverrides.letter_spacing_tight,
  );
}

function applyThemeStyle(
  style: ThemeVars,
  mode: "light" | "dark",
  settings?: ThemeSettings | null,
) {
  if (!settings) {
    return;
  }

  const prefix = `--theme-${mode}`;
  const tokenOverrides = settings.token_overrides ?? undefined;
  const textColor = settings.text_color;

  applyColorVar(style, `${prefix}-primary`, settings.primary_color);
  applyColorVar(style, `${prefix}-background`, settings.background_color);
  applyColorVar(style, `${prefix}-text`, textColor);
  applyColorVar(
    style,
    `${prefix}-foreground`,
    tokenOverrides?.foreground ?? textColor,
  );
  applyColorVar(style, `${prefix}-card`, tokenOverrides?.card);
  applyColorVar(style, `${prefix}-card-foreground`, tokenOverrides?.card_foreground);
  applyColorVar(style, `${prefix}-popover`, tokenOverrides?.popover);
  applyColorVar(
    style,
    `${prefix}-popover-foreground`,
    tokenOverrides?.popover_foreground,
  );
  applyColorVar(style, `${prefix}-secondary-text`, tokenOverrides?.secondary_text);
  applyColorVar(style, `${prefix}-secondary`, tokenOverrides?.secondary);
  applyColorVar(
    style,
    `${prefix}-secondary-foreground`,
    tokenOverrides?.secondary_foreground,
  );
  applyColorVar(style, `${prefix}-muted`, tokenOverrides?.muted);
  applyColorVar(style, `${prefix}-accent`, tokenOverrides?.accent);
  applyColorVar(
    style,
    `${prefix}-accent-foreground`,
    tokenOverrides?.accent_foreground,
  );
  applyColorVar(style, `${prefix}-border`, tokenOverrides?.border);
  applyColorVar(style, `${prefix}-border-hover`, tokenOverrides?.border_hover);
  applyColorVar(style, `${prefix}-divider`, tokenOverrides?.divider);
  applyColorVar(style, `${prefix}-input-background`, tokenOverrides?.input_background);
  applyColorVar(style, `${prefix}-input-border`, tokenOverrides?.input_border);
  applyColorVar(style, `${prefix}-input-focus-border`, tokenOverrides?.input_focus_border);
  applyColorVar(style, `${prefix}-background-subtle`, tokenOverrides?.background_subtle);
  applyColorVar(style, `${prefix}-background-hover`, tokenOverrides?.background_hover);
  applyColorVar(
    style,
    `${prefix}-primary-foreground`,
    tokenOverrides?.primary_foreground,
  );
  applyColorVar(style, `${prefix}-primary-hover`, tokenOverrides?.primary_hover);
  applyColorVar(style, `${prefix}-error`, tokenOverrides?.error);
  applyColorVar(style, `${prefix}-error-background`, tokenOverrides?.error_background);
  applyColorVar(style, `${prefix}-error-border`, tokenOverrides?.error_border);
  applyColorVar(style, `${prefix}-warning`, tokenOverrides?.warning);
  applyColorVar(style, `${prefix}-warning-background`, tokenOverrides?.warning_background);
  applyColorVar(style, `${prefix}-warning-border`, tokenOverrides?.warning_border);
  applyColorVar(style, `${prefix}-warning-text`, tokenOverrides?.warning_text);
  applyColorVar(style, `${prefix}-success`, tokenOverrides?.success);
  applyColorVar(style, `${prefix}-success-background`, tokenOverrides?.success_background);
  applyColorVar(style, `${prefix}-success-border`, tokenOverrides?.success_border);
  applyColorVar(style, `${prefix}-info`, tokenOverrides?.info);
  applyColorVar(style, `${prefix}-info-background`, tokenOverrides?.info_background);
  applyColorVar(style, `${prefix}-ring`, tokenOverrides?.ring);
}

function buildThemeStyle(
  lightModeSettings?: ThemeSettings | null,
  darkModeSettings?: ThemeSettings | null,
): ThemeVars {
  const style: ThemeVars = {};
  applyGlobalThemeStyle(
    style,
    resolveGlobalTokenOverrides(lightModeSettings, darkModeSettings),
  );
  applyThemeStyle(style, "light", lightModeSettings);
  applyThemeStyle(style, "dark", darkModeSettings);
  return style;
}

export function DefaultStylesProvider({
  children,
  style,
  ...props
}: DefaultStylesProviderProps) {
  const deploymentContext = useContext(DeploymentContext);
  const themeStyle = buildThemeStyle(
    deploymentContext?.deployment?.ui_settings?.light_mode_settings,
    deploymentContext?.deployment?.ui_settings?.dark_mode_settings,
  );

  return (
    <StyledDefaultStylesProvider
      {...props}
      style={{ ...themeStyle, ...(style as CSSProperties | undefined) }}
    >
      {children}
    </StyledDefaultStylesProvider>
  );
}
