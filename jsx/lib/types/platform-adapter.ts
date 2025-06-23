export interface NavigateOptions {
  replace?: boolean;
  state?: any;
}

export interface PlatformAdapter {
  useNavigate(): ((to: string, options?: NavigateOptions) => void) | null;
}

export interface PlatformAdapterContextType {
  adapter: PlatformAdapter | null;
}
