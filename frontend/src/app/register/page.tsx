"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, SubmitEvent } from "react";
import { Button } from "@/components/ui/button";
import { Field } from "@/components/ui/field";
import { useRegister } from "@/hooks/use-auth";
import { registerSchema } from "@/lib/schemas";
import { ApiError } from "@/lib/api";

export default function RegisterPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [serverError, setServerError] = useState<string | null>(null);
  const register = useRegister();

  const handleSubmit = (event: SubmitEvent<HTMLFormElement>) => {
    event.preventDefault();
    setServerError(null);

    const result = registerSchema.safeParse({ name, email, password });
    if (!result.success) {
      const errors: Record<string, string> = {};
      for (const issue of result.error.issues) {
        errors[String(issue.path[0])] = issue.message;
      }
      setFieldErrors(errors);
      return;
    }

    setFieldErrors({});
    register.mutate(result.data, {
      onSuccess: () => router.push("/login"),
      onError: (error) => {
        setServerError(error instanceof ApiError ? error.message : "Something went wrong");
      },
    });
  };

  return (
    <main className="flex min-h-screen items-center justify-center px-4">
      <div className="w-full max-w-sm rounded-lg border border-border bg-surface/40 p-8">
        <h1 className="mb-1 text-xl font-semibold text-foreground">Create your account</h1>
        <p className="mb-6 text-sm text-muted">Start reviewing your code with AI.</p>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <Field
            id="name"
            label="Name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            error={fieldErrors.name}
          />
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

          <Button type="submit" disabled={register.isPending}>
            {register.isPending ? "Creating account..." : "Create account"}
          </Button>
        </form>

        <p className="mt-6 text-sm text-muted">
          Already have an account?{" "}
          <Link href="/login" className="text-accent hover:underline">
            Log in
          </Link>
        </p>
      </div>
    </main>
  );
}
