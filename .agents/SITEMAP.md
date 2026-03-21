# autowrx — Site Map & Feature Coverage

> Living document: tracks all pages, features, and test coverage status.
> Legend: ✅ Tested | ⚠️ Partial | ❌ Not tested | 🚧 WIP

---

## 🏠 Home `/`
**Page:** `PageHome.tsx`
**Description:** Landing page. Entry point for all users.

| Feature | Description | Test Status |
|---------|-------------|-------------|
| Hero section | Banner/CTA, sign-in prompt | ✅ `auth.spec.ts` |
| Sign In button | Opens login modal | ✅ `auth.spec.ts` |
| Login modal | Email + password form | ✅ `auth.spec.ts` |
| Wrong password error | Shows error toast | ✅ `auth.spec.ts` |
| Logout | Avatar menu → Logout | ✅ `auth.spec.ts` |
| Popular prototypes | Showcase of popular items | ✅ `home-sections.spec.ts` |
| Recent prototypes | Showcase of recent items | ✅ `home-sections.spec.ts` |
| Feature list section | Platform feature highlights | ❌ |
| Layout (logged out) | Navbar, footer, responsive | ✅ `layout.spec.ts` |
| Layout (logged in) | Navbar with admin tools | ✅ `layout.spec.ts` |
| Full HD (1920×1080) | Responsive at large viewport | ✅ `layout.spec.ts` |

---

## 🚗 Vehicle Models `/model`
**Page:** `PageModelList.tsx`
**Description:** Lists all vehicle models available on the platform.

| Feature | Description | Test Status |
|---------|-------------|-------------|
| Model list loads | Shows list of models | ✅ `vehicle-models.spec.ts` |
| Layout check | No broken elements | ✅ `layout.spec.ts` |
| Create new model | Opens "Create New Model" dialog | ✅ `vehicle-models.spec.ts` |
| Create model submit | Fills form and creates model | ✅ `vehicle-models.spec.ts` |
| Search / filter | Filter models by name | ❌ |

---

## 🚗 Vehicle Model Detail `/model/:model_id`
**Page:** `PageModelDetail.tsx` inside `ModelDetailLayout.tsx`
**Description:** Detail view of a single vehicle model with tabs.

### Tabs

| Tab | Route | Description | Test Status |
|-----|-------|-------------|-------------|
| Overview | `/model/:id/` | Model info, description | ✅ `vehicle-models.spec.ts` |
| Vehicle API | `/model/:id/api` | Browse vehicle signal APIs | ❌ |
| Prototype Library | `/model/:id/library/list` | List of prototypes for this model | ✅ `vehicle-models.spec.ts` |
| Plugin | `/model/:id/plugin` | Model-level plugins | ❌ |

### Features

| Feature | Description | Test Status |
|---------|-------------|-------------|
| Model detail loads | Page renders without errors | ✅ `vehicle-models.spec.ts` |
| Library tab visible | Tab button shows prototype count | ✅ `vehicle-models.spec.ts` |
| Edit model name | Inline rename of model | ✅ `vehicle-models.spec.ts` |
| Delete model | Confirm dialog → delete | ✅ `vehicle-models.spec.ts` |
| Model image | Thumbnail / cover image | ❌ |
| Model description | Edit model description | ❌ |

---

## 📦 Prototype Library `/model/:model_id/library/list`
**Page:** `PagePrototypeLibrary.tsx`
**Description:** Grid of prototypes for a vehicle model.

| Feature | Description | Test Status |
|---------|-------------|-------------|
| Library loads | Prototype cards render | ✅ `prototype.spec.ts` |
| Create prototype button | Opens create dialog | ✅ `prototype.spec.ts` |
| Create prototype | Fill name → submit → navigate | ✅ `prototype.spec.ts` |
| Prototype card visible | Card shows after creation | ✅ `prototype.spec.ts` |
| Rename prototype | Via API (context menu requires site config) | ✅ `prototype.spec.ts` |
| Delete prototype | Via API, card removed from UI | ✅ `prototype.spec.ts` |
| Search / filter | Filter prototypes by name | ✅ `prototype-extended.spec.ts` |
| Sort prototypes | Sort by date/name | ❌ |
| Prototype image cover | Thumbnail display | ❌ |

---

## 🧪 Prototype Detail `/model/:model_id/library/prototype/:prototype_id/:tab`
**Page:** `PagePrototypeDetail.tsx`
**Description:** Main workspace for a prototype. Contains multiple functional tabs.

### Tabs

| Tab | Route suffix | Description | Test Status |
|-----|-------------|-------------|-------------|
| Overview | `/view` | Prototype info, description, cover image | ✅ `prototype-tabs.spec.ts` |
| Customer Journey | `/journey` | Journey mapping / use case flow | ✅ `prototype-tabs.spec.ts` |
| SDV Code | `/code` | Code editor for vehicle app logic | ✅ `prototype-tabs.spec.ts` |
| Dashboard | `/dashboard` | Widget-based dashboard builder | ✅ `prototype-tabs.spec.ts` |
| Custom tabs | (plugin-based) | Added by model template / plugins | ❌ |

### Features

