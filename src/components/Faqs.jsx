import { useState } from 'react';
import { Icon } from './ui';

/* Accordion of questions; `firstOpen` opens the first answer */
export default function Faqs({ items, firstOpen = true }) {
  const [open, setOpen] = useState(firstOpen ? 0 : -1);
  return (
    <div className="faqs">
      {items.map((f, i) => {
        const isOpen = open === i;
        return (
          // The fade-in lives on the wrapper: opening/closing re-renders the inner className,
          // which would otherwise wipe the "is-visible" class added on scroll and hide the item
          <div key={f.q} className="reveal">
            <div className={`faq ${isOpen ? 'is-open' : ''}`}>
              <button
                className="faq__q"
                aria-expanded={isOpen}
                onClick={(e) => {
                  // An item clicked before its fade-in has run must still stay visible
                  e.currentTarget.closest('.reveal')?.classList.add('is-visible');
                  setOpen(isOpen ? -1 : i);
                }}
              >
                {f.q}
                <Icon name="plus" size={18} />
              </button>
              <div className="faq__a" inert={!isOpen}>
                <div>
                  <p>{f.a}</p>
                </div>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
