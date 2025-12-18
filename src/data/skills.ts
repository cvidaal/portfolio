import {
  FaReact,
  FaNodeJs,
  FaPython,
  FaJs,
  FaGitAlt,
  FaDocker,
  FaAws,
} from "react-icons/fa";
import {
  SiTypescript,
  SiFlutter,
  SiMongodb,
  SiPostgresql,
  SiFirebase,
  SiStripe,
  SiTensorflow,
  SiLaravel,
  SiN8N,
  SiSupabase,
} from "react-icons/si";
import { RiTailwindCssFill, RiNextjsFill } from "react-icons/ri";

export interface Skill {
  name: string;
  icon: any;
  color: string;
}

export const skills: Skill[] = [
  { icon: FaReact, name: "React", color: "hsl(185 100% 50%)" },
  { icon: RiNextjsFill, name: "Next.js", color: "hsl(0 0% 100%)" },
  { icon: FaNodeJs, name: "Node.js", color: "hsl(140 70% 50%)" },
  { icon: FaPython, name: "Python", color: "hsl(45 90% 55%)" },
  { icon: FaJs, name: "JavaScript", color: "hsl(50 95% 55%)" },
  { icon: SiTypescript, name: "TypeScript", color: "hsl(210 90% 55%)" },
  { icon: RiTailwindCssFill, name: "Tailwind CSS", color: "hsl(210 90% 55%)" },
  { icon: SiFlutter, name: "Flutter", color: "hsl(200 100% 55%)" },
  { icon: SiMongodb, name: "MongoDB", color: "hsl(120 40% 50%)" },
  { icon: SiPostgresql, name: "PostgreSQL", color: "hsl(216 70% 50%)" },
  { icon: FaGitAlt, name: "Git", color: "hsl(10 80% 60%)" },
  { icon: FaDocker, name: "Docker", color: "hsl(200 80% 60%)" },
  { icon: FaAws, name: "AWS", color: "hsl(30 90% 55%)" },
  { icon: SiFirebase, name: "Firebase", color: "hsl(35 90% 55%)" },
  { icon: SiStripe, name: "Stripe", color: "hsl(243 75% 59%)" },
  { icon: SiN8N, name: "n8n", color: "hsl(0 100% 60%)" },
  { icon: SiSupabase, name: "Supabase", color: "hsl(132 100% 42.7%)" },
  //   { icon: SiTensorflow, name: "TensorFlow", color: "hsl(27 90% 55%)" },
];

export const getSkillByName = (name: string): Skill | undefined => {
  return skills.find(
    (skill) => skill.name.toLowerCase() === name.toLowerCase()
  );
};
