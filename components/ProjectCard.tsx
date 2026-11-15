import type { Project } from "@/content/projects";

export default function ProjectCard({ project }: { project: Project }) {
  return (
    <article className="group flex flex-col rounded-2xl border border-white/10 bg-[#06222e]/60 p-6 backdrop-blur-md transition duration-300 hover:-translate-y-1 hover:border-white/25 hover:bg-[#06222e]/75">
      <h3 className="font-serif text-2xl text-white">{project.title}</h3>
      <p className="mt-3 flex-1 leading-relaxed text-white/75">
        {project.summary}
      </p>
      <ul className="mt-5 flex flex-wrap gap-2">
        {project.tags.map((tag) => (
          <li
            key={tag}
            className="rounded-full bg-white/10 px-3 py-1 text-xs tracking-wide text-white/80"
          >
            {tag}
          </li>
        ))}
      </ul>
      {project.links.length > 0 && (
        <div className="mt-5 flex flex-wrap gap-4 text-sm">
          {project.links.map((link) => (
            <a
              key={link.href}
              href={link.href}
              target="_blank"
              rel="noopener noreferrer"
              className="font-medium text-[#f6b36a] underline-offset-4 hover:underline"
            >
              {link.label} &rarr;
            </a>
          ))}
        </div>
      )}
    </article>
  );
}
