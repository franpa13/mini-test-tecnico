import { getGithubProfile } from "@/features/github-profile/services/get-github-profile";
import { getGithubRepos } from "@/features/github-profile/services/get-github-repos";
import { getGithubActivity } from "@/features/github-profile/services/get-github-activity";
import { ProfileExplorer } from "@/features/github-profile";
import { ErrorState } from "@/shared/components/error-state";
import { ApiError } from "@/shared/types/api-error";

const DEFAULT_USERNAME = "franpa13";

// El perfil se pide en cada visita (no en build time): son datos "en vivo"
// de GitHub, no algo que tenga sentido dejar congelado en un build estático.
export const dynamic = "force-dynamic";

export default async function Home() {
  try {
    const [profile, repos, activity] = await Promise.all([
      getGithubProfile(DEFAULT_USERNAME),
      getGithubRepos(DEFAULT_USERNAME),
      getGithubActivity(DEFAULT_USERNAME),
    ]);

    return (
      <main className="mx-auto flex w-full max-w-5xl flex-1 flex-col gap-6 px-4 py-10">
        <ProfileExplorer initialProfile={profile} initialRepos={repos} initialActivity={activity} />
      </main>
    );
  } catch (error) {
    const message = error instanceof ApiError ? error.message : "No se pudo conectar con el backend. Probá de nuevo en unos minutos.";

    return (
      <main className="mx-auto flex w-full max-w-5xl flex-1 flex-col gap-6 px-4 py-10">
        <ErrorState message={message} />
      </main>
    );
  }
}
