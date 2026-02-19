import { motion } from "framer-motion";
import useEmblaCarousel from "embla-carousel-react";
import AutoScroll from "embla-carousel-auto-scroll";
import { skills } from "@/data/skills";

const TechStack = () => {
  // useEmblaCarousel
  const [emblaRef] = useEmblaCarousel({ loop: true, dragFree: true }, [
    AutoScroll({ playOnInit: true, stopOnInteraction: false, speed: 1 }),
  ]);

  return (
    <section id="stack" className="relative py-10 md:py-24 overflow-hidden">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        className="text-center mb-16 px-6"
      >
        <span className="section-title">Stack</span>
        <h2 className="font-display font-bold text-3xl md:text-5xl text-foreground">
          Tecnologías <span className="text-gradient">Core</span>
        </h2>
      </motion.div>

      {/* Marquee Container */}
      <div className="embla overflow-hidden mask-linear-fade" ref={emblaRef}>
        <div className="embla__container flex">
          {[...skills, ...skills, ...skills].map((skill, index) => (
            <div
              key={`${skill.name}-${index}`}
              className="embla__slide flex-shrink-0 pl-8"
            >
              <TechCard skill={skill} />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

const TechCard = ({ skill }: { skill: any }) => (
  <div
    className="inline-flex flex-col items-center justify-center p-6 gap-4 rounded-xl border border-white/5 bg-white/5 hover:border-white/10 transition-colors duration-300 cursor-pointer min-w-[140px]"
    style={{
      backdropFilter: "blur(10px)",
    }}
  >
    <div
      className="p-3 rounded-lg bg-background/50 shadow-inner"
      style={{
        boxShadow: `0 0 0 1px ${skill.color}10`,
      }}
    >
      {skill.icon && (
        <skill.icon
          className="w-8 h-8 transition-colors duration-300"
          style={{ color: skill.color }}
        />
      )}
    </div>
    <span className="font-medium text-sm text-foreground/80">{skill.name}</span>
  </div>
);

export default TechStack;
