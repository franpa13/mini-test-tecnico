import { apiFetch } from "@/shared/lib/api";
import type { GithubRepo } from "../types/github-profile";

export function getGithubRepos(username: string): Promise<GithubRepo[]> {
  return apiFetch<GithubRepo[]>(`/user/${encodeURIComponent(username)}/repos`);
}
