import type { ReactNode } from "react";
import Image from "next/image";
import { Briefcase, Building2, Calendar, FolderGit2, Link as LinkIcon, Mail, MapPin, Users } from "lucide-react";

import { Card, CardContent } from "@/shared/components/ui/card";
import type { GithubProfile } from "../types/github-profile";

interface ProfileCardProps {
  profile: GithubProfile;
}

export function ProfileCard({ profile }: ProfileCardProps) {
  const joinedAt = new Date(profile.createdAt).toLocaleDateString("es-AR", {
    year: "numeric",
    month: "long",
  });
  const blogUrl = profile.blog && (profile.blog.startsWith("http") ? profile.blog : `https://${profile.blog}`);

  return (
    <Card>
      <CardContent className="flex flex-col gap-4 sm:flex-row sm:items-start">
        <Image
          src={profile.avatarUrl}
          alt={`Avatar de ${profile.username}`}
          width={96}
          height={96}
          className="size-24 shrink-0 rounded-full ring-1 ring-border"
        />

        <div className="flex flex-1 flex-col gap-2">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="text-lg font-semibold text-foreground">{profile.name ?? profile.username}</h2>
              {profile.hireable && (
                <span className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">
                  <Briefcase className="size-3" aria-hidden="true" />
                  Disponible para trabajar
                </span>
              )}
            </div>
            <a
              href={profile.profileUrl}
              target="_blank"
              rel="noreferrer"
              className="text-sm text-muted-foreground hover:underline"
            >
              @{profile.username}
            </a>
          </div>

          {profile.bio && <p className="text-sm text-foreground">{profile.bio}</p>}

          <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-muted-foreground">
            {profile.location && (
              <span className="inline-flex items-center gap-1">
                <MapPin className="size-3.5" aria-hidden="true" />
                {profile.location}
              </span>
            )}
            {profile.company && (
              <span className="inline-flex items-center gap-1">
                <Building2 className="size-3.5" aria-hidden="true" />
                {profile.company}
              </span>
            )}
            {blogUrl && (
              <a
                href={blogUrl}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1 hover:underline"
              >
                <LinkIcon className="size-3.5" aria-hidden="true" />
                {profile.blog}
              </a>
            )}
            {profile.email && (
              <a href={`mailto:${profile.email}`} className="inline-flex items-center gap-1 hover:underline">
                <Mail className="size-3.5" aria-hidden="true" />
                {profile.email}
              </a>
            )}
            <span className="inline-flex items-center gap-1">
              <Calendar className="size-3.5" aria-hidden="true" />
              Se unió en {joinedAt}
            </span>
          </div>

          <div className="mt-2 flex flex-wrap gap-4 border-t border-border pt-3 text-sm">
            <Stat icon={<FolderGit2 className="size-4" aria-hidden="true" />} label="Repositorios Publicos" value={profile.publicRepos} />
            <Stat icon={<Users className="size-4" aria-hidden="true" />} label="Seguidores" value={profile.followers} />
            <Stat icon={<Users className="size-4" aria-hidden="true" />} label="Siguiendo" value={profile.following} />
            <Stat label="Gists" value={profile.publicGists} />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function Stat({ icon, label, value }: { icon?: ReactNode; label: string; value: number }) {
  return (
    <div className="flex items-center gap-1.5">
      {icon}
      <span className="font-medium text-foreground">{value}</span>
      <span className="text-muted-foreground">{label}</span>
    </div>
  );
}
