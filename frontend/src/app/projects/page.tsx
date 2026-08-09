"use client";

import { SubmitEvent, useState } from "react";

import Link from "next/link";
import { Plus, Trash2, FolderGit2, Settings } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Field } from "@/components/ui/field";
import { useLogout } from "@/hooks/use-auth";
import { useCreateProject, useDeleteProject, useProjects } from "@/hooks/use-projects";
import { useRequireAuth } from "@/hooks/use-require-auth";
import { projectSchema } from "@/lib/schemas";

export default function ProjectsPage() {
  const isReady = useRequireAuth();
  const { data: projects, isLoading } = useProjects();
  const createProject = useCreateProject();
  const deleteProject = useDeleteProject();
  const logout = useLogout();

  const [showForm, setShowForm] = useState(false);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [nameError, setNameError] = useState<string | null>(null);

  if (!isReady) return null;

  const handleCreate = (event: SubmitEvent<HTMLFormElement>) => {
    event.preventDefault();
    const result = projectSchema.safeParse({ name, description });
    if (!result.success) {
      setNameError(result.error.issues[0]?.message ?? "Invalid input");
      return;
    }
    setNameError(null);
    createProject.mutate(result.data, {
      onSuccess: () => {
        setName("");
        setDescription("");
        setShowForm(false);
      },
    });
  };

  return (
    <main className="mx-auto min-h-screen max-w-4xl px-6 py-10">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-foreground">Your projects</h1>
          <p className="text-sm text-muted">Upload code and get AI-powered reviews.</p>
        </div>
        <div className="flex gap-3">
          <Link href="/settings">
            <Button variant="ghost">
              <span className="flex items-center gap-2">
                <Settings size={16} /> AI provider
              </span>
            </Button>
          </Link>
          <Button variant="ghost" onClick={() => setShowForm((v) => !v)}>
            <span className="flex items-center gap-2">
              <Plus size={16} /> New project
            </span>
          </Button>
          <Button variant="ghost" onClick={logout}>
            Log out
          </Button>
        </div>
      </div>

      {showForm && (
        <form
          onSubmit={handleCreate}
          className="mb-8 flex flex-col gap-4 rounded-lg border border-border bg-surface/40 p-6"
        >
          <Field
            id="project-name"
            label="Project name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            error={nameError ?? undefined}
          />
          <Field
            id="project-description"
            label="Description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
          <div className="flex gap-3">
            <Button type="submit" disabled={createProject.isPending}>
              {createProject.isPending ? "Creating..." : "Create project"}
            </Button>
            <Button type="button" variant="ghost" onClick={() => setShowForm(false)}>
              Cancel
            </Button>
          </div>
        </form>
      )}

      {isLoading && <p className="text-sm text-muted">Loading projects...</p>}

      {!isLoading && projects?.length === 0 && (
        <div className="rounded-lg border border-dashed border-border p-10 text-center text-sm text-muted">
          No projects yet. Create one to get started.
        </div>
      )}

      <ul className="flex flex-col gap-3">
        {projects?.map((project) => (
          <li
            key={project.id}
            className="flex items-center justify-between rounded-lg border border-border bg-surface/40 p-4"
          >
            <Link href={`/projects/${project.id}`} className="flex flex-1 items-center gap-3">
              <FolderGit2 size={18} className="text-accent" />
              <div>
                <p className="text-sm font-medium text-foreground">{project.name}</p>
                {project.description && (
                  <p className="text-xs text-muted">{project.description}</p>
                )}
              </div>
            </Link>
            <button
              onClick={() => deleteProject.mutate(project.id)}
              className="cursor-pointer text-muted hover:text-red-400"
              aria-label={`Delete ${project.name}`}
            >
              <Trash2 size={16} />
            </button>
          </li>
        ))}
      </ul>
    </main>
  );
}
