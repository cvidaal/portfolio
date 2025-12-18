import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Download, Github, Linkedin, Menu, X } from "lucide-react";

const navLinks = [
  { label: "Stack", href: "#stack" },
  { label: "Proyectos", href: "#proyectos" },
  { label: "Sobre mí", href: "#sobre-mi" },
  { label: "Contacto", href: "#contacto" },
];

const Navbar = () => {
  const [isOpen, setIsOpen] = useState(false);

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleNavClick = (href: string) => {
    setIsOpen(false);
    const element = document.querySelector(href);
    if (element) {
      element.scrollIntoView({ behavior: "smooth" });
    }
  };

  return (
    <nav className="fixed top-0 left-0 right-0 z-50">
      <div
        className="backdrop-blur-xl border-b border-border/30"
        style={{
          background:
            "linear-gradient(180deg, hsl(220 15% 8% / 0.9), hsl(220 15% 5% / 0.8))",
        }}
      >
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="flex items-center justify-between h-16 lg:h-20">
            {/* Logo / Name */}
            <motion.button
              onClick={scrollToTop}
              className="font-display font-bold text-lg lg:text-xl text-foreground hover:text-primary transition-colors duration-300"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              Carlos Vidal;
            </motion.button>

            {/* Desktop Navigation - Center */}
            <div className="hidden md:flex items-center gap-8">
              {navLinks.map((link) => (
                <motion.button
                  key={link.href}
                  onClick={() => handleNavClick(link.href)}
                  className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors duration-300 relative group"
                  whileHover={{ y: -1 }}
                >
                  {link.label}
                  <span className="absolute -bottom-1 left-0 w-0 h-px bg-primary transition-all duration-300 group-hover:w-full" />
                </motion.button>
              ))}
            </div>

            {/* Desktop Right Section */}
            <div className="hidden md:flex items-center gap-4">
              <motion.a
                href="https://github.com/cvidaal"
                target="_blank"
                rel="noopener noreferrer"
                className="p-2 text-muted-foreground hover:text-foreground transition-colors duration-300"
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.95 }}
              >
                <Github className="w-5 h-5" />
              </motion.a>
              <motion.a
                href="https://www.linkedin.com/in/carlosvidaldev/"
                target="_blank"
                rel="noopener noreferrer"
                className="p-2 text-muted-foreground hover:text-foreground transition-colors duration-300"
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.95 }}
              >
                <Linkedin className="w-5 h-5" />
              </motion.a>
              <motion.button
                onClick={() => handleNavClick("#contacto")}
                className="ml-2 px-4 py-2 text-sm font-semibold rounded-lg bg-primary text-primary-foreground hover:shadow-button transition-all duration-300"
                whileHover={{ scale: 1.03, y: -1 }}
                whileTap={{ scale: 0.98 }}
              >
                Contactar
              </motion.button>
              {/* CV Download Button */}
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.5, delay: 0.7 }}
              >
                <a
                  href="/CarlosVidalSanchez.pdf"
                  download="CarlosVidalSanchez.pdf"
                  className="glow-button-outline-header inline-flex items-center gap-2 font-display font-semibold"
                >
                  CV
                  <Download className="w-5 h-5" />
                </a>
              </motion.div>
            </div>

            {/* Mobile Menu Button */}
            <motion.button
              onClick={() => setIsOpen(!isOpen)}
              className="md:hidden p-2 text-foreground"
              whileTap={{ scale: 0.95 }}
            >
              {isOpen ? (
                <X className="w-6 h-6" />
              ) : (
                <Menu className="w-6 h-6" />
              )}
            </motion.button>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3, ease: "easeInOut" }}
            className="md:hidden overflow-hidden backdrop-blur-xl border-b border-border/30"
            style={{
              background:
                "linear-gradient(180deg, hsl(220 15% 8% / 0.95), hsl(220 15% 5% / 0.95))",
            }}
          >
            <div className="px-6 py-6 space-y-4">
              {navLinks.map((link, index) => (
                <motion.button
                  key={link.href}
                  onClick={() => handleNavClick(link.href)}
                  className="block w-full text-left text-lg font-medium text-muted-foreground hover:text-foreground transition-colors duration-300"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.05 }}
                >
                  {link.label}
                </motion.button>
              ))}

              <div className="pt-4 border-t border-border/30 flex items-center gap-4">
                <motion.a
                  href="https://github.com/cvidaal"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-2 text-muted-foreground hover:text-foreground transition-colors duration-300"
                  whileHover={{ scale: 1.1 }}
                >
                  <Github className="w-5 h-5" />
                </motion.a>
                <motion.a
                  href="https://linkedin.com/in/carlosvidaldev"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-2 text-muted-foreground hover:text-foreground transition-colors duration-300"
                  whileHover={{ scale: 1.1 }}
                >
                  <Linkedin className="w-5 h-5" />
                </motion.a>
                <motion.button
                  onClick={() => handleNavClick("#contacto")}
                  className="ml-auto px-4 py-2 text-sm font-semibold rounded-lg bg-primary text-primary-foreground"
                  whileTap={{ scale: 0.98 }}
                >
                  Contactar
                </motion.button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
};

export default Navbar;
