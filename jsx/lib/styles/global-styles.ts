import { createGlobalStyle } from "styled-components";
import tokensCss from "./tokens.css?inline";
import componentsCss from "./components.css?inline";

/**
 * The Wacht SDK style layer — the 23 `--wa-*` token contract plus the `.w-*`
 * component classes — injected once at runtime via styled-components. Bundled
 * inline, so a host app never imports any CSS: rendering an SDK component is
 * enough. styled-components handles SSR collection and dedup.
 */
export const WachtGlobalStyles = createGlobalStyle`
  ${tokensCss}
  ${componentsCss}
`;
