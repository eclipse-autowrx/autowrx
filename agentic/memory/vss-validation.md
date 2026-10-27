# Validate complete VSS trees before wishlist extraction

Verified 2026-10-26. `model.service.processApiData` validates the complete input
before detaching wishlist signals into ExtendedApi rows. The stored `custom_vss`
base can consequently contain branches that become populated only when
`api.service.computeVSSApi` merges those rows. Do not validate the detached base
as a complete runtime specification. Runtime preflight validates the assembled
tree through `vssValidation.service`.

Sources: `backend/src/services/model.service.js`,
`backend/src/services/api.service.js`, `backend/src/services/vssValidation.service.js`.
