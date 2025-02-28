import React from 'react';

export interface NavigationProps {
  to: string;
  replace?: boolean;
  options?: Record<string, unknown>;
  navigate?: (to: string, options?: { replace?: boolean } & Record<string, unknown>) => void;
  children?: React.ReactNode;
  [key: string]: any;
}


export const NavigationLink: React.FC<NavigationProps> = ({
  to,
  replace = false,
  options = {},
  navigate: customNavigate,
  children,
  ...props
}) => {
  const handleNavigation = (e: React.MouseEvent) => {
    e.preventDefault();

    if (customNavigate) {
      customNavigate(to, { replace, ...options });
      return;
    }

    if (typeof window !== 'undefined' && (window as any).__NEXT_DATA__) {
      window.location.href = to;
      return;
    }

    if (replace) {
      window.history.replaceState({}, '', to);
    } else {
      window.history.pushState({}, '', to);
    }
    window.dispatchEvent(new PopStateEvent('popstate', { state: {} }));
  };

  return (
    <a href={to} onClick={handleNavigation} {...props}>
      {children}
    </a>
  );
};
