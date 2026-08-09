"use client";

import Link from "next/link";
import {SubmitEvent, useState } from "react";
import { Button } from "@/components/ui/button";
import { Field } from "@/components/ui/field";
import { useLogin } from "@/hooks/use-auth";
import { loginSchema } from "@/lib/schemas";
import { ApiError } from "@/lib/api";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [serverError, setServerError] = useState<string | null>(null);
  const login = useLogin();

  const handleSubmit = (event: SubmitEvent<HTMLFormElement>) => {
    event.preventDefault();
    setServerError(null);

    const result = loginSchema.safeParse({ email, password });
    if (!result.success) {
      const errors: Record<string, string> = {};
      for (const issue of result.error.issues) {
        errors[String(issue.path[0])] = issue.message;
      }
      setFieldErrors(errors);
      return;
    }

    setFieldErrors({});
    login.mutate(result.data, {
      onError: (error) => {
        setServerError(error instanceof ApiError ? error.message : "Something went wrong");
      },
    });
  };

  return (
    <main className="flex min-h-screen items-center justify-center px-4">
      <div className="w-full max-w-sm rounded-lg border border-border bg-surface/40 p-8">
        <h1 className="mb-1 text-xl font-semibold text-foreground">Welcome back</h1>
        <p className="mb-6 text-sm text-muted">Log in to review your code.</p>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <Field
            id="email"
            label="Email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            error={fieldErrors.email}
          />
          <Field
            id="password"
            label="Password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            error={fieldErrors.password}
          />

          {serverError && <p className="text-sm text-red-400">{serverError}</p>}

          <Button type="submit" disabled={login.isPending}>
            {login.isPending ? "Logging in..." : "Log in"}
          </Button>
        </form>

        <p className="mt-6 text-sm text-muted">
          Don&apos;t have an account?{" "}
          <Link href="/register" className="text-accent hover:underline">
            Register
          </Link>
        </p>
      </div>
    </main>
  );
}
