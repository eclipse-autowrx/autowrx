## Component Layering (Pages → Organisms → Molecules → Atoms)

Layer rules

```
Pages
  - Route-level screens; fetch/compose high-level organisms
Organisms
  - Large sections; orchestrate multiple molecules
Molecules
  - Reusable feature blocks; compose atoms
Atoms
  - UI primitives
```

Example: Home page

```
PageHome
  ↳ HomeHeroSection (organism)
  ↳ HomeFeatureList (organism)
  ↳ HomeButtonList (organism)
  ↳ HomeNews (organism)
  ↳ HomePrototypeRecent (organism)
  ↳ HomePrototypePopular (organism)
```

Example: Navigation

```
NavigationBar (organism)
  ├─ DaGlobalSearch (molecule) → DaButton (atom)
  ├─ DaNavUser (molecule) → DaAvatar/DaMenu (atoms)
  ├─ ChatBox (molecule)
  └─ Uses DaImage/DaButton/DaMenu/DaTooltip (atoms)
```

Example: Model detail

```
PageModelDetail (page)
  ├─ DaImage (atom), DaInput (atom), DaButton (atom)
  ├─ DaVehicleProperties (molecule)
  ├─ DaContributorList (molecule)
  └─ DaConfirmPopup (molecule)
```

Example: Prototype detail tabs

```
PagePrototypeDetail (page)
  ├─ Tabs: DaTabItem (atom)
  ├─ PrototypeTabJourney (organism)
  ├─ PrototypeTabFlow (organism)
  ├─ PrototypeTabCode (organism)
  ├─ PrototypeTabDashboard (organism)
  ├─ PrototypeTabHomologation (organism)
  ├─ PrototypeTabTestDesign (organism)
  ├─ PrototypeTabArchitecture (organism)
  └─ DaRuntimeControl (molecule)
```


