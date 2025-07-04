// Copyright (c) 2025 Eclipse Foundation.
// 
// This program and the accompanying materials are made available under the
// terms of the MIT License which is available at
// https://opensource.org/licenses/MIT.
//
// SPDX-License-Identifier: MIT

import JSZip from 'jszip'
import axios from 'axios'
import { saveAs } from 'file-saver'
import { Model, Prototype } from '@/types/model.type'
// import { getPlugins }
import { listModelPrototypes } from '@/services/prototype.service'
import { CVI_v4_1 } from '@/data/CVI_v4.1'
import {
  getExtendedApi,
  listExtendedApis,
} from '@/services/extendedApis.service'

import { convertCode } from '@/services/convert_code.service'
import DaWidgetSetup from '@/components/molecules/widgets/DaWidgetSetup'

const removeSpecialCharacters = (str: string) => {
  return str.replace(/[^a-zA-Z0-9 ]/g, '')
}

const getImgFile = (zip: JSZip, imageUrl: string, filename: string) => {
  return new Promise<void>((resolve, reject) => {
    axios
      .get(imageUrl, { responseType: 'arraybuffer' })
      .then((response) => {
        zip.file(filename, response.data, { binary: true })
        resolve()
      })
      .catch((error) => {
        console.error('Error downloading image:', error)
        resolve()
      })
  })
}

const downloadAllPrototypeInModel = async (model: Model, zip: JSZip) => {
  try {
    if (!model || !model.id) return
    const prototypes = await listModelPrototypes(model.id)
    zip.file(
      'prototypes.json',
      JSON.stringify(
        prototypes.map((prototype) => ({
          name: prototype.name,
          description: prototype.description,
          tags: prototype.tags,
          state: prototype.state,
          model_id: prototype.model_id,
          image_file: prototype.image_file,
          complexity_level: prototype.complexity_level,
          // journey_image_file: prototype.journey_image_file,
          // analysis_image_file: prototype.analysis_image_file,
          customer_journey: prototype.customer_journey,
          // partner_logo: prototype.partner_logo,
        })),
        null,
        4,
      ),
    )
    for (const prototype of prototypes) {
      zip.file(`prototypes/${prototype.name}/code.py`, prototype.code)
      zip.file(
        `prototypes/${prototype.name}/dashboard.json`,
        prototype.widget_config || '{"widgets": []}',
      )
      zip.file(
        `prototypes/${prototype.name}/metadata.json`,
        JSON.stringify(
          {
            name: prototype.name,
            description: prototype.description,
            tags: prototype.tags,
            state: prototype.state,
            model_id: prototype.model_id,
            image_file: prototype.image_file,
            complexity_level: prototype.complexity_level,
            // journey_image_file: prototype.journey_image_file,
            // analysis_image_file: prototype.analysis_image_file,
            customer_journey: prototype.customer_journey,
            // partner_logo: prototype.partner_logo,
          },
          null,
          4,
        ),
      )
      if (prototype.image_file) {
        await getImgFile(
          zip,
          prototype.image_file,
          `prototypes/${prototype.name}/image_file.png`,
        )
      }
    }
  } catch (err) { }
}

export const downloadModelZip = async (model: Model) => {
  if (!model) return

  try {
    const extended_apis = (await listExtendedApis(model.id))?.results || []

    const zip = new JSZip()
    const zipFilename = `model_${removeSpecialCharacters(model.name)}.zip`
    // Deprecated
    zip.file('vss.json', JSON.stringify(JSON.parse(CVI_v4_1), null, 4)) // Using default CVI while waiting for new CVI api
    zip.file('custom_api.json', JSON.stringify(model.custom_apis, null, 4))

    zip.file('extended_apis.json', JSON.stringify(extended_apis, null, 4))
    zip.file(
      'metadata.json',
      JSON.stringify(
        {
          name: model.name,
          model_files: JSON.stringify(model.model_files, null, 4),
          main_api: model.main_api,
          model_home_image_file: model.model_home_image_file,
          visibility: model.visibility,
          api_version: model.api_version,
        },
        null,
        4,
      ),
    )
    if (model.model_home_image_file) {
      await getImgFile(
        zip,
        model.model_home_image_file,
        'model_home_image_file.png',
      )
    }
    // await downloadAllPluginInModel(model, zip)
    await downloadAllPrototypeInModel(model, zip)

    const content = await zip.generateAsync({ type: 'blob' })
    saveAs(content, zipFilename)
  } catch (err) { }
}

