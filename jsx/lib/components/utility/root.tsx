import {
  createContext,
  memo,
  useContext,
  useEffect,
  useMemo,
  useState,
  type CSSProperties,
  type ComponentPropsWithoutRef,
} from "react";
import { WachtGlobalStyles } from "@/styles/global-styles";
import { DeploymentContext } from "@/context/deployment-provider";
import type { ThemeTokens } from "@/types";

type DefaultStylesProviderProps = ComponentPropsWithoutRef<"div">;

const DISPLAY_CONTENTS: CSSProperties = { display: "contents" };

/**
 * Turn deployment-configured `theme_tokens` into inline `--wa-ov-{mode}-<key>`
 * custom properties. tokens.css resolves each `--wa-*` token through these
 * (`var(--wa-ov-light-surface, <default>)` etc.), so setting them inline on the
 * `.wacht-root` element overrides the defaults per mode — no stylesheet
 * injection, no specificity/ordering games, and no CSS-injection surface
 * (values are applied as DOM style properties, never concatenated into CSS).
 */
function buildThemeOverrideVars(theme?: ThemeTokens | null): Record<string, string> {
  const vars: Record<string, string> = {};
  if (!theme) return vars;
  const apply = (
    mode: "light" | "dark",
    map?: Record<string, string | undefined> | null,
  ) => {
    if (!map) return;
    for (const key in map) {
      const value = map[key];
      if (typeof value === "string" && value.trim() !== "") {
        vars[`--wa-ov-${mode}-${key}`] = value;
      }
    }
  };
  apply("light", theme.light as Record<string, string | undefined> | undefined);
  apply("dark", theme.dark as Record<string, string | undefined> | undefined);
  return vars;
}

/**
 * True once an ancestor `DefaultStylesProvider` has rendered the global style
 * layer. Any nested provider — a portalled dropdown, a dialog, or one SDK
 * component composing another (ManageOrganization in its dialog, the switcher
 * inside ManageOrganization, …) — reads this and renders NO extra styles. Those
 * components still wrap themselves so they work standalone; nested, the wrap
 * collapses to just the token scope. Without this, re-running a ~60KB
 * createGlobalStyle per instance on every state change froze the page.
 */
const StylesInjected = createContext(false);

/**
 * The global style layer, rendered at most once per independent tree. `memo`
 * with no props renders it a single time and never re-runs, so a parent's
 * frequent re-renders never re-process the stylesheet.
 */
const GlobalStyleOnce = memo(function GlobalStyleOnce() {
  return <WachtGlobalStyles />;
});

/**
 * Scopes the Wacht SDK token contract (`--wa-*`, defined in tokens.css under
 * `.wacht-root`) to its subtree, and makes the `.w-*` component layer available.
 * Renders a `display: contents` wrapper so it adds no box of its own. Dark mode
 * is driven by a `.dark` class on any ancestor (or on this element).
 */
export function DefaultStylesProvider({
  children,
  className,
  style,
  ...props
}: DefaultStylesProviderProps) {
  const alreadyInjected = useContext(StylesInjected);
  const deploymentCtx = useContext(DeploymentContext);
  const themeTokens = deploymentCtx?.deployment?.ui_settings?.theme_tokens;
  const overrideVars = useMemo(
    () => buildThemeOverrideVars(themeTokens),
    [themeTokens],
  );
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  // The SDK is client-only (deployment config loads in an effect, and styled-
  // components throws under SSR). Render nothing until mounted on the client.
  if (!mounted) return null;

  const content = (
    <div
      {...props}
      className={className ? `wacht-root ${className}` : "wacht-root"}
      style={
        { ...DISPLAY_CONTENTS, ...overrideVars, ...style } as CSSProperties
      }
    >
      {children}
    </div>
  );

  // An ancestor already injected the style layer — just scope the tokens.
  if (alreadyInjected) return content;

  return (
    <StylesInjected.Provider value={true}>
      <GlobalStyleOnce />
      {content}
    </StylesInjected.Provider>
  );
}
