import KoiPond from "@/components/KoiPond";
import ProjectCard from "@/components/ProjectCard";
import { projects } from "@/content/projects";
import { site } from "@/lib/site";

export default function Home() {
  const links = [
    { label: "GitHub", href: site.github },
    { label: "LinkedIn", href: site.linkedin },
    { label: "Email", href: site.email ? `mailto:${site.email}` : "" },
    { label: "CV", href: site.cv },
  ].filter((link) => link.href);

  return (
    <>
      <KoiPond />

      <main className="relative z-10">
        <section className="flex min-h-svh flex-col items-center justify-center px-6 text-center">
          <h1 className="font-serif text-5xl text-white drop-shadow-[0_2px_18px_rgba(0,20,30,0.8)] sm:text-7xl">
            {site.name}
          </h1>
          <p className="mt-5 max-w-xl text-lg text-white/85 drop-shadow-[0_1px_10px_rgba(0,20,30,0.9)] sm:text-xl">
            {site.tagline}
          </p>

          <nav aria-label="Links" className="mt-8 flex flex-wrap justify-center gap-3">
            {links.map((link) => (
              <a
                key={link.label}
                href={link.href}
                target={link.href.startsWith("mailto:") ? undefined : "_blank"}
                rel="noopener noreferrer"
                className="rounded-full border border-white/25 bg-[#06222e]/40 px-5 py-2 text-sm font-medium text-white backdrop-blur-md transition hover:border-white/60 hover:bg-[#06222e]/70"
              >
                {link.label}
              </a>
            ))}
          </nav>

          <a
            href="#projects"
            className="mt-14 text-sm tracking-widest text-white/70 uppercase transition hover:text-white"
          >
            Projects &darr;
          </a>
          <p className="mt-3 text-xs text-white/50">
            Move your cursor over the water. Click it.
          </p>
        </section>

        <section id="projects" className="mx-auto max-w-6xl scroll-mt-8 px-6 pb-24">
          <h2 className="font-serif text-3xl text-white drop-shadow-[0_2px_12px_rgba(0,20,30,0.8)] sm:text-4xl">
            Projects
          </h2>
          <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {projects.map((project) => (
              <ProjectCard key={project.title} project={project} />
            ))}
          </div>
        </section>

        <footer className="px-6 pb-10 text-center text-xs text-white/40">
          &copy; {new Date().getFullYear()} {site.name}
        </footer>
      </main>
    </>
  );
}
