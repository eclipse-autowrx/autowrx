# Sample Page: The Models Page

This document provides a reference implementation for a built-in, fixed-function page. Unlike the fully dynamic `HomePage`, the layout of the `ModelsPage` is static, but it is still constructed following our core design principles.

It demonstrates how to build a clear and maintainable page by composing self-contained, high-level "Organism" components.

> **Relevant Principles:**
> *   [Clarity & Maintainability](./../principle.md#1-clarity-and-maintainability)
> *   [SOLID Principles](./../principle.md#2-solid-principles)

---

### File: `src/pages/ModelsPage.js`

This page is responsible for displaying various lists of models. It achieves this by composing two main organisms: `ModelsActionBar` and `ModelsGrid`. All complex logic, such as fetching data, is encapsulated within custom hooks and the organism components themselves, keeping the page clean.

```tsx
import React from 'react';
import { PageLayout } from '../layouts';
import { ModelsActionBar, ModelsGrid } from '../organisms';
import { useMyModels, useContributionModels, usePublicModels } from '../hooks';

// The page itself is a simple, declarative composer. Its only job
// is to arrange the high-level Organism components.
const ModelsPage = () => {
  // Data fetching logic is abstracted into custom hooks (SRP)
  const myModels = useMyModels();
  const contributionModels = useContributionModels();
  const publicModels = usePublicModels();

  return (
    <PageLayout>
      {/* The Action Bar is a self-contained Organism */}
      <ModelsActionBar />
      
      {/* The ModelsGrid Organism is reused for each section. */}
      {/* It contains all the logic for rendering a grid of models. */}
      <ModelsGrid title="My Models" models={myModels} />
      <ModelsGrid title="Contributions" models={contributionModels} />
      <ModelsGrid title="Public Models" models={publicModels} />
    </PageLayout>
  );
};

export default ModelsPage;
```

---

### How It Adheres to Our Principles

Even though this page has a fixed layout, it strictly follows our architectural guidelines:

1.  **Clarity and Maintainability:** The `ModelsPage` component is extremely easy to read. You can immediately understand the page's structure without getting lost in implementation details. All the complex logic for fetching, displaying, and interacting with the model lists is handled inside the `use...` hooks and the `ModelsGrid` organism.

2.  **Single Responsibility Principle (SRP):** Each part of the page has one job:
    *   The **Page** is responsible for the overall layout.
    *   The **Custom Hooks** (`useMyModels`, etc.) are responsible for fetching a specific set of data.
    *   The **Organisms** (`ModelsActionBar`, `ModelsGrid`) are responsible for displaying their specific piece of the UI and handling its interactions.

3.  **Component Granularity:** The page correctly composes high-level **Organisms**. It does not concern itself with smaller "Molecule" or "Atom" level components like buttons or individual grid items. This makes the page robust and easy to refactor. If the design of the `ModelsGrid` changes, the `ModelsPage` itself requires no modifications.