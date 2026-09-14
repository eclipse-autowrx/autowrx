# Concepts & Glossary

Read this first — the rest of the docs (and the code) assume this vocabulary.

---

## The big picture

AutoWRX lets a developer, in the browser, **build and run software against a
virtual vehicle**. You pick a **vehicle model**, write a **prototype**
(app) that reads and writes the vehicle's **signals** (APIs), watch it run live
on a **dashboard**, and — when ready — deploy it to a real **runtime/kit**.

```
Model (a vehicle + its API catalog)
  └── Prototype (an app: code + dashboard + journey)
        ├── runs against → Vehicle APIs (VSS signals)
        └── executes on  → a Runtime / Kit (local, cloud, or hardware)
```

Around this core, the platform stays **lean** and pushes optional features into
**plugins** (the [Core-vs-Plugin philosophy](../principles/core-vs-plugin.md)).

---

## Glossary

| Term | What it means |
|---|---|
| **SDV** | Software-Defined Vehicle — a vehicle whose features are delivered/updated as software. AutoWRX is a prototyping playground for SDV apps. |
| **digital.auto** | The broader ecosystem AutoWRX belongs to (the public playground is *playground.digital.auto*). |
| **Model** | A *vehicle model* — a named vehicle plus its **API catalog** (the signals it exposes) and configuration. Owned by a user; can be public or private. |
| **Vehicle API / Signal** | An addressable vehicle data point, e.g. `Vehicle.Speed` or `Vehicle.Body.Lights.Beam.Low.IsOn`. Each has a type (branch / sensor / actuator), datatype, unit. |
| **VSS** | [Vehicle Signal Specification](https://covesa.github.io/vehicle_signal_specification/) — the COVESA standard tree that defines the standard signals. A model's API catalog is built from a VSS version. |
| **CVI** | The computed API tree for a model (COVESA VSS + the model's custom/wishlist APIs), stored in the `apis` collection. |
| **Wishlist / Extended API** | A custom signal a user adds to a model beyond standard VSS (`extendedapis`). |
| **Prototype** | An *app* built on a model: source **code** (Python / C++ / Rust), a **dashboard** (widgets), a **customer journey**, feedback, and staging config. |
| **Widget / Dashboard** | The visual runtime UI. Widgets read live signal values (and can write them) on a grid dashboard. |
| **Runtime / Kit** | A host that actually **executes** prototype code against a (real or simulated) vehicle — local, cloud (`CLOUD_RUNTIME`), or hardware (`HARDWARE_KIT`). Managed by an external **kit-manager** server. |
| **KUKSA** | Eclipse KUKSA — the VSS data-broker model the kits follow. AutoWRX speaks a generic protocol to the kit; KUKSA lives inside the kit. |
| **Plugin** | An optional extension: a JS bundle that registers UI/behavior, loaded dynamically by URL. Most non-core features are plugins. |
| **Addon / Tab** | How a plugin is attached to a model or prototype — as a custom tab in the UI (stored in the model's `custom_template`). |
| **Template** | A reusable scaffold — `ModelTemplate`, `DashboardTemplate`, or `ProjectTemplate` — to start new work from a known-good config. |
| **Asset** | A user-owned resource (e.g. a cloud runtime, hardware kit, or GenAI config). Assets can also authenticate for service use. |
| **Core vs. Plugin** | The architectural rule: keep a small stable core, deliver most features as optional plugins. |

---

## How the pieces fit (one sentence each)

- **A user** owns **models**; each model has an **API catalog** (from VSS + custom APIs).
- **A prototype** belongs to a model and is an app: **code + dashboard + journey**.
- **Running** a prototype connects the browser to a **kit/runtime** that executes
  the code and streams **signal values** back to the dashboard in real time.
- **Plugins** add tabs/features to models and prototypes without bloating the core.

Now you're ready to [run it locally »](./local-development.md)

*For the deeper "why", see [Platform Concepts](../principles/concept.md) and
[Design Principles](../principles/principle.md).*
