"use client";

import { useNavigation } from "@/hooks";
import { useEffect } from "react";

export const NavigateToSignIn = () => {
  const { navigateToSignIn } = useNavigation();

  useEffect(() => {
    navigateToSignIn();
  }, [navigateToSignIn]);

  return null;
};

export const NavigateToSignUp = () => {
  const { navigateToSignUp } = useNavigation();

  useEffect(() => {
    navigateToSignUp();
  }, [navigateToSignUp]);

  return null;
};
