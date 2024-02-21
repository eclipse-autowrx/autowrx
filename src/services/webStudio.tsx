import axios from "axios";
import { link } from "fs";

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
            console.log("On my widget loaded")
            interval = setInterval(() => {
                if(textValue) {
                    let apiValue = getApiValue(API_NAME)
                    console.log("type of apiValue", typeof apiValue)
                    textValue.innerText = apiValue
                }
            }, 500)
        }
        function onWidgetUnloaded(options) {
            console.log("On my widget unloaded")
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
`;

const WEB_STUDIO_API = "https://bewebstudio.digitalauto.tech/";
const WEB_STUDIO_EDITOR = "https://studio.digitalauto.tech/";

const convertProjectPublicLinkToEditorLink = (link: string) => {
    if (!link) return "";
    let retLink = link.replace(
        "https://bewebstudio.digitalauto.tech/data/projects/",
        "https://studio.digitalauto.tech/project/"
    );
    let nameFrom = retLink.lastIndexOf("/");
    let fileName = retLink.substring(nameFrom + 1);
    // console.log(fileName)
    retLink = retLink.replace(`/${fileName}`, `?fileName=%2F${fileName}`);
    // console.log(`retLink: ${retLink}`)
    return retLink;
};

const createNewWidgetByWebStudio = async (name, uid) => {
    try {
        const res = await axios.post(`${WEB_STUDIO_API}project`, {
            name: name,
            uid: uid,
        });

        let projectName = res.data.name;
        console.log(`Project name: ${projectName}`);
        await axios.post(`${WEB_STUDIO_API}project/${projectName}/file`, {
            filename: "index.html",
            content: sampleFileContent,
            path: "/index.html",
        });

        let linkUrl = `${WEB_STUDIO_API}data/projects/${projectName}/index.html`;

        window.open(`${WEB_STUDIO_EDITOR}project/${projectName}?fileName=%2Findex.html`, "_blank");

        return linkUrl;
    } catch (err) {
        console.log("Error on create web studio project");
        console.log(err);
    }
    return "";
};

const createNewWidgetByProtoPilot = async (name, uid, code) => {
    try {
        const res = await axios.post(`${WEB_STUDIO_API}project`, {
            name: name,
            uid: uid,
        });

        let projectName = res.data.name;
        console.log(`Project name: ${projectName}`);
        await axios.post(`${WEB_STUDIO_API}project/${projectName}/file`, {
            filename: "index.html",
            content: code,
            path: "/index.html",
        });

        let linkUrl = `${WEB_STUDIO_API}data/projects/${projectName}/index.html`;
        let linkStudio = `${WEB_STUDIO_EDITOR}project/${projectName}?fileName=%2Findex.html`;

        // window.open(linkStudio, "_blank");

        return [linkUrl, linkStudio];
    } catch (err) {
        console.log("Error on create web studio project");
        console.log(err);
    }
    return "";
};

export {
    createNewWidgetByWebStudio,
    WEB_STUDIO_API,
    convertProjectPublicLinkToEditorLink,
    createNewWidgetByProtoPilot,
};
