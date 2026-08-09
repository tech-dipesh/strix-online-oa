export interface UserPublic {
  id: string;
  name: string;
  email: string;
  created_at: string;
}

export interface TokenPair {
  access_token: string;
  refresh_token: string;
  token_type: string;
}

export interface ProjectPublic {
  id: string;
  name: string;
  description: string;
  owner_id: string;
  created_at: string;
}

export interface FilePublic {
  id: string;
  project_id: string;
  path: string;
  size: number;
  created_at: string;
}

export interface FileContent {
  id: string;
  path: string;
  content: string;
}

export interface AIProviderPublic {
  id: string;
  label: string;
  base_url: string;
  api_key_masked: string;
  model_name: string;
  updated_at: string;
}

export type ReviewType = "security" | "performance" | "quality";
export type Severity = "critical" | "high" | "medium" | "low";

export interface ReviewIssue {
  title: string;
  description: string;
  severity: Severity;
  file_path: string;
  line: number | null;
}

export interface ReviewPublic {
  id: string;
  project_id: string;
  review_type: ReviewType;
  reviewed_paths: string[];
  summary: string;
  issues: ReviewIssue[];
  recommendations: string[];
  created_at: string;
}

export interface ChatSessionPublic {
  id: string;
  project_id: string;
  title: string;
  created_at: string;
}

export interface ChatMessagePublic {
  id: string;
  session_id: string;
  role: "user" | "assistant";
  content: string;
  referenced_paths: string[];
  created_at: string;
}

export interface DiffReviewPublic {
  id: string;
  project_id: string;
  file_path_a: string;
  file_path_b: string;
  diff_text: string;
  summary: string;
  issues: ReviewIssue[];
  recommendations: string[];
  created_at: string;
}

export type DocType = "readme" | "setup" | "api";

export interface GeneratedDocPublic {
  id: string;
  project_id: string;
  doc_type: DocType;
  content: string;
  created_at: string;
}
