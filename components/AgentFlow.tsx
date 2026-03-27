'use client';

import { motion } from 'framer-motion';
import { type ReactNode } from 'react';

export interface AgentFlowStep {
  actor: 'agent' | 'server' | 'cipherpay';
  title: ReactNode;
  detail: string;
}

interface AgentFlowProps {
  title: ReactNode;
  tag: ReactNode;
  steps: AgentFlowStep[];
}

const rowVariants = {
  hidden: { opacity: 0, x: -8 },
  visible: { opacity: 1, x: 0 },
};

const actorLabel: Record<AgentFlowStep['actor'], string> = {
  agent: 'Agent',
  server: 'Server',
  cipherpay: 'CipherPay',
};

export function AgentFlow({ title, tag, steps }: AgentFlowProps) {
  return (
    <div className="panel af-panel">
      <div className="panel-header">
        <span className="panel-title">{title}</span>
        <span className="tag">{tag}</span>
      </div>

      <div className="af-rows">
        {steps.map((step, i) => {
          const isCp = step.actor === 'cipherpay';
          const num = String(i + 1).padStart(2, '0');

          return (
            <motion.div
              key={i}
              className={`af-row${isCp ? ' af-row--highlight' : ''}`}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: '-20px' }}
              variants={rowVariants}
              transition={{
                duration: 0.3,
                ease: [0.21, 0.47, 0.32, 0.98],
                delay: 0.05 + i * 0.08,
              }}
            >
              <span className="af-num">{num}</span>
              <span className={`af-actor af-actor--${step.actor}`}>
                {actorLabel[step.actor]}
              </span>
              <span className="af-title">{step.title}</span>
              <span className="af-detail">{step.detail}</span>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
