import { Sparkle } from "lucide-react";
import Link from "next/link";
import type { ReactNode } from "react";

export function SiteFrame({ title, eyebrow, children }: { title: string; eyebrow: string; children: ReactNode }) {
  return (
    <main className="min-h-screen bg-white text-black">
      <header className="flex h-16 items-center justify-between border-b border-border px-6">
        <Link className="flex items-center gap-3" href="/">
          <Sparkle className="h-5 w-5 fill-black" aria-hidden="true" />
          <span className="text-base font-semibold">Autonomous Software Evolution</span>
        </Link>
        <nav className="flex items-center gap-5 text-sm text-muted-foreground">
          <Link className="hover:text-black" href="/">
            Dashboard
          </Link>
          <Link className="hover:text-black" href="/architecture">
            Architecture
          </Link>
          <Link className="hover:text-black" href="/metrics">
            Metrics
          </Link>
        </nav>
      </header>
      <section className="mx-auto w-full max-w-6xl px-6 py-10">
        <div className="mb-8">
          <div className="text-xs font-medium uppercase tracking-[0.18em] text-muted-foreground">{eyebrow}</div>
          <h1 className="mt-3 text-3xl font-semibold tracking-normal">{title}</h1>
        </div>
        {children}
      </section>
    </main>
  );
}
