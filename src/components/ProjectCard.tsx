import { motion } from 'framer-motion';
import BentoCard from './BentoCard';

interface ProjectCardProps {
  title: string;
  description: string;
  image: string;
  technologies: string[];
  size?: 'large' | 'medium' | 'small';
  delay?: number;
}

const sizeClasses = {
  large: 'col-span-2 row-span-2',
  medium: 'col-span-1 row-span-2',
  small: 'col-span-1 row-span-1',
};

const ProjectCard = ({ title, description, image, technologies, size = 'medium', delay = 0 }: ProjectCardProps) => {
  return (
    <BentoCard className={`${sizeClasses[size]} overflow-hidden`} delay={delay}>
      <div className="relative h-full">
        {/* Image */}
        <div className="absolute inset-0 overflow-hidden">
          <motion.img
            src={image}
            alt={title}
            className="w-full h-full object-cover opacity-60 group-hover:opacity-80 transition-all duration-700 group-hover:scale-105"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-background via-background/60 to-transparent" />
        </div>

        {/* Content */}
        <div className="relative h-full flex flex-col justify-end p-6 md:p-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ delay: delay + 0.2 }}
          >
            <h3 className="font-display font-bold text-xl md:text-2xl lg:text-3xl text-foreground mb-2">
              {title}
            </h3>
            <p className="text-muted-foreground text-sm md:text-base mb-4 line-clamp-2">
              {description}
            </p>
          </motion.div>

          {/* Technologies - Revealed on hover */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ delay: delay + 0.3 }}
            className="flex flex-wrap gap-2 opacity-0 group-hover:opacity-100 transition-opacity duration-500"
          >
            {technologies.map((tech) => (
              <span key={tech} className="skill-tag">
                {tech}
              </span>
            ))}
          </motion.div>
        </div>
      </div>
    </BentoCard>
  );
};

export default ProjectCard;
