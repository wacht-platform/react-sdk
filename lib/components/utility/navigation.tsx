import { useDeployment } from '@/hooks';
import React from 'react';

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
  const context = useDeployment();

  if (!context || context.loading) {
    return <span {...props}>{children}</span>;
  }

  const { platformLink: PlatformLink } = context;

  return (
    <PlatformLink href={to} replace={replace} {...props}>
      {children}
    </PlatformLink>
  );
};
