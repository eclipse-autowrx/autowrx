# Guiding Design Principles

This document outlines the high-level principles that guide the design of all frontend elements in the Autowrx platform. Adhering to these principles ensures that the platform remains lean, maintainable, consistent, and extensible.

For a complete overview of the platform's architecture, see the [**Platform Concepts**](./concept.md) document.

---

## 1. Clarity and Maintainability

**Rule:** All pages and components must be built in a way that is clear, easy to understand, and simple to maintain. Code should be self-documenting where possible, and complexity should be abstracted away into reusable modules.

### Page Design Demonstration

A page should not contain complex business logic. Its primary responsibility is to compose high-level components (Organisms) into a layout. The logic for how those components work is encapsulated within the components themselves.

**INCORRECT - Page with complex logic:**
```tsx
// src/pages/HomePage.js
function HomePage() {
  const [items, setItems] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  // Bad: Data fetching logic is mixed directly into the page
  useEffect(() => {
    fetch('/api/popular-prototypes')
      .then(res => res.json())
      .then(data => {
        setItems(data);
        setIsLoading(false);
      });
  }, []);

  return (
    <div>
      <Banner title="Welcome" />
      {/* Bad: Rendering logic is mixed directly into the page */}
      {isLoading ? <Spinner /> : <PrototypeGrid items={items} />}
    </div>
  );
}
```

**CORRECT - Page as a simple composer:**
```tsx
// src/pages/HomePage.js
import { PageLayout } from '../layouts';
import { Banner, PopularPrototypeList } from '../organisms';

// Good: The page is just a clean composition of high-level Organisms.
// All complex logic is encapsulated within those components.
function HomePage() {
  return (
    <PageLayout>
      <Banner title="Welcome" />
      <PopularPrototypeList />
    </PageLayout>
  );
}
```

### Component Design Demonstration

Components should be focused on a single responsibility. A component that fetches data, manages complex state, and renders a detailed UI is doing too much. This should be broken down.

**INCORRECT - A component with multiple responsibilities:**
```tsx
// Does everything: fetches data, manages state, and renders
function UserProfile() {
  const { userId } = useParams();
  const [user, setUser] = useState(null);

  useEffect(() => {
    fetch(`/api/users/${userId}`).then(res => res.json()).then(setUser);
  }, [userId]);

  if (!user) return <Spinner />;

  return (
    <div>
      <img src={user.avatarUrl} />
      <h1>{user.name}</h1>
      <p>{user.bio}</p>
    </div>
  );
}
```

**CORRECT - Responsibilities are separated:**
```tsx
// Custom Hook: Handles the data fetching and state management logic
function useUser(userId) {
  const [user, setUser] = useState(null);
  useEffect(() => {
    fetch(`/api/users/${userId}`).then(res => res.json()).then(setUser);
  }, [userId]);
  return user;
}

// Presentation Component: Only responsible for rendering the UI
function UserProfileDisplay({ user }) {
  if (!user) return <Spinner />;
  return (
    <div>
      <img src={user.avatarUrl} />
      <h1>{user.name}</h1>
      <p>{user.bio}</p>
    </div>
  );
}

// Container Component: Connects the logic to the presentation
function UserProfile() {
  const { userId } = useParams();
  const user = useUser(userId);
  return <UserProfileDisplay user={user} />;
}
```

---

## 2. SOLID Principles

Development must adhere to the **SOLID** principles of design. In a component-based frontend architecture, these can be interpreted and applied as follows:

### (S) Single Responsibility Principle (SRP)
> A component or module should have only one reason to change.

This means a component should be responsible for one piece of functionality. As shown in the "Clarity and Maintainability" section, we achieve this by separating concerns, for example, by moving data-fetching logic into custom hooks and keeping presentation components focused solely on rendering the UI.

### (O) Open/Closed Principle (OCP)
> Software entities should be open for extension, but closed for modification.

Our **Dynamic Component Architecture** is a prime example of this. The core rendering logic never needs to be modified. To add new functionality, you simply create and register a new component.

**INCORRECT - Modifying the core renderer:**
```jsx
// To add a new component, you MUST edit this file.
function renderComponent(type, props) {
  switch (type) {
    case 'banner': return <Banner {...props} />;
    case 'card': return <Card {...props} />;
    // I have to add my new component here...
    case 'new-feature': return <NewFeature {...props} />;
    default: return null;
  }
}
```

