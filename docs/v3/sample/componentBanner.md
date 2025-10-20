# Sample Component: The Banner

This document provides a reference implementation for a standard "Organism" level component, the `Banner`. It is designed to be used within our **Dynamic Component Architecture**.

> **Relevant Principles:**
> *   [Clarity & Maintainability](./../principle.md#1-clarity-and-maintainability)
> *   [SOLID Principles](./../principle.md#2-solid-principles)
> *   [Styling Architecture](./../style.md)
> *   [Dynamic Component Architecture](./../component-design/dynamic-components.md)

---

### File: `src/components/organisms/Banner.js`

```jsx
import React from 'react';

// The schema defines the component's API for validation, tooling, and AI.
// It adheres to the Interface Segregation Principle by being specific.
export const schema = {
  option: {
    align: { type: 'enum', values: ['left', 'center', 'right'], default: 'left', required: false },
    fullWidth: { type: 'boolean', default: true, required: false }
  },
  data: {
    title: { type: 'string', required: true },
    subtitle: { type: 'string', required: false },
    backgroundImageUrl: { type: 'string', required: false }
  }
};

// This is a pure "presentational" component. It has no internal logic
// beyond rendering its props. This adheres to the Single Responsibility Principle.
const Banner = ({ option, data }) => {
  const styles = {
    textAlign: option?.align || 'left',
    width: option?.fullWidth ? '100%' : 'auto',
    backgroundImage: data?.backgroundImageUrl ? `url(${data.backgroundImageUrl})` : 'none',
    // Adheres to Styling Architecture by consuming core theme variables
    color: 'var(--var-text-primary)',
    backgroundColor: 'var(--var-color-secondary)',
    borderRadius: 'var(--var-border-radius)',
    padding: '4rem 2rem'
  };

  return (
    <div style={styles} className="banner-organism">
      <h1>{data?.title}</h1>
      {data?.subtitle && <p>{data.subtitle}</p>}
    </div>
  );
};

export default Banner;

```

### How It Adheres to Our Principles

1.  **Single Responsibility Principle:** The component's only responsibility is to render a banner based on the props it receives. It does not fetch its own data.
2.  **Open/Closed Principle:** This component is designed to be registered. The system can be extended with new components like this one without ever modifying the core renderer.
3.  **Interface Segregation:** The `option` and `data` props are clearly defined and specific to what the `Banner` needs. We don't pass in a massive, unrelated object.
4.  **Dynamic Component Contract:** It perfectly follows the contract by accepting `option` and `data` and exporting a `schema`.
5.  **Styling:** It correctly uses CSS variables (`--da--color-primary`, etc.) for theming, ensuring it will adapt to any theme applied by an administrator.

