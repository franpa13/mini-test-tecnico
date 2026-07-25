"use client";

import { useState } from "react";
import { ClockFading } from "lucide-react";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/shared/components/ui/accordion";
import { Button } from "@/shared/components/ui/button";
import { formatRelativeTime } from "@/shared/lib/format-relative-time";
import type { GithubActivity } from "../types/github-profile";
import { ActivityItem } from "./activity-item";
import { SectionTitle } from "@/shared/components/section-title";
import { Card, CardContent } from "@/shared/components/ui/card";

interface ActivityListProps {
  activity: GithubActivity[];
}

interface RepoActivityGroup {
  repoName: string;
  items: GithubActivity[];
}

const MAX_GROUPS = 8;
const COLLAPSED_GROUPS = 2;

function groupByRepo(activity: GithubActivity[]): RepoActivityGroup[] {
  const groups = new Map<string, RepoActivityGroup>();

  for (const item of activity) {
    const group = groups.get(item.repoName);
    if (group) {
      group.items.push(item);
    } else {
      groups.set(item.repoName, { repoName: item.repoName, items: [item] });
    }
  }

  return [...groups.values()].slice(0, MAX_GROUPS);
}

export function ActivityList({ activity }: ActivityListProps) {
  const [showAll, setShowAll] = useState(false);

  if (activity.length === 0) {
    return null;
  }

  const allGroups = groupByRepo(activity);
  const visibleGroups = showAll ? allGroups : allGroups.slice(0, COLLAPSED_GROUPS);
  const hasMore = allGroups.length > COLLAPSED_GROUPS;

  return (
    <div className="flex flex-col gap-3">
      <SectionTitle icon={ClockFading}>Actividad reciente</SectionTitle>
      <Card>

        <CardContent>
          <Accordion defaultValue={[allGroups[0].repoName]}>
            {visibleGroups.map((group) => (
              <AccordionItem key={group.repoName} value={group.repoName}>
                <AccordionTrigger>
                  <span className="flex flex-1 items-center justify-between gap-3 pr-1">
                    <span className="text-sm font-semibold text-foreground">{group.repoName}</span>
                    <span className="flex shrink-0 items-center gap-2 text-xs font-normal text-muted-foreground">
                      <span className="rounded-full bg-muted px-2 py-0.5">
                        {group.items.length} {group.items.length === 1 ? "evento" : "eventos"}
                      </span>
                      {/* "hace X" recalcula con Date.now() al hidratar: puede diferir en 1s del render del server */}
                      <span suppressHydrationWarning>{formatRelativeTime(group.items[0].createdAt)}</span>
                    </span>
                  </span>
                </AccordionTrigger>
                <AccordionContent>
                  <ul className="flex flex-col divide-y divide-border">
                    {group.items.map((item) => (
                      <ActivityItem key={item.id} activity={item} showRepoLink={false} />
                    ))}
                  </ul>
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </CardContent>
      </Card>


      {hasMore && (
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="self-center"
          onClick={() => setShowAll((prev) => !prev)}
        >
          {showAll ? "Ver menos" : "Ver más"}
        </Button>
      )}
    </div>
  );
}
