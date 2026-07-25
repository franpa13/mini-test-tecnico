"use client";

import { useState } from "react";

import { Spinner } from "@/shared/components/spinner";
import { ErrorState } from "@/shared/components/error-state";
import { ApiError } from "@/shared/types/api-error";
import { getGithubProfile } from "../services/get-github-profile";
import { getGithubRepos } from "../services/get-github-repos";
import { getGithubActivity } from "../services/get-github-activity";
import type { GithubActivity, GithubProfile, GithubRepo } from "../types/github-profile";
import { ProfileSearchBanner } from "./profile-search-banner";
import { ProfileCard } from "./profile-card";
import { ActivityList } from "./activity-list";
import { RepoList } from "./repo-list";

interface ProfileExplorerProps {
  initialProfile: GithubProfile;
  initialRepos: GithubRepo[];
  initialActivity: GithubActivity[];
}

export function ProfileExplorer({ initialProfile, initialRepos, initialActivity }: ProfileExplorerProps) {
  const [profile, setProfile] = useState(initialProfile);
  const [repos, setRepos] = useState(initialRepos);
  const [activity, setActivity] = useState(initialActivity);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSearch(username: string) {
    setIsLoading(true);
    setError(null);

    try {
      const [nextProfile, nextRepos, nextActivity] = await Promise.all([
        getGithubProfile(username),
        getGithubRepos(username),
        getGithubActivity(username),
      ]);
      setProfile(nextProfile);
      setRepos(nextRepos);
      setActivity(nextActivity);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "No se pudo completar la búsqueda");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <ProfileSearchBanner onSearch={handleSearch} isLoading={isLoading} />

      {isLoading && (
        <div className="flex justify-center py-10">
          <Spinner className="size-6 text-muted-foreground" />
        </div>
      )}

      {!isLoading && error && <ErrorState message={error} />}

      {!isLoading && !error && (
        <>
          <ProfileCard profile={profile} />
          <ActivityList activity={activity} />
          <RepoList repos={repos} />
        </>
      )}
    </div>
  );
}
