import { createContext, useContext } from "react";

export type Screen =
  | "email"
  | "phone"
  | "social"
  | "password"
  | "2fa"
  | "2fa/authenticator"
  | "2fa/backup_code"
  | "2fa/phone"
  | "profile-details"
  | "active-sessions"
  | null;

interface ScreenContextType {
  screen: Screen;
  setScreen: (screen: Screen) => void;
  toast: (message: string, level?: "info" | "error") => void;
}

export const ScreenContext = createContext<ScreenContextType | undefined>(
  undefined
);

export const useScreenContext = () => {
  const context = useContext(ScreenContext);
  if (!context) {
    throw new Error("useScreenContext must be used within a ScreenProvider");
  }
  return context;
};
