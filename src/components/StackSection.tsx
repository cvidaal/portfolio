import { motion } from 'framer-motion';

const skills = [
  { name: 'React', level: 95 },
  { name: 'Node.js', level: 90 },
  { name: 'TypeScript', level: 92 },
  { name: 'Python', level: 85 },
  { name: 'Flutter', level: 80 },
  { name: 'PostgreSQL', level: 88 },
];

const StackSection = () => {
  return (
    <section id="stack" className="relative py-24 md:py-32 px-6">
      <div className="max-w-4xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <span className="section-title">Tecnologías</span>
          <h2 className="font-display font-bold text-3xl md:text-4xl text-foreground">
            Mi <span className="text-gradient">Stack</span> Tecnológico
          </h2>
        </motion.div>

        <div className="grid gap-6">
          {skills.map((skill, index) => (
            <motion.div
              key={skill.name}
              initial={{ opacity: 0, x: -30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1 }}
              className="glass-card p-4 rounded-xl"
            >
              <div className="flex items-center justify-between mb-2">
                <span className="font-mono text-sm text-foreground">{skill.name}</span>
                <span className="font-mono text-xs text-muted-foreground">{skill.level}%</span>
              </div>
              <div className="h-2 bg-muted/50 rounded-full overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  whileInView={{ width: `${skill.level}%` }}
                  viewport={{ once: true }}
                  transition={{ duration: 1, delay: 0.3 + index * 0.1, ease: 'easeOut' }}
                  className="h-full rounded-full"
                  style={{
                    background: 'linear-gradient(90deg, hsl(var(--primary)), hsl(var(--accent)))',
                  }}
                />
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default StackSection;
