# Plugin API Reference

The host passes a `PluginAPI` object to your plugin component as `props.api`. It exposes **27 methods across 7 categories**. Every method is **optional** — a method is only attached when the context it needs exists (see the "Present when" note on each). Always guard calls: `api.updateModel?.(...)`.

> Source of truth: [`frontend/src/types/plugin.types.ts`](../../../frontend/src/types/plugin.types.ts). The construction and context-gating live in `frontend/src/components/organisms/PluginPageRender.tsx`.

```ts
interface PluginAPI {
  // Model & Prototype (2)
  updateModel?: (updates: Partial<Model>) => Promise<Model>
  updatePrototype?: (updates: Partial<Prototype>) => Promise<Prototype>

  // Vehicle API (6)
  getComputedAPIs?: (model_id?: string) => Promise<CVI>
  getApiDetail?: (api_name: string, model_id?: string) => Promise<VehicleAPI>
  listVSSVersions?: () => Promise<string[]>
  replaceAPIs?: (api_data_url: string, model_id?: string) => Promise<void>
  setRuntimeApiValues?: (values: Record<string, any>) => void
  getRuntimeApiValues?: () => Record<string, any>

  // Navigation (1)
  setActiveTab?: (tab: string, pluginSlug?: string) => void

  // Wishlist APIs (5)
  createWishlistApi?: (data: ExtendedApiCreate) => Promise<ExtendedApiRet>
  updateWishlistApi?: (id: string, data: Partial<ExtendedApiCreate>) => Promise<Partial<ExtendedApiCreate>>
  deleteWishlistApi?: (id: string) => Promise<void>
  getWishlistApi?: (name: string, model_id?: string) => Promise<ExtendedApi>
  listWishlistApis?: (model_id?: string) => Promise<List<ExtendedApi>>

  // Assets (8)
  listAssets?: (params?: Pick<QueryAssetsParams, 'type' | 'name'>) => Promise<Asset[]>
  createAsset?: (payload: { name: string; type: string; data?: string }) => Promise<Asset>
  updateAsset?: (assetId: string, payload: { name?: string; type?: string; data?: string }) => Promise<Asset>
  deleteAsset?: (assetId: string) => Promise<void>
  searchUserByEmail?: (email: string) => Promise<{ id: string; name: string; email?: string; image_file?: string } | null>
  getAssetUsers?: (assetId: string) => Promise<Array<{ id: string; name: string; email?: string; image_file?: string; forbid_remove?: boolean }>>
  shareAsset?: (assetId: string, userId: string) => Promise<void>
  removeAssetAccess?: (assetId: string, userId: string) => Promise<void>

  // Files (1)
  uploadFile?: (file: File) => Promise<{ url: string }>

  // Kit / Runtime (4)
  fetchSignalMapping?: (kitName: string) => Promise<string>
  replaceSignalMapping?: (kitName: string, fileContent: string) => Promise<void>
  fetchVss?: (kitName: string) => Promise<string>
  replaceVss?: (kitName: string, vssContent: string) => Promise<void>
}
```

## Model & Prototype

| Method | Description | Present when |
|---|---|---|
| `updateModel(updates: Partial<Model>): Promise<Model>` | Update the current model. Use the `extend` field for plugin data; preserve existing with `...data?.model?.extend`. | `model_id` exists |
| `updatePrototype(updates: Partial<Prototype>): Promise<Prototype>` | Update the current prototype. | `prototype_id` exists |

## Vehicle API

| Method | Description | Present when |
|---|---|---|
| `getComputedAPIs(model_id?): Promise<CVI>` | Full computed VSS API tree; `CVI = { [apiPath: string]: VehicleAPI }`. | `model_id` exists |
| `getApiDetail(api_name, model_id?): Promise<VehicleAPI>` | Detail for one API path (e.g. `'Vehicle.Speed'`). `VehicleAPI`: `name`, `datatype`, `type` (sensor/actuator/attribute), `unit?`, `min?`, `max?`, `description?`. | `model_id` exists |
| `listVSSVersions(): Promise<string[]>` | Available VSS release versions (e.g. `['4.0', '3.1', ...]`). | always |
| `replaceAPIs(api_data_url, model_id?): Promise<void>` | Replace **all** APIs for the model with a new VSS spec JSON at the given URL. ⚠️ destructive. | `model_id` exists |
| `setRuntimeApiValues(values: Record<string, any>): void` | Set runtime/simulation values (sync). Stored in the host runtime store; persists until runtime reset. | always |
| `getRuntimeApiValues(): Record<string, any>` | Read current runtime values (sync). | always |

## Navigation