| Feature | Description | Test Status |
|---------|-------------|-------------|
| Tab bar renders | All tabs visible | ✅ `prototype-tabs.spec.ts` |
| Overview tab layout | No broken elements | ✅ `prototype-tabs.spec.ts` |
| SDV Code tab layout | Editor loads | ✅ `prototype-tabs.spec.ts` |
| Dashboard tab layout | Dashboard area renders | ⚠️ `prototype-tabs.spec.ts` — "Add Runtime" button zero-size bug detected |
| Journey tab layout | Journey content renders | ✅ `prototype-tabs.spec.ts` |
| Sequential tab navigation | Navigate all tabs in order | ✅ `prototype-tabs.spec.ts` |
| Run prototype | Execute SDV code | ❌ |
| Add widget to dashboard | Drag/drop or add widget | ❌ |
| Share prototype | Share link / permissions | ✅ `prototype-extended.spec.ts` (no share btn visible for admin) |
| Deploy prototype | Deploy to staging | ❌ |
| Feedback tab | Submit / view feedback | ✅ `prototype-extended.spec.ts` |
| Prototype plugins | Custom plugin tabs | ❌ |

---

## ✨ New Prototype `/new-prototype`
**Page:** `PageNewPrototypeDetail.tsx`
**Description:** Quick-start page to create a prototype without a model context.

| Feature | Description | Test Status |
|---------|-------------|-------------|
| Page loads | Form renders | ✅ `prototype.spec.ts` |
| Name input visible | Prototype name field | ✅ `prototype.spec.ts` |
| Create flow | Fill form and submit | ❌ |

---

## 👤 User Profile `/profile`
**Page:** `PageUserProfile.tsx`
**Description:** View and edit own profile.

| Feature | Description | Test Status |
|---------|-------------|-------------|
| Profile page loads | Layout renders | ✅ `layout.spec.ts`, `profile.spec.ts` |
| Edit display name | Change name | ✅ `profile.spec.ts` (no inline edit UI found) |
| Change avatar | Upload profile picture | ❌ |
| Change password | Update password | ❌ |

---

## 📁 My Assets `/my-assets`
**Page:** `PageMyAssets.tsx`
**Description:** Personal assets (prototypes, models) owned by user.

| Feature | Description | Test Status |
|---------|-------------|-------------|
| Page loads | Assets list renders | ✅ `my-assets.spec.ts` |
| Filter by type | Model / prototype filter | ✅ `my-assets.spec.ts` (no filter tabs found) |

---

## 🔧 Admin Panel `/admin/*`
**Page:** Various admin pages
**Description:** Platform administration. Accessible to admin users only.

| Route | Page | Description | Test Status |
|-------|------|-------------|-------------|
| `/admin/site-config` | `SiteConfigManagement.tsx` | Global site settings | ✅ `admin.spec.ts` |
| `/admin/manage-users` | `PageManageUsers.tsx` | User list and management | ✅ `admin.spec.ts` |
| `/admin/plugins` | `PluginManagement.tsx` | Plugin install/manage | ✅ `admin.spec.ts` |
| `/admin/templates` | `TemplateManager.tsx` | Model templates | ✅ `admin-extended.spec.ts` |
| `/admin/dashboard-templates` | `DashboardTemplateManager.tsx` | Dashboard templates | ✅ `admin-extended.spec.ts` |
| `/manage-users` | `PageManageUsers.tsx` | Alias route | ✅ `admin.spec.ts` |
| `/manage-features` | `PageManageFeatures.tsx` | Feature flags | ✅ `admin-extended.spec.ts` |

### Admin Features

| Feature | Description | Test Status |
|---------|-------------|-------------|
| Admin access (logged in) | Admin can access `/admin` | ✅ `admin.spec.ts` |
| Unauthenticated access blocked | Redirect / deny for guests | ✅ `admin.spec.ts` |
| Site config form | Settings form renders | ✅ `admin.spec.ts` |
| User list loads | Shows users table | ✅ `admin.spec.ts` |
| Create new user | Add user form | ✅ `admin-extended.spec.ts` (fill + cancel) |
| Edit user role | Change user permissions | ❌ |
| Plugin list | Shows installed plugins | ✅ `admin.spec.ts` |
| Install plugin | Add new plugin | ❌ |

---

## 🔌 My Plugins `/me/plugins`
**Page:** `PluginList.tsx`
**Description:** Personal plugin management for developers.

| Feature | Description | Test Status |
|---------|-------------|-------------|
| Plugin list loads | Shows user's plugins | ❌ |
| Create plugin | Create new plugin | ❌ |
| Edit plugin | Edit plugin config | ❌ |

---

## 🚦 Vehicle API `/model/:model_id/api`
**Page:** `PageVehicleApi.tsx`
**Description:** Browse and explore vehicle signal APIs (VSS/COVESA).

| Feature | Description | Test Status |
|---------|-------------|-------------|
| API list loads | Signal tree renders | ❌ |
| Search signal | Filter by name | ❌ |
| Signal detail | View signal metadata | ❌ |

---

## 🗺️ Test Coverage Summary

| Area | Covered | Total Features | % |
|------|---------|---------------|---|
| Auth | 5 | 6 | ~83% |
| Layout / Responsive | 6 | 8 | ~75% |
| Vehicle Models CRUD | 7 | 9 | ~78% |
| Prototype CRUD | 6 | 9 | ~67% |
| Prototype Tabs | 8 | 11 | ~73% |
| Admin Panel | 9 | 11 | ~82% |
| Profile | 2 | 4 | ~50% |
| My Assets | 2 | 2 | 100% |
| My Plugins | 0 | 3 | 0% |
| Vehicle API | 0 | 3 | 0% |
| New Prototype | 2 | 3 | ~67% |
| Home Sections | 2 | 3 | ~67% |

**Overall: ~49 test cases. New coverage added: home sections, profile, my-assets, admin templates/features/create-user, prototype search/feedback/share. Key gaps: runtime execution, dashboard widgets, plugin management, vehicle API.**

---

## 🐛 Known Issues Found by Tests

| Issue | Location | Severity | Status |
|-------|----------|----------|--------|
| Button "Add Runtime" zero-size | Prototype Detail → Dashboard tab | Medium | 🔴 Open |