export const zipToModel = async (file: File) => {
  const zip = new JSZip()
  const model: any = {
    name: '',
    main_api: '',
    cvi: '',
    custom_apis: {},
    model_files: {},
    model_home_image_file: '',
    visibility: '',
    extended_apis: [],
    api_version: 'v4.1',
  }
  let plugins: any[] = []
  let prototypes: any[] = []

  try {
    const zipFile = await zip.loadAsync(file)
    if (!zipFile) throw new Error('Error on import model')
    const metadata: any = JSON.parse(
      (await zipFile.file('metadata.json')?.async('string')) || '{}',
    )
    Object.assign(model, metadata)
    model.model_files = JSON.parse(metadata.model_files || '{}')

    model.cvi = (await zipFile.file('vss.json')?.async('string')) || '{}'
    model.custom_apis = JSON.parse(
      (await zipFile.file('custom_api.json')?.async('string')) || '{}',
    )
    model.extended_apis = JSON.parse(
      (await zipFile.file('extended_apis.json')?.async('string')) || '[]',
    )

    const prototypesStr =
      (await zipFile.file('prototypes.json')?.async('string')) || '[]'
    prototypes = JSON.parse(prototypesStr)
    for (const prototype of prototypes) {
      prototype.code =
        (await zipFile
          .file(`prototypes/${prototype.name}/code.py`)
          ?.async('string')) || ''
      prototype.widget_config =
        (await zipFile
          .file(`prototypes/${prototype.name}/dashboard.json`)
          ?.async('string')) || '[]'
    }

    const pluginsStr =
      (await zipFile.file('plugins.json')?.async('string')) || '[]'
    plugins = JSON.parse(pluginsStr)
  } catch (err) {
    return null
  }
  return { model, plugins, prototypes }
}

export const downloadPrototypeZip = async (prototype: Prototype) => {
  if (!prototype) return

  try {
    const zip = new JSZip()
    const zipFilename = `prototype_${removeSpecialCharacters(prototype.name)}.zip`
    zip.file('code.py', prototype.code)
    zip.file('dashboard.json', prototype.widget_config || '{"widgets":[]}')
    zip.file(
      'metadata.json',
      JSON.stringify(
        {
          name: prototype.name,
          description: prototype.description,
          state: prototype.state,
          tags: prototype.tags,
          model_id: prototype.model_id,
          image_file: prototype.image_file,
          complexity_level: prototype.complexity_level,
          // journey_image_file: prototype.journey_image_file,
          // analysis_image_file: prototype.analysis_image_file,
          customer_journey: prototype.customer_journey,
          // partner_logo: prototype.partner_logo,
        },
        null,
        4,
      ),
    )
    if (prototype.image_file) {
      await getImgFile(zip, prototype.image_file, 'image_file.png')
    }

    if (prototype.widget_config) {
      try {
        const pluginList: any[] = []
        const wConfig = JSON.parse(prototype.widget_config)
        if (Array.isArray(wConfig) && wConfig.length > 0) {
          for (const widget of wConfig) {
            if (
              widget.plugin &&
              widget.plugin.length > 0 &&
              !pluginList.includes(widget.plugin)
            ) {
              pluginList.push(widget.plugin)
            }
          }
        }
      } catch (e) { }
    }

    const content = await zip.generateAsync({ type: 'blob' })
    saveAs(content, zipFilename)
  } catch (err) { }
}