**CORRECT - Extending via a registry:**
```jsx
// The renderer is never modified. It's closed for modification.
function renderComponentByTypeName(type, props) {
  const Component = ComponentRegistry.get(type)?.component;
  return Component ? <Component {...props} /> : null;
}

// To add a new component, you create a new file and register it.
// The system is open for extension.
// in NewFeature.js
import { ComponentRegistry } from '../lib/ComponentRegistry';
const NewFeature = (props) => <div>...</div>;
ComponentRegistry.register('new-feature', NewFeature);
```

### (L) Liskov Substitution Principle (LSP)
> Subtypes must be substitutable for their base types.

In React, this means a component variant should be usable in the same way as its base component without causing errors. For example, different types of "Card" components should share a common set of props so they can be rendered interchangeably in a list.

**INCORRECT - Components with different prop APIs:**
```jsx
const SpecialCard = ({ headline, image }) => <div... />;
const NormalCard = ({ title, imgUrl }) => <div... />;

// This list renderer is brittle and complex because the components
// are not substitutable.
const CardList = ({ cards }) => (
  <div>
    {cards.map(card => card.type === 'special' 
      ? <SpecialCard headline={card.headline} image={card.image} />
      : <NormalCard title={card.title} imgUrl={card.imgUrl} />
    )}
  </div>
);
```

**CORRECT - Components with a shared prop API:**
```jsx
// Both components expect a `title` and `imageUrl` prop.
const SpecialCard = ({ title, imageUrl, extra }) => <div... />;
const NormalCard = ({ title, imageUrl }) => <div... />;

// The renderer is now simple because the components are substitutable.
// It can treat them the same.
const CardList = ({ cards }) => (
  <div>
    {cards.map(card => {
      const CardComponent = card.type === 'special' ? SpecialCard : NormalCard;
      return <CardComponent title={card.title} imageUrl={card.imageUrl} {...card} />;
    })}
  </div>
);
```

### (I) Interface Segregation Principle (ISP)
> Clients should not be forced to depend on interfaces (props) they do not use.

This means we should favor smaller, more specific components over large components with dozens of props that try to do everything. Avoid passing massive, all-encompassing objects as props when only a few properties are needed.

**INCORRECT - "Fat" component with a monolithic prop:**
```tsx
// This component is tightly coupled to the entire `user` object shape,
// even though it only needs two properties.
const UserAvatar = ({ user }) => (
  <div>
    <img src={user.profile.avatarUrl} />
    <span>{user.personalInfo.name}</span>
  </div>
);

// Usage
<UserAvatar user={massiveUserObject} />
```

**CORRECT - "Lean" component with segregated props:**
```tsx
// This component is decoupled and reusable. It doesn't care about the
// shape of the original user object, only the props it needs.
const UserAvatar = ({ avatarUrl, name }) => (
  <div>
    <img src={avatarUrl} />
    <span>{name}</span>
  </div>
);

// Usage
<UserAvatar avatarUrl={user.profile.avatarUrl} name={user.personalInfo.name} />
```

### (D) Dependency Inversion Principle (DIP)
> High-level modules should not depend on low-level modules. Both should depend on abstractions.

In our architecture, a high-level module like a `Page` should not directly depend on the concrete implementation of low-level components like `Banner` or `ProductList`. Instead, it should depend on an abstraction—in our case, the `renderComponentByTypeName` function and the Component Registry.

**INCORRECT - High-level page depends directly on low-level components:**
```tsx
import { Banner } from '../organisms/Banner';
import { ProductList } from '../organisms/ProductList';
import { UserProfile } from '../organisms/UserProfile';

// This page is tightly coupled to the specific components.
// It's hard to change the layout without modifying this file.
function HomePage({ config }) {
  return (
    <main>
      {config.showBanner && <Banner />}
      {config.showProducts && <ProductList />}
      {config.showProfile && <UserProfile />}
    </main>
  );
}
```

**CORRECT - Page depends on an abstraction:**
```tsx
// This page has no direct knowledge of Banner, ProductList, etc.
// It only depends on the rendering abstraction.
import { renderComponentByTypeName } from '../lib/renderComponentByTypeName';

// The page is now decoupled and driven by data, not code.
function HomePage({ config }) {
  return (
    <main>
      {config.rows.map(row => renderComponentByTypeName(row.type, row))}
    </main>
  );
}
```

By adhering to these principles, we build a frontend that is robust, flexible, and easy to maintain and extend over time.
