'use client';

import { useState, useCallback } from 'react';

interface FaqItem {
  question: string;
  answer: string;
}

interface FaqSectionProps {
  id: string;
  title: string;
  items: FaqItem[];
}

function FaqQuestion({ question, answer }: FaqItem) {
  const [open, setOpen] = useState(false);
  const toggle = useCallback(() => setOpen((o) => !o), []);

  return (
    <div className={`faq-item${open ? ' faq-item--open' : ''}`}>
      <button className="faq-question" onClick={toggle} aria-expanded={open}>
        <span>{question}</span>
        <span className="faq-toggle">{open ? '−' : '+'}</span>
      </button>
      {open && (
        <div className="faq-answer">
          <p>{answer}</p>
        </div>
      )}
    </div>
  );
}

export function FaqSection({ id, title, items }: FaqSectionProps) {
  return (
    <div id={id} className="faq-section">
      <div className="panel">
        <div className="panel-header">
          <span className="panel-title">{title}</span>
        </div>
        {items.map((item, i) => (
          <FaqQuestion key={i} {...item} />
        ))}
      </div>
    </div>
  );
}

interface FaqJumpLinksProps {
  sections: { id: string; label: string }[];
}

export function FaqJumpLinks({ sections }: FaqJumpLinksProps) {
  const scrollTo = useCallback((id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }, []);

  return (
    <nav className="faq-jump-links" aria-label="FAQ sections">
      {sections.map((s) => (
        <button key={s.id} className="faq-jump-pill" onClick={() => scrollTo(s.id)}>
          {s.label}
        </button>
      ))}
    </nav>
  );
}
