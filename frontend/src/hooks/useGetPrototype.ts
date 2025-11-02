// Copyright (c) 2025 Eclipse Foundation.
// 
// This program and the accompanying materials are made available under the
// terms of the MIT License which is available at
// https://opensource.org/licenses/MIT.
//
// SPDX-License-Identifier: MIT

import { useQuery } from "@tanstack/react-query"
import { getPrototype } from "@/services/prototype.service"

const useGetPrototype = (prototype_id: string) => {
  return useQuery({ queryKey: ["getPrototype", prototype_id], queryFn: () => getPrototype(prototype_id) })
}

export default useGetPrototype

