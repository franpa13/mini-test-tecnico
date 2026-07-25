import { apiFetch } from "@/shared/lib/api";
import type { GithubActivity } from "../types/github-profile";

export function getGithubActivity(username: string): Promise<GithubActivity[]> {
  return apiFetch<GithubActivity[]>(`/user/${encodeURIComponent(username)}/activity`);
}
