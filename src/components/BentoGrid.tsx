import { motion } from "framer-motion";
import ProjectCard from "./ProjectCard";
import acelerikPreview from "@/assets/acelerik.png";
import benditaBurgerPreview from "@/assets/benditaburger_app.png";
import junglaMagicPreview from "@/assets/jungamagica_reservas.png";
import tallerManagerPreview from "@/assets/tallermanager.png";

const projects = [
  {
    title: "Acelerik",
    description:
      "Web moderna y escalable para la comercialización de servicios de automatización (SaaS). Enfoque total en UX/UI, tiempos de carga mínimos y gestión de contenido dinámico.",
    image: acelerikPreview,
    technologies: ["React", "Tailwind CSS", "Architecture"],
    link: "https://www.acelerik.com/",
    size: "large" as const,
  },
  {
    title: "App Bendita Burger",
    description:
      "Desarrollo integral en Flutter con arquitectura limpia. Integración de Firebase Auth & Firestore para sincronización en tiempo real, APIs REST personalizadas y gestión de pagos complejos.",
    image: benditaBurgerPreview,
    technologies: ["Flutter", "Stripe", "Firebase"],
    link_ios: "https://apps.apple.com/es/app/bendita-burger/id1525077901",
    link_android:
      "https://play.google.com/store/apps/details?id=com.bendita.benditaMobile&hl=es",
    size: "medium" as const,
  },
  {
    title: "Jungla Mágica - Sistema de Gestión Inteligente",
    description:
      "Dashboard React para gestión de reservas en tiempo real. Backend n8n automatizado para sincronizar calendarios, pagos y notificaciones.",
    image: junglaMagicPreview,
    link: "https://www.loom.com/share/d0b4e7cb46d14452903e83ac6e888f02",
    link_code: "https://github.com/cvidaal/jungla-admin",
    technologies: ["React", "Tailwind CSS", "n8n", "Supabase"],
    size: "medium" as const,
  },
  {
    title: "Taller Manager - Sistema de Gestión de Taller Mecánico",
    description: "Sistema de gestión de taller mecánico.",
    image: tallerManagerPreview,
    technologies: ["React", "Node.js", "Prisma", "Tailwind CSS", "Supabase"],
    size: "large" as const,
    link: "https://taller-saas.vercel.app/login",
    link_code: "https://github.com/cvidaal/taller-saas",
  },
];

const BentoGrid = () => {
  return (
    <section id="proyectos" className="relative py-24 md:py-32 px-6">
      <div className="max-w-7xl mx-auto">
        {/* Section Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mb-16"
        >
          <span className="section-title">Portfolio</span>
          <h2 className="font-display font-bold text-3xl md:text-5xl text-foreground">
            Proyectos <span className="text-gradient">Destacados</span>
          </h2>
        </motion.div>

        {/* Bento Grid: en móvil columna simple (todas las cards visibles); en desktop grid bento */}
        <div className="flex flex-col gap-4 md:grid md:grid-cols-3 md:gap-6 md:auto-rows-[220px]">
          {/* Featured Project - Large */}
          <ProjectCard {...projects[0]} delay={0.1} />

          {/* Medium Projects */}
          <ProjectCard {...projects[1]} delay={0.3} />
          <ProjectCard {...projects[2]} delay={0.4} />
          <ProjectCard {...projects[3]} delay={0.5} />
        </div>
      </div>
    </section>
  );
};

export default BentoGrid;
