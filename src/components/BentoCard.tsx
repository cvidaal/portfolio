import { motion } from 'framer-motion';
import { ReactNode } from 'react';

interface BentoCardProps {
  className?: string;
  children: ReactNode;
  delay?: number;
}

const BentoCard = ({ className = '', children, delay = 0 }: BentoCardProps) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-50px" }}
      transition={{ duration: 0.6, delay }}
      whileHover={{ y: -5 }}
      className={`glass-card animated-border group ${className}`}
    >
      {children}
    </motion.div>
  );
};

export default BentoCard;
