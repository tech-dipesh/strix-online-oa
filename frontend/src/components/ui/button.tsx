import { ButtonHTMLAttributes } from "react";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "ghost" | "danger";
}

export function Button({ variant = "primary", className = "", ...props }: ButtonProps) {
  const base = "cursor-pointer rounded-md px-4 py-2 text-sm font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-50";

  const variants: Record<string, string> = {
    primary: "bg-accent text-slate-900 hover:bg-cyan-300",
    ghost: "bg-transparent text-foreground border border-border hover:bg-surface",
    danger: "bg-transparent text-red-400 border border-red-400/40 hover:bg-red-400/10",
  };

  return <button className={`${base} ${variants[variant]} ${className}`} {...props} />;
}