export const zipToPrototype = async (
  model_id: string,
  file: File,
): Promise<Partial<Prototype> | null> => {
  const zip = new JSZip()
  const prototype: Partial<Prototype> = {
    apis: {},
    model_id: model_id, // Set model_id here
    name: '',
    code: '',
    complexity_level: '3',
    customer_journey: '',
    portfolio: {},
    skeleton: '{}',
    state: '',
    widget_config: '',
    image_file: '',
    description: {
      problem: '',
      says_who: '',
      solution: '',
      status: '',
    },
    tags: [],
  }

  try {
    const zipFile = await zip.loadAsync(file)
    if (!zipFile) throw new Error('Error on import prototype')

    const metadata = JSON.parse(
      (await zipFile.file('metadata.json')?.async('string')) || '{}',
    )
    let code = (await zipFile.file('code.py')?.async('string')) || ''
    if (code.startsWith("from sdv_model import Vehicle")) {
      let converted_code = await convertCode(code)
      code = converted_code || code
    }

    let dashboard =
      (await zipFile.file('dashboard.json')?.async('string')) || '[]'
    let newWidgets = []
    try {
      let dash = JSON.parse(dashboard)
      let widgets = []
      if(Array.isArray(dash)) {
        widgets = dash
      } else {
        if(Array.isArray(dash.widgets)){
          widgets = dash.widgets
        }
      }
      newWidgets = widgets.map((w:any) => convertV1WidgetToV2Widget(w))
      // console.log(`converted widgets`, newWidgets)

    } catch(err) {
      console.log(err)
    }

    let newDashboard = { widgets: newWidgets }

    Object.assign(prototype, metadata, { code, widget_config: JSON.stringify(newDashboard) })

    // Ensure the model_id is correctly set to the new model_id
    prototype.model_id = model_id
  } catch (err) {
    return null
  }

  return prototype
}

function convertV1WidgetToV2Widget(widget: any) {
  if (!widget) return null
  let returnWidget = widget
  if (returnWidget.plugin == 'Builtin' && returnWidget.name != 'Embedded-Widget') {
    switch (returnWidget.widget) {
      case 'Table-APIs-Widget':
        returnWidget.widget = 'Embedded-Widget'
        returnWidget.options.url = 'https://bestudio.digitalauto.tech/project/392KwRI3M9NY/signal_table.html'
        break
      case 'Chart-APIs-Widget':
        returnWidget.widget = 'Embedded-Widget'
        returnWidget.options.url = 'https://bestudio.digitalauto.tech/project/r4RywFMJk8aE/index.html'
        break;
      case 'Single-API-Widget':
        returnWidget.widget = 'Embedded-Widget'
        returnWidget.options.url = 'https://bestudio.digitalauto.tech/project/392KwRI3M9NY/single_api.html'
        break;
      case 'Image-By-VSS-Value':
        returnWidget.widget = 'Embedded-Widget'
        returnWidget.options.url = 'https://bestudio.digitalauto.tech/project/Ml2Sc9TYoOHc/image_by_value.html'
        break;
      case 'Wiper-Simulator':
        returnWidget.widget = 'Embedded-Widget'
        returnWidget.options.url = 'https://bestudio.digitalauto.tech/project/Ml2Sc9TYoOHc/image_by_value.html'
        break;
      case 'Fan-Widget':
        returnWidget.widget = 'Embedded-Widget'
        returnWidget.options.url = 'https://bewebstudio.digitalauto.tech/data/projects/XlKMZp8TaCWO/FanWidget.html'
        break;
      case 'HVAC-Dreampack':
        returnWidget.widget = 'Embedded-Widget'
        returnWidget.options.url = 'https://bewebstudio.digitalauto.tech/data/projects/hr0yLm8fYomw/Chair_Widget.html'
        break;
      case 'Gauge':
        returnWidget.widget = 'Embedded-Widget'
        returnWidget.options.url = 'https://bewebstudio.digitalauto.tech/data/projects/CblRHN4Ddp1F/index.html'
        break;
      case 'Drowsiness-Level':
        returnWidget.widget = 'Embedded-Widget'
        returnWidget.options.url = 'https://bewebstudio.digitalauto.tech/data/projects/SUYgVkLrVl9r/index.html'
        break;
      case 'Driver-Distraction':
        returnWidget.widget = 'Embedded-Widget'
        returnWidget.options.url = 'https://bewebstudio.digitalauto.tech/data/projects/AEoeUpTumqmq/index.html'
        break;
      default:
        break;
    }
  }

  return returnWidget
}