| Method | Description | Present when |
|---|---|---|
| `setActiveTab(tab, pluginSlug?): void` | Switch the active prototype tab. Built-in tab keys: `view`, `journey`, `code`, `dashboard`, `feedback`, `staging`, `plug`. `pluginSlug` is required when `tab === 'plug'` (activates a custom plugin tab). | the host passes an `onSetActiveTab` handler (typically always) |

## Wishlist APIs (custom/extended vehicle signals)

| Method | Description | Present when |
|---|---|---|
| `createWishlistApi(data: ExtendedApiCreate): Promise<ExtendedApiRet>` | Create a custom signal. `ExtendedApiCreate`: `model`, `apiName`, `description`, `type` (sensor/actuator/attribute), `datatype`, `skeleton`, `isWishlist` (must be `true`), `unit?`, `min?`, `max?`. | always |
| `updateWishlistApi(id, data: Partial<ExtendedApiCreate>): Promise<Partial<ExtendedApiCreate>>` | Update an existing custom signal by ID. | always |
| `deleteWishlistApi(id): Promise<void>` | Delete a custom signal (permanent). | always |
| `getWishlistApi(name, model_id?): Promise<ExtendedApi>` | Get one custom signal by name. | `model_id` exists |
| `listWishlistApis(model_id?): Promise<List<ExtendedApi>>` | List custom signals for the model. `List<T> = { results: T[]; page; limit; totalPages; totalResults }`. | `model_id` exists |

## Assets (hardware kits / cloud runtimes + sharing)

| Method | Description | Present when |
|---|---|---|
| `listAssets(params?: { type?, name? }): Promise<Asset[]>` | Assets owned by or shared with the current user. Filter by `type` (`'HARDWARE_KIT'`, `'CLOUD_RUNTIME'`) or `name`. | always |
| `createAsset({ name, type, data? }): Promise<Asset>` | Create a new asset. | always |
| `updateAsset(assetId, { name?, type?, data? }): Promise<Asset>` | Update an asset by ID. | always |
| `deleteAsset(assetId): Promise<void>` | Delete an asset by ID. | always |
| `searchUserByEmail(email): Promise<{ id, name, email?, image_file? } \| null>` | Look up a user for sharing. | always |
| `getAssetUsers(assetId): Promise<Array<{ id, name, email?, image_file?, forbid_remove? }>>` | Users with access to an asset. | always |
| `shareAsset(assetId, userId): Promise<void>` | Grant a user read access to an asset. | always |
| `removeAssetAccess(assetId, userId): Promise<void>` | Revoke a user's access to an asset. | always |

## Files

| Method | Description | Present when |
|---|---|---|
| `uploadFile(file: File): Promise<{ url: string }>` | Upload a file (max **50 MB**, any type). Stored under `/static/uploads/YYYY-MM-DD/`, returns its URL. | always |

## Kit / Runtime (connected hardware kits)

These open their **own** Socket.IO connections to the external kit server (`config.runtime?.url`, default `https://kit.digitalauto.tech`). Each call targets a kit by name. `replace*` methods also trigger a vehicle-model rebuild on the kit.

| Method | Description | Present when |
|---|---|---|
| `fetchSignalMapping(kitName): Promise<string>` | Read the kit's `signal-config.json` as a string. | always |
| `replaceSignalMapping(kitName, fileContent): Promise<void>` | Write `signal-config.json` and rebuild the model. | `model_id` exists |
| `fetchVss(kitName): Promise<string>` | Read the kit's `vss.json` as a string. | always |
| `replaceVss(kitName, vssContent): Promise<void>` | Write `vss.json` and trigger a model rebuild. | always |

## Component props & registration

Your component is rendered with `PluginPageProps`:

```ts
interface PluginPageProps {
  data?: any                                          // { model?, prototype?, ... } depending on context
  editable?: boolean                                  // host WRITE_MODEL permission for the current model
  config?: { plugin_id?: string; [k: string]: any }   // plugin config merged with PUBLIC site configs
  api?: PluginAPI
}
```

The registration object you assign to `window.DAPlugins['page-plugin']`:

```ts
interface PluginRegistration {
  components?: {
    Page?: React.ComponentType<PluginPageProps>
    [key: string]: React.ComponentType<any> | undefined
  }
  mount?: (element: HTMLElement, props?: PluginPageProps) => void
  unmount?: (element?: HTMLElement | null) => void
}
```

Provide **either** `components.Page` (host renders it with React) **or** the imperative `mount`/`unmount` pair (host wraps them in a container). The registration key must be the fixed string `'page-plugin'`.

## Error handling

Every host-provided method wraps its service call with toast feedback (success/error) and **rethrows** on failure — so `try/catch` around `await api.x(...)` lets you react to errors. Methods whose context is missing are simply `undefined`; calling them without the `?.` guard throws `TypeError`.