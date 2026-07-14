// Copyright (c) 2025 Eclipse Foundation.
// SPDX-License-Identifier: MIT

import type { QueryClient } from '@tanstack/react-query'
import { ProjectTemplate } from '@/services/projectTemplate.service'

export const PROJECT_TEMPLATE_QUERY_KEYS = {
  adminList: ['project-templates'] as const,
  publicList: ['project-templates-list'] as const,
  edit: (id: string) => ['project-template-edit', id] as const,
}

export function invalidateProjectTemplateQueries(qc: QueryClient) {
  qc.invalidateQueries({ queryKey: PROJECT_TEMPLATE_QUERY_KEYS.adminList })
  qc.invalidateQueries({ queryKey: PROJECT_TEMPLATE_QUERY_KEYS.publicList })
}

export type ParsedProjectTemplate = {
  id: string
  name: string
  language: string
  code: string
  widget_config?: string
  customer_journey?: string
}

export type ProjectTemplateDataFields = {
  language: string
  code: string
  widget_config?: string
  customer_journey?: string
}

export type ProjectTemplateFormState = {
  name: string
  description: string
  visibility: 'public' | 'private'
  language: string
  code: string
  widget_config: string
  customer_journey: string
}

function parseDataBlob(data: string): Record<string, unknown> {
  try {
    return JSON.parse(data)
  } catch {
    return {}
  }
}

export function getProjectTemplateLanguage(t: ProjectTemplate): string {
  const parsed = parseDataBlob(t.data)
  return (parsed.language as string) || 'python'
}

export function deserializeProjectTemplate(
  t: ProjectTemplate,
): ProjectTemplateFormState {
  const parsed = parseDataBlob(t.data)
  const language = (parsed.language as string) || 'python'
  return {
    name: t.name || '',
    description: t.description || '',
    visibility: t.visibility || 'public',
    language,
    code: (parsed.code as string) || '',
    widget_config:
      (parsed.widget_config as string) || getDefaultDashboardCfg(language),
    customer_journey:
      typeof parsed.customer_journey === 'string' ? parsed.customer_journey : '',
  }
}

export function serializeProjectTemplateData(
  fields: ProjectTemplateDataFields,
): string {
  const payload: Record<string, string> = {
    language: fields.language,
    code: fields.code,
  }
  if (fields.widget_config !== undefined) {
    payload.widget_config = fields.widget_config
  }
  const journey = fields.customer_journey?.trim()
  if (journey) {
    payload.customer_journey = journey
  }
  return JSON.stringify(payload)
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
    const parsed = parseDataBlob(t.data)
    const customerJourney = parsed.customer_journey as string | undefined
    return {
      id: t.id,
      name: t.name,
      language: (parsed.language as string) || 'python',
      code: (parsed.code as string) || '',
      widget_config: parsed.widget_config as string | undefined,
      customer_journey: customerJourney?.trim() || undefined,
    }
  })
}

export function getDefaultDashboardCfg(language: string): string {
  if (language === 'rust') return '{"autorun": false, "widgets": [] }'
  return DEFAULT_DASHBOARD_CFG
}

export function isDefaultDashboardCfg(cfg: string, language: string): boolean {
  const normalized = cfg.replace(/\s/g, '')
  const pythonDefault = getDefaultDashboardCfg('python').replace(/\s/g, '')
  const rustDefault = getDefaultDashboardCfg('rust').replace(/\s/g, '')
  const langDefault = getDefaultDashboardCfg(language).replace(/\s/g, '')
  return (
    !normalized ||
    normalized === pythonDefault ||
    normalized === rustDefault ||
    normalized === langDefault ||
    normalized === '{"autorun":false,"widgets":[]}'
  )
}

export const EMPTY_PROJECT_TEMPLATE_FORM: ProjectTemplateFormState = {
  name: '',
  description: '',
  visibility: 'public',
  language: 'python',
  code: '',
  widget_config: getDefaultDashboardCfg('python'),
  customer_journey: '',
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
