"use client";

import Link from "next/link";
import { useState, SubmitEvent } from "react";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Field } from "@/components/ui/field";
import { useAIProvider, useSaveAIProvider } from "@/hooks/use-ai-provider";
import { useRequireAuth } from "@/hooks/use-require-auth";
import { aiProviderSchema } from "@/lib/schemas";
import { ApiError } from "@/lib/api";
import type { AIProviderPublic } from "@/lib/types";

const PRESETS = [
  { label: "OpenAI", base_url: "https://api.openai.com/v1", model_name: "gpt-4o-mini" },
  { label: "LM Studio", base_url: "http://localhost:1234/v1", model_name: "local-model" },
  { label: "Ollama", base_url: "http://localhost:11434/v1", model_name: "llama3" },
];

export default function SettingsPage() {
  const isReady = useRequireAuth();
  const { data: provider, isLoading } = useAIProvider();

  if (!isReady) return null;

  return (
    <main className="mx-auto min-h-screen max-w-lg px-6 py-10">
      <Link href="/projects" className="mb-6 flex items-center gap-2 text-sm text-muted hover:text-foreground">
        <ArrowLeft size={16} /> Back to projects
      </Link>

      <h1 className="mb-1 text-xl font-semibold text-foreground">AI provider</h1>
      <p className="mb-6 text-sm text-muted">
        Configure any OpenAI-compatible endpoint. Nothing is hardcoded.
      </p>

      {!isLoading && <ProviderForm provider={provider ?? null} />}
    </main>
  );
}

function ProviderForm({ provider }: { provider: AIProviderPublic | null }) {
  const saveProvider = useSaveAIProvider();

  const [label, setLabel] = useState(provider?.label ?? "");
  const [baseUrl, setBaseUrl] = useState(provider?.base_url ?? "");
  const [apiKey, setApiKey] = useState("");
  const [modelName, setModelName] = useState(provider?.model_name ?? "");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [serverError, setServerError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  const applyPreset = (preset: (typeof PRESETS)[number]) => {
    setLabel(preset.label);
    setBaseUrl(preset.base_url);
    setModelName(preset.model_name);
  };

  const handleSubmit = (event: SubmitEvent<HTMLFormElement>) => {
    event.preventDefault();
    setServerError(null);
    setSaved(false);

    const result = aiProviderSchema.safeParse({
      label,
      base_url: baseUrl,
      api_key: apiKey,
      model_name: modelName,
    });

    if (!result.success) {
      const fieldErrors: Record<string, string> = {};
      for (const issue of result.error.issues) {
        fieldErrors[String(issue.path[0])] = issue.message;
      }
      setErrors(fieldErrors);
      return;
    }

    setErrors({});
    saveProvider.mutate(result.data, {
      onSuccess: () => {
        setApiKey("");
        setSaved(true);
      },
      onError: (error) => {
        setServerError(error instanceof ApiError ? error.message : "Something went wrong");
      },
    });
  };

  return (
    <>
      <div className="mb-6 flex flex-wrap gap-2">
        {PRESETS.map((preset) => (
          <button
            key={preset.label}
            type="button"
            onClick={() => applyPreset(preset)}
            className="cursor-pointer rounded-full border border-border px-3 py-1 text-xs text-muted hover:border-accent hover:text-accent"
          >
            {preset.label}
          </button>
        ))}
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <Field
          id="label"
          label="Provider name"
          value={label}
          onChange={(e) => setLabel(e.target.value)}
          error={errors.label}
        />
        <Field
          id="base_url"
          label="Base URL"
          value={baseUrl}
          onChange={(e) => setBaseUrl(e.target.value)}
          error={errors.base_url}
        />
        <Field
          id="api_key"
          label={provider?.api_key_masked ? `API key (currently ${provider.api_key_masked})` : "API key"}
          type="password"
          value={apiKey}
          onChange={(e) => setApiKey(e.target.value)}
          placeholder={provider ? "Leave blank to keep the current key" : ""}
          error={errors.api_key}
        />
        <Field
          id="model_name"
          label="Model name"
          value={modelName}
          onChange={(e) => setModelName(e.target.value)}
          error={errors.model_name}
        />

        {serverError && <p className="text-sm text-red-400">{serverError}</p>}
        {saved && <p className="text-sm text-accent">Saved.</p>}

        <Button type="submit" disabled={saveProvider.isPending}>
          {saveProvider.isPending ? "Saving..." : "Save"}
        </Button>
      </form>
    </>
  );
}
