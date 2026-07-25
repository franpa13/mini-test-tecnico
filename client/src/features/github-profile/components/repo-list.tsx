import { FolderGit2 } from "lucide-react";

import type { GithubRepo } from "../types/github-profile";
import { RepoCard } from "./repo-card";
import { SectionTitle } from "@/shared/components/section-title";


interface RepoListProps {
  repos: GithubRepo[];
}

export function RepoList({ repos }: RepoListProps) {
  if (repos.length === 0) {
    return <p className="text-sm text-muted-foreground">Este usuario no tiene repositorios públicos.</p>;
  }

  return (
    <div className="flex flex-col gap-3">
      <SectionTitle icon={FolderGit2}>Repositorios</SectionTitle>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {repos.map((repo) => (
          <RepoCard key={repo.fullName} repo={repo} />
        ))}
      </div>
    </div>
  );
}
