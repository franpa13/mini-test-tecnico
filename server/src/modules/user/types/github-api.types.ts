export interface RawGithubUser {
  login: string;
  name: string | null;
  avatar_url: string;
  bio: string | null;
  company: string | null;
  location: string | null;
  blog: string | null;
  email: string | null;
  hireable: boolean | null;
  twitter_username: string | null;
  public_repos: number;
  public_gists: number;
  followers: number;
  following: number;
  html_url: string;
  created_at: string;
  updated_at: string;
}

export interface RawGithubRepo {
  name: string;
  full_name: string;
  description: string | null;
  html_url: string;
  language: string | null;
  stargazers_count: number;
  watchers_count: number;
  forks_count: number;
  open_issues_count: number;
  topics: string[];
  fork: boolean;
  archived: boolean;
  homepage: string | null;
  size: number;
  license: { name: string; spdx_id: string } | null;
  created_at: string;
  updated_at: string;
  pushed_at: string | null;
}

export interface RawGithubEvent {
  id: string;
  type: string | null;
  repo: {
    name: string;
  };
  payload: {
    action?: string;
    ref?: string;
    ref_type?: string;
    issue?: { title: string };
    pull_request?: { title: string };
    release?: { tag_name: string };
  };
  created_at: string | null;
}
