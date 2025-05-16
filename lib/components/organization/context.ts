import { createContext, useContext } from "react";

export type Screen =
  | "general"
  | "members"
  | "domains"
  | "billing"
  | "security"
  | "roles"
  | "audit-logs"
  | null;

type ScreenContextType = {
  screen: Screen;
  setScreen: React.Dispatch<React.SetStateAction<Screen>>;
  toast: (message: string, level: "info" | "error") => void;
};

export const ScreenContext = createContext<ScreenContextType>({
  screen: null,
  setScreen: () => {},
  toast: (_message: string, _level: "info" | "error") => {},
});

export const useScreenContext = () => {
  const context = useContext(ScreenContext);
  if (!context) {
    throw new Error(
      "useScreenContext must be used within a ScreenContextProvider",
    );
  }
  return context;
};
