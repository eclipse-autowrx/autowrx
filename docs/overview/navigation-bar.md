## Navigation Bar (components/organisms/NavigationBar.tsx)

Purpose: top navigation, global search, user menu, feature entry points.

Composition

```
NavigationBar (organism)
  ├─ Logo → DaImage → link('/')</n+  ├─ Branding link (optional)
  ├─ Learning toggle (optional)
  ├─ Support link (optional)
  ├─ [signed-in]
  │   ├─ DaGlobalSearch (molecule)
  │   │   └─ trigger: DaButton (atom)
  │   ├─ Inventory shortcut (DaTooltip + Link + DaButton)
  │   ├─ ChatBox (molecule) [permission: aiAgent]
  │   └─ Admin menu (DaMenu)
  │       ├─ Manage Users
  │       └─ Manage Features
  ├─ LearningIntegration (modal) when learningMode
  └─ DaNavUser (molecule)
```

Permissions and state

```
useSelfProfileQuery() → user
usePermissionHook([MANAGE_USERS], ['aiAgent']) → isAuthorized, allowUseAgent
useLastAccessedModel() → lastAccessedModel (used for quick back from Inventory)
config flags → enableBranding | learning.url | enableSupport
```

Behavior highlights

```
- Inventory badge: shows last accessed model button when at /inventory/*
- Learning toggle: requires signed-in user; opens LearningIntegration
- Admin DaMenu appears only for isAuthorized
- ChatBox appears only when allowUseAgent
```

Styling

- Tailwind utility classes via project tokens (e.g., `da-nav-bar`, `text-da-*`).


