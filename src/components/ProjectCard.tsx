import { motion } from "framer-motion";
import BentoCard from "./BentoCard";
import { getSkillByName } from "@/data/skills";
import { Button } from "./ui/button";

interface ProjectCardProps {
  title: string;
  description: string;
  image: string;
  technologies: string[];
  link?: string;
  link_android?: string;
  link_ios?: string;
  link_code?: string;
  size?: "large" | "medium" | "small";
  delay?: number;
}

const sizeClasses = {
  large: "col-span-2 row-span-2",
  medium: "col-span-1 row-span-2",
  small: "col-span-1 row-span-1",
};

const buttonLink = (
  link: string,
  text: string,
  className?: string,
  variant: "default" | "glow" | "glow-outline" = "glow",
) => {
  return (
    <Button
      className={className ?? "w-full md:w-auto shrink-0"}
      variant={variant}
      asChild
    >
      <a href={link} target="_blank" rel="noopener noreferrer">
        {text}
      </a>
    </Button>
  );
};

const ProjectCard = ({
  title,
  description,
  image,
  technologies,
  size = "medium",
  link,
  link_code,
  link_ios,
  link_android,
  delay = 0,
}: ProjectCardProps) => {
  return (
    <BentoCard
      className={`${sizeClasses[size]} overflow-hidden min-h-[320px] md:min-h-0`}
      delay={delay}
    >
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
        <div className="relative z-10 h-full flex flex-col justify-end p-6 md:p-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ delay: delay + 0.2 }}
            className="flex-shrink-0"
          >
            <h3 className="font-display font-bold text-xl md:text-2xl lg:text-3xl text-foreground mb-2">
              {title}
            </h3>
            <p className="text-muted-foreground text-sm md:text-base mb-3 line-clamp-2">
              {description}
            </p>
          </motion.div>

          {/* Bloque inferior: tags + botones sin solapamiento */}
          <div className="flex flex-col gap-3 flex-shrink-0 mt-1 min-h-0">
            {/* Technologies - visible on mobile, revealed on hover on desktop */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ delay: delay + 0.3 }}
              className="flex flex-wrap gap-2 opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity duration-500"
            >
              {technologies.map((tech) => {
                const skill = getSkillByName(tech);
                const Icon = skill?.icon;
                return (
                  <span
                    key={tech}
                    className="skill-tag flex items-center gap-1.5"
                  >
                    {Icon && (
                      <Icon
                        className="w-3.5 h-3.5 shrink-0"
                        style={{ color: skill.color }}
                      />
                    )}
                    <span>{tech}</span>
                  </span>
                );
              })}
            </motion.div>

            {/* Links - Buttons: columna en móvil, fila en desktop */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ delay: delay + 0.3 }}
              className="flex flex-col sm:flex-row flex-wrap gap-2 opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity duration-500"
            >
              {link && buttonLink(link, "Ver Proyecto")}
              {link_code &&
                buttonLink(link_code, "Ver Código", undefined, "glow-outline")}
              {link_ios && buttonLink(link_ios, "Ver App iOS")}
              {link_android &&
                buttonLink(
                  link_android,
                  "Ver App Android",
                  undefined,
                  "glow-outline",
                )}
            </motion.div>
          </div>
        </div>
      </div>
    </BentoCard>
  );
};

export default ProjectCard;
