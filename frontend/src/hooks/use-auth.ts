import { useMutation } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { apiRequest, clearTokens, setTokens } from "@/lib/api";
import type { LoginInput, RegisterInput } from "@/lib/schemas";
import type { TokenPair, UserPublic } from "@/lib/types";

export function useRegister() {
  return useMutation({
    mutationFn: (input: RegisterInput) =>
      apiRequest<UserPublic>("/auth/register", { method: "POST", body: input }),
  });
}

export function useLogin() {
  const router = useRouter();

  return useMutation({
    mutationFn: (input: LoginInput) =>
      apiRequest<TokenPair>("/auth/login", { method: "POST", body: input }),
    onSuccess: (data) => {
      setTokens(data.access_token, data.refresh_token);
      router.push("/projects");
    },
  });
}

export function useLogout() {
  const router = useRouter();

  return () => {
    clearTokens();
    router.push("/login");
  };
}
