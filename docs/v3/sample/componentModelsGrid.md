# Sample Organism: The `ModelsGrid`

This document provides a reference implementation for an "Organism" level component, `ModelsGrid`. It is a built-in component designed to be composed within a fixed-layout page like the [**Sample Models Page**](./pageModels.md).

Most importantly, it demonstrates the principle of **composition**, showing how a higher-level Organism is built by consuming a more generic, lower-level "Molecule" component (`StandardGrid`).

> **Relevant Principles:**
> *   [Component Granularity (Atoms, Molecules, Organisms)](./../layout.md#component-granularity-atoms-molecules-organisms)
> *   [Clarity & Maintainability](./../principle.md#1-clarity-and-maintainability)
> *   [Single Responsibility Principle](./../principle.md#2-solid-principles)

---

### File: `src/components/organisms/ModelsGrid.js`

The `ModelsGrid` organism has a specific business purpose: to display a grid of *models*. Its main job is to prepare the model-specific data and pass it in the correct format to the more generic `StandardGrid` molecule, which is only responsible for rendering a grid of items.

```jsx
import React from 'react';
import { StandardGrid } from '../molecules'; // A generic, reusable grid molecule
import { ModelCard } from '../molecules';   // A molecule for displaying one model

/**
 * An Organism for displaying a titled grid of models.
 */
const ModelsGrid = ({ title, models }) => {
  // If there are no models (e.g., still loading), don't render anything.
  // The page is responsible for showing a loading spinner if needed.
  if (!models || models.length === 0) {
    return null;
  }

  // The Organism's primary job is to adapt its specific data (`models`)
  // into the generic format expected by the Molecule (`StandardGrid`).
  const gridItems = models.map(model => ({
    id: model.id,
    // The `content` for each grid cell is another component, a ModelCard.
    content: <ModelCard model={model} /> 
  }));

  return (
    <div className="models-grid-organism">
      <h2>{title}</h2>
      {/* It renders the generic Molecule to handle the actual grid layout */}
      <StandardGrid items={gridItems} />
    </div>
  );
};

export default ModelsGrid;
```

---

### How It Adheres to Our Principles

1.  **Component Granularity & Composition:** This is a perfect example of our component layering. The `ModelsGrid` **Organism** is not concerned with the details of laying out a grid. It delegates that job to the `StandardGrid` **Molecule**. Its own concern is business-specific: knowing what a "model" is and how to prepare it for display.

2.  **Single Responsibility Principle (SRP):**
    *   The **`ModelsGrid`** organism is responsible for the business context of displaying models.
    *   The **`StandardGrid`** molecule is responsible for the generic task of arranging items in a grid.
    *   The **`ModelCard`** molecule is responsible for displaying the details of a single model.
    Each component has one clear job.

3.  **Reusability:** The `StandardGrid` molecule is now highly reusable. It could be used to render a grid of users, prototypes, or anything else, because it is decoupled from the specific "model" data structure. This is a key benefit of this compositional approach.
