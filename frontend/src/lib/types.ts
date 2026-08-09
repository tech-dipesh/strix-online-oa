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
