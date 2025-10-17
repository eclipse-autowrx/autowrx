# Sample Hook: `useMyModels`

This document provides a reference implementation for a custom React hook responsible for fetching data. It demonstrates how we encapsulate data-fetching and state management logic, keeping our components clean and focused on their primary responsibility: rendering the UI.

This hook is used by the [**Sample Models Page**](./pageModels.md).

> **Relevant Principles:**
> *   [Clarity & Maintainability](./../principle.md#1-clarity-and-maintainability)
> *   [Single Responsibility Principle](./../principle.md#2-solid-principles)

---

### File: `src/hooks/useMyModels.js`

This hook has a single job: to fetch the current user's models from the API, manage the loading and error states of that request, and return the final data.

```jsx
import { useState, useEffect } from 'react';
import { api } from '../services/api'; // A fictional API service

/**
 * A custom hook to fetch the models created by the current user.
 * It handles the entire lifecycle of the data request: loading, success, and error.
 * @returns {{ data: any[], isLoading: boolean, error: any }}
 */
export const useMyModels = () => {
  const [data, setData] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    // A self-invoking async function to fetch data
    (async () => {
      try {
        setIsLoading(true);
        const response = await api.get('/models/my-models');
        setData(response.data);
        setError(null);
      } catch (err) {
        setError(err);
        setData([]);
      } finally {
        setIsLoading(false);
      }
    })();
  }, []); // The empty dependency array ensures this runs once on mount

  // The hook returns an object with a clear interface, making it easy
  // for the consuming component to know the state of the request.
  return { data, isLoading, error };
};
```
*Note: In a real-world application, we would likely use a more robust data-fetching library like `react-query` or `swr`, but the principle of encapsulating logic in a hook remains the same.*

---

### How It Adheres to Our Principles

1.  **Single Responsibility Principle (SRP):** This is a perfect example of SRP. The hook's one and only responsibility is to fetch the user's models. It doesn't know or care about how this data will be displayed. This makes it highly reusable—any component that needs the user's models can now get them by calling `useMyModels()`.

2.  **Clarity and Maintainability:** The logic for fetching these models is now in one, easy-to-find place. If the API endpoint changes or we need to add more complex logic (like caching), we only have to modify this single file. The components that use this hook, like the `ModelsPage`, remain completely unchanged.

3.  **Separation of Concerns:** This approach creates a clean separation between the "view" (the component) and the "logic" (the hook). The component is concerned with *what* to display, while the hook is concerned with *how* to get it.
