import { useDeployment } from "./use-deployment";

type SignIn = {
  builder: (strategy: string) => Promise<string>;
};

type UseSignInReturnType = {
  isLoaded: boolean;
  signIn: SignIn;
};

export function useSignIn(): UseSignInReturnType {
  const { client, loading } = useDeployment();
  return {
    isLoaded: !loading,
    signIn: {
      builder: async (strategy: string) => {
        if (!client) throw new Error("Client not initialized");

        const response = await client(`/signin/${strategy}`);
        const json = await response.json();

        return json.token;
      },
    },
  };
}
