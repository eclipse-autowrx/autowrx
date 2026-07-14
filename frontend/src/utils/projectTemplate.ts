// Copyright (c) 2025 Eclipse Foundation.
// SPDX-License-Identifier: MIT

import { ProjectTemplate } from '@/services/projectTemplate.service'

export type ParsedProjectTemplate = {
  id: string
  name: string
  language: string
  code: string
  widget_config?: string
  customer_journey?: string
}

const DEFAULT_DASHBOARD_CFG = `{
  "autorun": false,
  "widgets": [
    {
      "plugin": "Builtin",
      "widget": "Embedded-Widget",
      "options": {
        "api": "Vehicle.Body.Lights.Beam.Low.IsOn",
        "defaultImgUrl": "https://bestudio.digitalauto.tech/project/Ml2Sc9TYoOHc/light_off.png",
        "displayExactMatch": true,
        "valueMaps": [
          {
            "value": true,
            "imgUrl": "https://bestudio.digitalauto.tech/project/Ml2Sc9TYoOHc/light_on.png"
          },
          {
            "value": false,
            "imgUrl": "https://bestudio.digitalauto.tech/project/Ml2Sc9TYoOHc/light_off.png"
          }
        ],
        "url": "https://store-be.digitalauto.tech/data/store-be/Image%20by%20Signal%20value/latest/index/index.html",
        "iconURL": "https://upload.digitalauto.tech/data/store-be/3c3685b3-0b58-4f75-820e-9af0180cf3f0.png"
      },
      "boxes": [
        2,
        3,
        7,
        8
      ],
      "path": ""
    },
    {
      "plugin": "Builtin",
      "widget": "Embedded-Widget",
      "options": {
        "url": "https://store-be.digitalauto.tech/data/store-be/Terminal/latest/terminal/index.html",
        "iconURL": "https://upload.digitalauto.tech/data/store-be/e991ea29-5fbf-42e9-9d3d-cceae23600f0.png"
      },
      "boxes": [
        1,
        6
      ],
      "path": ""
    },
    {
      "plugin": "Builtin",
      "widget": "Embedded-Widget",
      "options": {
        "api": "Vehicle.Body.Lights.Beam.Low.IsOn",
        "lineColor": "#005072",
        "dataUpdateInterval": "1000",
        "maxDataPoints": "30",
        "url": "https://store-be.digitalauto.tech/data/store-be/Chart%20Signal%20Widget/latest/index/index.html",
        "iconURL": "https://upload.digitalauto.tech/data/store-be/f25ceb29-b9e8-470e-897a-4d843e16a0cf.png"
      },
      "boxes": [
        4,
        5
      ],
      "path": ""
    },
    {
      "plugin": "Builtin",
      "widget": "Embedded-Widget",
      "options": {
        "apis": [
          "Vehicle.Body.Lights.Beam.Low.IsOn"
        ],
        "vss_json": "https://bewebstudio.digitalauto.tech/data/projects/sHQtNwric0H7/vss_rel_4.0.json",
        "url": "https://store-be.digitalauto.tech/data/store-be/Signal%20List%20Settable/latest/table-settable/index.html",
        "iconURL": "https://upload.digitalauto.tech/data/store-be/dccabc84-2128-4e5d-9e68-bc20333441c4.png"
      },
      "boxes": [
        9,
        10
      ],
      "path": ""
    }
  ]
}`

export function parseProjectTemplates(
  results: ProjectTemplate[],
): ParsedProjectTemplate[] {
  return results.map((t) => {
    let parsed: Record<string, unknown> = {}
    try {
      parsed = JSON.parse(t.data)
    } catch {
      /* invalid JSON, use empty */
    }
    return {
      id: t.id,
      name: t.name,
      language: (parsed.language as string) || 'python',
      code: (parsed.code as string) || '',
      widget_config: parsed.widget_config as string | undefined,
      customer_journey: parsed.customer_journey as string | undefined,
    }
  })
}

export function getDefaultDashboardCfg(language: string): string {
  if (language === 'rust') return '{"autorun": false, "widgets": [] }'
  return DEFAULT_DASHBOARD_CFG
}

export const DUPLICATE_TEMPLATE_NAME_MESSAGE =
  'A project template with this name already exists'

export function getProjectTemplateErrorMessage(
  error: unknown,
  fallback: string,
): string {
  const err = error as {
    response?: { status?: number; data?: { message?: string } }
    message?: string
  }
  if (err?.response?.status === 409) {
    return err.response?.data?.message ?? DUPLICATE_TEMPLATE_NAME_MESSAGE
  }
  return err?.response?.data?.message ?? err?.message ?? fallback
}
