import { useDeployment } from '@/hooks';
import React from 'react';

export interface NavigationProps {
  to: string;
  replace?: boolean;
  options?: Record<string, unknown>;
  children?: React.ReactNode;
  [key: string]: any;
}


export const NavigationLink: React.FC<NavigationProps> = ({
  to,
  replace = false,
  options = {},
  children,
  ...props
}) => {
  const { platformNav } = useDeployment();

  return (
    <a href={to} onClick={() => platformNav(to, { replace, ...options })} {...props}>
      {children}
    </a>
  );
};
