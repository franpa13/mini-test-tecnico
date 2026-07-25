import {
  Activity,
  Eye,
  GitBranch,
  GitCommitHorizontal,
  GitFork,
  GitPullRequest,
  Globe,
  MessageSquare,
  Tag,
  Trash2,
  CircleDot,
  type LucideIcon,
} from "lucide-react";

import { formatRelativeTime } from "@/shared/lib/format-relative-time";
import type { GithubActivity } from "../types/github-profile";

const ICON_BY_EVENT_TYPE: Record<string, LucideIcon> = {
  PushEvent: GitCommitHorizontal,
  CreateEvent: GitBranch,
  DeleteEvent: Trash2,
  WatchEvent: Tag,
  ForkEvent: GitFork,
  IssuesEvent: CircleDot,
  IssueCommentEvent: MessageSquare,
  PullRequestEvent: GitPullRequest,
  PullRequestReviewEvent: Eye,
  ReleaseEvent: Tag,
  PublicEvent: Globe,
};

interface ActivityItemProps {
  activity: GithubActivity;
  showRepoLink?: boolean;
}

export function ActivityItem({ activity, showRepoLink = true }: ActivityItemProps) {
  const Icon = ICON_BY_EVENT_TYPE[activity.type] ?? Activity;

  return (
    <li className="flex items-start gap-3 py-2.5">
      <Icon className="mt-0.5 size-4 shrink-0 text-muted-foreground" aria-hidden="true" />
      <div className="flex-1 text-sm">
        <p className="text-foreground">
          {activity.description}
          {showRepoLink && (
            <>
              {" "}
              <a href={activity.repoUrl} target="_blank" rel="noreferrer" className="font-medium hover:underline">
                {activity.repoName}
              </a>
            </>
          )}
        </p>
        <time dateTime={activity.createdAt} className="text-xs text-muted-foreground">
          {formatRelativeTime(activity.createdAt)}
        </time>
      </div>
    </li>
  );
}
