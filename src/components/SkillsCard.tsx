import { motion } from 'framer-motion';
import BentoCard from './BentoCard';

const skills = [
  { name: 'React', color: 'hsl(185 100% 50%)' },
  { name: 'Node.js', color: 'hsl(140 70% 50%)' },
  { name: 'Python', color: 'hsl(45 90% 55%)' },
  { name: 'JavaScript', color: 'hsl(50 95% 55%)' },
  { name: 'TypeScript', color: 'hsl(210 90% 55%)' },
  { name: 'Flutter', color: 'hsl(200 100% 55%)' },
];

const SkillsCard = ({ delay = 0 }: { delay?: number }) => {
  return (
    <BentoCard className="col-span-1 row-span-1 p-6" delay={delay}>
      <div className="h-full flex flex-col">
        <span className="section-title">Stack</span>
        <h3 className="font-display font-bold text-lg text-foreground mb-4">
          Tecnologías
        </h3>
        
        <div className="flex-1 flex flex-wrap gap-2 content-start">
          {skills.map((skill, index) => (
            <motion.span
              key={skill.name}
              initial={{ opacity: 0, scale: 0.8 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ 
                delay: delay + 0.1 + (index * 0.1),
                type: "spring",
                stiffness: 200
              }}
              whileHover={{ 
                scale: 1.1,
                boxShadow: `0 0 20px ${skill.color}40`
              }}
              className="skill-tag cursor-default"
              style={{
                borderColor: skill.color,
                color: skill.color,
                backgroundColor: `${skill.color}15`
              }}
            >
              {skill.name}
            </motion.span>
          ))}
        </div>
      </div>
    </BentoCard>
  );
};

export default SkillsCard;
