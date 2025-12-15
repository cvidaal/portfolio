import { motion } from 'framer-motion';
import profilePhoto from '@/assets/profile-photo.jpg';

const AboutSection = () => {
  return (
    <section id="sobre-mi" className="relative py-24 md:py-32 px-6 overflow-hidden">
      {/* Background Gradient */}
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-primary/5 to-transparent" />
      
      <div className="max-w-6xl mx-auto relative z-10">
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          className="grid md:grid-cols-2 gap-12 md:gap-16 items-center"
        >
          {/* Photo */}
          <motion.div
            initial={{ opacity: 0, x: -50 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
            className="relative"
          >
            <div className="relative aspect-[4/5] max-w-md mx-auto md:mx-0">
              {/* Glow Effect Behind */}
              <div className="absolute inset-0 bg-gradient-to-br from-primary/30 to-accent/20 rounded-2xl blur-3xl opacity-50 scale-90" />
              
              {/* Image Container */}
              <div className="relative glass-card overflow-hidden rounded-2xl h-full">
                <img
                  src={profilePhoto}
                  alt="Carlos Vidal"
                  className="w-full h-full object-cover grayscale hover:grayscale-0 transition-all duration-700"
                />
                {/* Overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-background/80 via-transparent to-primary/10" />
              </div>

              {/* Floating Badge */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.5 }}
                className="absolute -bottom-4 -right-4 md:right-8 glass-card px-4 py-3 rounded-xl"
              >
                <span className="font-mono text-sm text-primary">5+ años de experiencia</span>
              </motion.div>
            </div>
          </motion.div>

          {/* Content */}
          <motion.div
            initial={{ opacity: 0, x: 50 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8, delay: 0.2 }}
          >
            <span className="section-title">Sobre Mí</span>
            <h2 className="font-display font-bold text-3xl md:text-4xl lg:text-5xl text-foreground mb-6">
              Código con <span className="text-gradient">propósito</span>
            </h2>
            
            <div className="space-y-4 text-muted-foreground">
              <p className="text-lg">
                Creo que el mejor código es el que resuelve problemas reales sin añadir complejidad innecesaria. 
                Mi filosofía: <span className="text-foreground font-medium">elegancia en la simplicidad</span>.
              </p>
              <p>
                Cada proyecto es una oportunidad de fusionar creatividad con ingeniería. Me especializo en 
                crear experiencias digitales que no solo funcionan perfectamente, sino que 
                <span className="text-primary"> inspiran</span>.
              </p>
              <p>
                Desde startups ágiles hasta empresas consolidadas, he liderado el desarrollo de productos 
                que impactan a miles de usuarios diariamente.
              </p>
            </div>

            {/* Philosophy Quote */}
            <motion.blockquote
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
              transition={{ delay: 0.6 }}
              className="mt-8 pl-6 border-l-2 border-primary/50"
            >
              <p className="font-mono text-sm text-muted-foreground italic">
                "La tecnología debe ser invisible. Lo que el usuario recuerda es cómo le hiciste sentir."
              </p>
            </motion.blockquote>
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
};

export default AboutSection;
