import { Circle, Eye, GitFork, Scale, Star } from "lucide-react";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/shared/components/ui/card";
import { formatFileSize } from "@/shared/lib/format-file-size";
import type { GithubRepo } from "../types/github-profile";

interface RepoCardProps {
  repo: GithubRepo;
}

export function RepoCard({ repo }: RepoCardProps) {
  return (
    <Card size="sm">
      <CardHeader>
        <CardTitle>
          <a href={repo.url} target="_blank" rel="noreferrer" className="hover:underline">
            {repo.name}
          </a>
        </CardTitle>
        {repo.description && <CardDescription className="line-clamp-2">{repo.description}</CardDescription>}
      </CardHeader>
      <CardContent className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground">
        {repo.language && (
          <span className="inline-flex items-center gap-1">
            <Circle className="size-2.5 fill-current" aria-hidden="true" />
            {repo.language}
          </span>
        )}
        <span className="inline-flex items-center gap-1">
          <Star className="size-3.5" aria-hidden="true" />
          {repo.stars}
        </span>
        <span className="inline-flex items-center gap-1">
          <GitFork className="size-3.5" aria-hidden="true" />
          {repo.forks}
        </span>
        <span className="inline-flex items-center gap-1">
          <Eye className="size-3.5" aria-hidden="true" />
          {repo.watchers}
        </span>
        {repo.license && (
          <span className="inline-flex items-center gap-1">
            <Scale className="size-3.5" aria-hidden="true" />
            {repo.license}
          </span>
        )}
        <span>{formatFileSize(repo.sizeKb)}</span>
      </CardContent>
    </Card>
  );
}
