"use client";

import { useState, type FormEvent } from "react";
import Image from "next/image";
import { Search } from "lucide-react";

import { Input } from "@/shared/components/ui/input";
import { Button } from "@/shared/components/ui/button";
import { ThemeToggle } from "@/shared/components/theme-toggle";

interface ProfileSearchBannerProps {
  onSearch: (username: string) => void;
  isLoading: boolean;
}

export function ProfileSearchBanner({ onSearch, isLoading }: ProfileSearchBannerProps) {
  const [value, setValue] = useState("");

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const username = value.trim();
    if (username) {
      onSearch(username);
    }
  }

  return (
    <section className="relative grid grid-cols-1 items-stretch overflow-hidden rounded-2xl border  border-border bg-card h-auto md:grid-cols-[minmax(140px,200px)_1fr_minmax(140px,200px)]">
      <div className="absolute left-1 top-1 size-8 overflow-hidden rounded-full ring-1 ring-border md:hidden">
        <Image src="/images/github.png" alt="" fill className="object-cover" sizes="24px" />
      </div>
      <div className="absolute right-1 bottom-1 size-8 overflow-hidden rounded-full ring-1 ring-border md:hidden">
        <Image src="/images/git.png" alt="" fill className="object-cover" sizes="24px" />
      </div>

      <div className="relative hidden h-40 md:block">
        <Image src="/images/github.png" alt="" fill priority className="object-cover" sizes="250px" />
      </div>

      <div className="flex flex-col items-center justify-center gap-3 px-6 pt-8 pb-12 text-center md:py-0">
        <h1 className="text-xl font-semibold text-foreground">Buscá un perfil de GitHub</h1>
        <p className="text-sm text-muted-foreground">Escribí un username y consultamos su perfil público</p>

        <form onSubmit={handleSubmit} className="mt-2 flex w-full max-w-xs gap-2">
          <Input
            value={value}
            onChange={(event) => setValue(event.target.value)}
            placeholder="ej: octocat"
            aria-label="Username de GitHub"
            disabled={isLoading}
          />
          <Button type="submit" size="icon" aria-label="Buscar" disabled={isLoading || !value.trim()}>
            <Search />
          </Button>
          <ThemeToggle />
        </form>
      </div>

      <div className="relative hidden h-40 md:block">
        <Image src="/images/git.png" alt="" fill priority className="object-cover" sizes="200px" />
      </div>
    </section>
  );
}
