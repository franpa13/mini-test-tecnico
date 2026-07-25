import { apiFetch } from "@/shared/lib/api";
import type { GithubProfile } from "../types/github-profile";

export function getGithubProfile(username: string): Promise<GithubProfile> {
  return apiFetch<GithubProfile>(`/user/${encodeURIComponent(username)}`);
}
