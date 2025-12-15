import { motion } from 'framer-motion';
import ProjectCard from './ProjectCard';
import SkillsCard from './SkillsCard';
import focusboardPreview from '@/assets/focusboard-preview.jpg';
import ecommercePreview from '@/assets/project-ecommerce.jpg';
import analyticsPreview from '@/assets/project-analytics.jpg';

const projects = [
  {
    title: 'FocusBoard',
    description: 'Plataforma de productividad con gestión de tareas inteligente, seguimiento de tiempo y analíticas en tiempo real.',
    image: focusboardPreview,
    technologies: ['React', 'Node.js', 'PostgreSQL', 'WebSocket'],
    size: 'large' as const,
  },
  {
    title: 'NexStore',
    description: 'E-commerce móvil con experiencia de compra inmersiva y pagos seguros.',
    image: ecommercePreview,
    technologies: ['Flutter', 'Firebase', 'Stripe'],
    size: 'medium' as const,
  },
  {
    title: 'AI Analytics',
    description: 'Dashboard de analíticas con machine learning para predicción de métricas.',
    image: analyticsPreview,
    technologies: ['Python', 'TensorFlow', 'React'],
    size: 'medium' as const,
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

        {/* Bento Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6 auto-rows-[200px] md:auto-rows-[220px]">
          {/* Featured Project - Large */}
          <ProjectCard {...projects[0]} delay={0.1} />
          
          {/* Skills Card */}
          <SkillsCard delay={0.2} />
          
          {/* Medium Projects */}
          <ProjectCard {...projects[1]} delay={0.3} />
          <ProjectCard {...projects[2]} delay={0.4} />
        </div>
      </div>
    </section>
  );
};

export default BentoGrid;
