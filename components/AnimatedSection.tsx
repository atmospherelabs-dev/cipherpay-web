'use client';

import { motion, type Variants } from 'framer-motion';
import { type ReactNode } from 'react';

const fadeInUp: Variants = {
  hidden: { opacity: 0, y: 24 },
  visible: { opacity: 1, y: 0 },
};

const staggerContainer: Variants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.08 } },
};

interface AnimatedSectionProps {
  children: ReactNode;
  className?: string;
  style?: React.CSSProperties;
  delay?: number;
}

export function AnimatedSection({ children, className, style, delay = 0 }: AnimatedSectionProps) {
  return (
    <motion.div
      className={className}
      style={style}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, margin: '-60px' }}
      variants={fadeInUp}
      transition={{ duration: 0.5, ease: [0.21, 0.47, 0.32, 0.98], delay }}
    >
      {children}
    </motion.div>
  );
}

interface StaggerChildrenProps {
  children: ReactNode;
  className?: string;
  style?: React.CSSProperties;
}

export function StaggerChildren({ children, className, style }: StaggerChildrenProps) {
  return (
    <motion.div
      className={className}
      style={style}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, margin: '-40px' }}
      variants={staggerContainer}
    >
      {children}
    </motion.div>
  );
}

export function StaggerItem({ children, className, style }: StaggerChildrenProps) {
  return (
    <motion.div
      className={className}
      style={{ display: 'flex', flexDirection: 'column', ...style }}
      variants={fadeInUp}
      transition={{ duration: 0.45, ease: [0.21, 0.47, 0.32, 0.98] }}
    >
      {children}
    </motion.div>
  );
}
