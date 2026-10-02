// Copyright (c) 2025 Eclipse Foundation.
//
// This program and the accompanying materials are made available under the
// terms of the MIT License which is available at
// https://opensource.org/licenses/MIT.
//
// SPDX-License-Identifier: MIT

import { QueryClient } from '@tanstack/react-query'

// Model lists live under several key families (listModelLite in
// FormCreateModel/PageModelDetail, listModelLiteOwned/Contributed/Editable in
// FormNewPrototype/FormCreatePrototype, modelsList in useListAllModels). They
// feed both the model grids and the client-side duplicate-name checks, so a
// model mutation must sweep all of them — the global staleTime is 30s.
export const invalidateModelListQueries = (queryClient: QueryClient) =>
  Promise.all([
    queryClient.invalidateQueries({ queryKey: ['listModelLite'] }),
    queryClient.invalidateQueries({ queryKey: ['listModelLiteOwned'] }),
    queryClient.invalidateQueries({ queryKey: ['listModelLiteContributed'] }),
    queryClient.invalidateQueries({ queryKey: ['listModelLiteEditable'] }),
    queryClient.invalidateQueries({ queryKey: ['modelsList'] }),
  ])
