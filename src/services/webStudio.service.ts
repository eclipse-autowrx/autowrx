// Copyright (c) 2025 Eclipse Foundation.
// 
// This program and the accompanying materials are made available under the
// terms of the MIT License which is available at
// https://opensource.org/licenses/MIT.
//
// SPDX-License-Identifier: MIT

import axios from 'axios'
import config from '@/configs/config'

const sampleFileContent = `
<!doctype html>
<html>

<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <script src="https://cdn.tailwindcss.com"></script>
    <script>
        let API_NAME = "Vehicle.Body.Lights.IsLowBeamOn"
        let interval = null
        let textValue = document.getElementById("label_value")
        function onWidgetLoaded(options) {
            
            interval = setInterval(() => {
                if(textValue) {
                    let apiValue = getApiValue(API_NAME)
                    
                    textValue.innerText = apiValue
                }
            }, 500)
        }
        function onWidgetUnloaded(options) {
            
            if(interval) clearInterval(interval)
        }

        let btnSetOn = document.getElementById("btnSetOn")
        let btnSetOff = document.getElementById("btnSetOff")

        btnSetOn.addEventListener("click", () => {
            setApiValue(API_NAME, true)
        })

        btnSetOff.addEventListener("click", () => {
            setApiValue(API_NAME, false)
        })
    </script>
    <script defer src="https://bestudio.digitalauto.tech/project/BzR91b49OHqj/syncer.js"></script>
    
</head>

<body class="h-screen grid place-items-center bg-slate-100 select-none">
    <div class="w-[280px] p-6 bg-slate-300 rounded-lg text-left text-slate-700">
        <div class="text-center font-semi-bold text-lg">Light Low Beam</div>
        <div class='mt-4 flex'>
            <div id='label_value' 
                class="bg-slate-100 text-center font-bold text-gray-600 w-full rounded px-4 py-2 hover:opacity-80">
                unknown
                </div>
        </div>

        
        <div class='mt-4 flex'>
            <div id="btnSetOn"
                class="bg-teal-500 rounded px-4 py-2 text-white cursor-pointer hover:opacity-80">
                Turn ON</div>
                
            <div class="grow"></div>

            <div id="btnSetOff"
                class="bg-red-500 rounded px-4 py-2 text-white cursor-pointer hover:opacity-80">
                Turn OFF</div>
        </div>
    </div>
</body>

</html>
`

const WEB_STUDIO_API = config.studioBeUrl
const WEB_STUDIO_EDITOR = config.studioUrl

const convertProjectPublicLinkToEditorLink = (link: string) => {
  if (!link) return ''
  let retLink = link.replace(
    `${config.studioBeUrl}/data/projects/`,
    `${config.studioUrl}/project/`,
  )
  let nameFrom = retLink.lastIndexOf('/')
  let fileName = retLink.substring(nameFrom + 1)
  //
  retLink = retLink.replace(`/${fileName}`, `?fileName=%2F${fileName}`)
  //
  return retLink
}

const createNewWidgetByWebStudio = async (name: string, uid: string) => {
  try {
    const res = await axios.post(`${config.studioBeUrl}project`, {
      name: name,
      uid: uid,
    })

    let projectName = res.data.name

    await axios.post(`${config.studioBeUrl}/project/${projectName}/file`, {
      filename: 'index.html',
      content: sampleFileContent,
      path: '/index.html',
    })

    let linkUrl = `${config.studioBeUrl}/data/projects/${projectName}/index.html`

    window.open(
      `${config.studioUrl}/project/${projectName}?fileName=%2Findex.html`,
      '_blank',
    )

    return linkUrl
  } catch (err) {}
  return ''
}

const createNewWidgetByProtoPilot = async (
  name: string,
  uid: string,
  code: string,
) => {
  try {
    const res = await axios.post(`${config.studioBeUrl}/project`, {
      name: name,
      uid: uid,
    })

    let projectName = res.data.name

    await axios.post(`${config.studioBeUrl}/project/${projectName}/file`, {
      filename: 'index.html',
      content: code,
      path: '/index.html',
    })

    let linkUrl = `${config.studioBeUrl}/data/projects/${projectName}/index.html`
    let linkStudio = `${config.studioUrl}/project/${projectName}?fileName=%2Findex.html`

    // window.open(linkStudio, "_blank");

    return [linkUrl, linkStudio]
  } catch (err) {}
  return ''
}

export {
  createNewWidgetByWebStudio,
  WEB_STUDIO_API,
  convertProjectPublicLinkToEditorLink,
  createNewWidgetByProtoPilot,
}
