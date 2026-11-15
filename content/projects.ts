export type ProjectLink = { label: string; href: string };

export type Project = {
  title: string;
  summary: string;
  tags: string[];
  links: ProjectLink[];
};

export const projects: Project[] = [
  
  {
    title: "Chess Engine",
    summary:
      "A complete chess engine written in C++ as a university project, focused on search, performance and the debugging that comes with both.",
    tags: ["C++", "Game AI", "Performance"],
    links: [],
  },
  {
    title: "AI Image Detector webapp",
    summary:
      "A duo project made with a friend, I worked on the frontend, creating a website where you put in an image and it tells you whether it was made with AI. Currently a Work In Progress.",
    tags: ["JavaScript", "React", "Tailwind"],
    links: [],
  },
  {
    title: "Dashtro",
    summary:
      "A solo-built Unity action game. A dash that resets on every kill, a boss driven by a custom state machine, an in-game shop and moody dark lighting, with all the UI built in Unity.",
    tags: ["Unity", "C#", "Game UI"],
    links: [], // TODO: add a playable build or video link
  },
  
];
