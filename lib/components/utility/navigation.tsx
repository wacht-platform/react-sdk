import React, { useCallback } from "react";

export interface NavigationProps {
  to: string;
  replace?: boolean;
  children?: React.ReactNode;
  [key: string]: any;
}

export const NavigationLink: React.FC<NavigationProps> = ({
  to,
  replace,
  children,
  ...props
}) => {
  const handleNavigation = useCallback(
    (e: React.MouseEvent<HTMLAnchorElement>) => {
      e.preventDefault();
      const searchParams = new URLSearchParams(window.location.search);
      let newUrl = new URL(to);
      searchParams.forEach((value, key) => {
        newUrl.searchParams.set(key, value);
      });

      if (replace) {
        window.history.replaceState({}, "", newUrl.toString());
      } else {
        window.history.pushState({}, "", newUrl.toString());
      }
      window.dispatchEvent(new PopStateEvent("popstate", { state: {} }));
    },
    [to, replace]
  );

  return (
    <a href={to} onClick={handleNavigation} {...props}>
      {children}
    </a>
  );
};
