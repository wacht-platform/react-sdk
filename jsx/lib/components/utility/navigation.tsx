import React, { useCallback } from "react";
import { useNavigation } from "@/hooks";

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
  const { navigate } = useNavigation();

  const handleNavigation = useCallback(
    (e: React.MouseEvent<HTMLAnchorElement>) => {
      e.preventDefault();
      navigate(to, { replace });
    },
    [to, replace, navigate]
  );

  return (
    <a href={to} onClick={handleNavigation} {...props}>
      {children}
    </a>
  );
};
