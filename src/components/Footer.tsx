import { motion } from "framer-motion";
import { Github, Linkedin, Mail } from "lucide-react";

const socialLinks = [
  {
    name: "LinkedIn",
    icon: Linkedin,
    href: "#",
    label: "Conectar en LinkedIn",
  },
  { name: "GitHub", icon: Github, href: "#", label: "Ver repositorios" },
  {
    name: "Email",
    icon: Mail,
    href: "mailto:carlos@vidal.dev",
    label: "Enviar email",
  },
];

const Footer = () => {
  return (
    <footer id="contacto" className="relative py-20 px-6">
      {/* Top Border Gradient */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-1/2 h-px bg-gradient-to-r from-transparent via-primary/50 to-transparent" />

      <div className="max-w-4xl mx-auto text-center">
        {/* CTA */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mb-12"
        >
          <span className="section-title">Contacto</span>
          <h2 className="font-display font-bold text-3xl md:text-4xl text-foreground mb-4">
            ¿Tienes un proyecto en mente?
          </h2>
          <p className="text-muted-foreground max-w-md mx-auto">
            Siempre estoy abierto a discutir nuevos proyectos, ideas creativas o
            oportunidades de colaboración.
          </p>
        </motion.div>

        {/* Social Links */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.2 }}
          className="flex justify-center gap-6 mb-16"
        >
          {socialLinks.map((link, index) => (
            <motion.a
              key={link.name}
              href={link.href}
              aria-label={link.label}
              initial={{ opacity: 0, scale: 0.8 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ delay: 0.3 + index * 0.1 }}
              whileHover={{
                scale: 1.15,
                boxShadow: "0 0 30px hsl(185 100% 50% / 0.3)",
              }}
              whileTap={{ scale: 0.95 }}
              className="glass-card p-4 rounded-xl group"
            >
              <link.icon className="w-6 h-6 text-muted-foreground group-hover:text-primary transition-colors duration-300" />
            </motion.a>
          ))}
        </motion.div>

        {/* Bottom */}
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ delay: 0.5 }}
          className="text-muted-foreground text-sm font-mono"
        >
          <p>Diseñado y desarrollado por Carlos Vidal</p>
          <p className="mt-2 text-muted-foreground/60">
            © {new Date().getFullYear()} · Todos los derechos reservados
          </p>
        </motion.div>
      </div>
    </footer>
  );
};

export default Footer;
