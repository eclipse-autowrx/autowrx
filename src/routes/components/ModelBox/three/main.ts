import * as THREE from "./three.module.js";

import { OrbitControls } from "./controls/OrbitControls.js";
import { RoomEnvironment } from "./environments/RoomEnvironment.js";

import { GLTFLoader } from "./loaders/GLTFLoader.js";
import { DRACOLoader } from "./loaders/DRACOLoader.js";
import assert from "assert";
import { CameraCoordinates } from "../../../models/index.js";
import { NavigateFunction } from "react-router-dom";
import { ImagePin } from "../../../../apis/models/index.js";

const getWidthHeight = () => {
    const container = document.getElementById( "model-box" );
    assert(container !== null)
    const style = getComputedStyle(container);
    return [
        parseFloat(style.getPropertyValue("width")),
        parseFloat(style.getPropertyValue("height"))
    ];
};

export interface ImagePinWithLink extends ImagePin {
    link: string
}

const PinElement = (navigate: NavigateFunction, pin: ImagePinWithLink) => {
    const div = document.createElement("div")
    div.setAttribute("style", `position: absolute; left: ${pin.x}%; top: ${pin.y}%; cursor: pointer; transform: translate(-50%, -100%);`)
    div.onclick = () => navigate(pin.link)
    const linkParts = pin.link.split("/")
    div.setAttribute("data-api", linkParts[linkParts.length-1])
    div.classList.add("model-box-pin-div")
    div.innerHTML = (
        `<svg version="1.0" xmlns="http://www.w3.org/2000/svg"
        height="25px" viewBox="0 0 395.000000 640.000000"
        preserveAspectRatio="xMidYMid meet"
        >
            <g transform="translate(0.000000,640.000000) scale(0.100000,-0.100000)" fill="#c92a2a" stroke="none">
                <path d="M1708 6384 c-830 -107 -1503 -725 -1668 -1534 -28 -138 -35 -215 -35
                -395 0 -178 6 -245 37 -385 45 -210 107 -358 281 -670 162 -292 184 -329 473
                -776 364 -563 503 -799 662 -1120 204 -413 356 -822 462 -1247 28 -109 50
                -207 50 -218 0 -36 17 -19 24 24 14 92 100 418 152 580 202 621 446 1101 972
                1912 363 560 430 670 575 961 159 318 216 487 244 719 10 88 10 359 0 445 -12
                107 -16 130 -48 260 -118 480 -453 926 -891 1184 -195 114 -451 207 -678 245
                -36 6 -81 13 -100 16 -77 13 -407 12 -512 -1z m440 -1220 c31 -8 95 -33 142
                -56 67 -33 103 -61 171 -128 73 -73 94 -100 132 -180 60 -126 72 -181 71 -320
                -1 -95 -6 -129 -27 -195 -95 -292 -359 -485 -662 -485 -303 0 -567 193 -662
                485 -21 66 -26 100 -27 195 -1 138 11 194 71 319 37 77 59 108 126 176 182
                183 421 251 665 189z"/>
            </g>
        </svg>`
    )
    return div
}

const RenderThree = (
    navigate: NavigateFunction,
    filename: string,
    preloadImage: string,
    defaultCamera: CameraCoordinates,
    pins: ImagePinWithLink[]
) => {
    let camera: any, scene: any, renderer: any;

    let grid: any;
    let controls;
    
    const wheels: any[] = [];
    
    function init() {
        return new Promise<[THREE.PerspectiveCamera, OrbitControls]>((resolve, reject) => {
            const container = document.getElementById( "model-box" );
            assert(container !== null)
            container.classList.remove("loading")
            container.classList.add("image")
            
            const fitContainer = document.createElement("div")
            fitContainer.style.display = "flex"
            fitContainer.style.position = "relative"
            fitContainer.style.maxHeight = "100%"
            fitContainer.innerHTML = `<img src="${preloadImage}" style="object-fit: contain;" />`

            pins.forEach(pin => {
                fitContainer.appendChild(PinElement(navigate, pin))
            })

            container.innerText = ""
            container.appendChild(fitContainer)
            
            const button = document.createElement(`div`)
            button.innerHTML = `<svg stroke="currentColor" fill="currentColor" stroke-width="0" viewBox="0 0 24 24" height="1em" width="1em" xmlns="http://www.w3.org/2000/svg"><path d="M18 11h-5V6h3l-4-4-4 4h3v5H6V8l-4 4 4 4v-3h5v5H8l4 4 4-4h-3v-5h5v3l4-4-4-4z"></path></svg>`
            // button.innerHTML = `<div class="Loader__Box"><div class="Loader__Loader"></div></div>`
            button.classList.add("model-box-button")
            button.addEventListener("click", () => {
                container.classList.add("loading")
                button.innerHTML = `<div class="Loader__Box"><div class="Loader__Loader"></div></div>`
                loader.load( `${filename}`, CreateModel);
            })
            container.appendChild(button)

            const dracoLoader = new DRACOLoader();
            dracoLoader.setDecoderPath( "/threejs/" );
        
            const loader = new GLTFLoader();
            loader.setDRACOLoader( dracoLoader );

            const CreateModel = (gltf: any) => {
                container.innerHTML = ''
                container.classList.remove("loading")
                container.classList.remove("image")

                renderer = new THREE.WebGLRenderer( { antialias: true } );
                renderer.setPixelRatio( window.devicePixelRatio );
        
                const [width, height] = getWidthHeight();
                renderer.setSize( width, height );
                renderer.setAnimationLoop( render );
                renderer.outputEncoding = THREE.sRGBEncoding;
                renderer.toneMapping = THREE.ACESFilmicToneMapping;
                renderer.toneMappingExposure = 0.85;
                container.appendChild( renderer.domElement );
            
                window.addEventListener( "resize", onWindowResize );

                camera = new THREE.PerspectiveCamera( 40, width / height, 0.1, 100 );
                camera.position.set( defaultCamera.camera.x, defaultCamera.camera.y, defaultCamera.camera.z );
            
                controls = new OrbitControls( camera, container );
                controls.target.set( defaultCamera.controls.x, defaultCamera.controls.y, defaultCamera.controls.z );
                controls.update();

                const pmremGenerator = new THREE.PMREMGenerator( renderer );
            
                scene = new THREE.Scene();
                scene.background = new THREE.Color( 0xeeeeee );
                scene.environment = pmremGenerator.fromScene( new RoomEnvironment() ).texture;
                scene.fog = new THREE.Fog( 0xeeeeee, 10, 50 );
            
                grid = new THREE.GridHelper( 100, 40, 0x000000, 0x000000 );
                grid.material.opacity = 0.1;
                grid.material.depthWrite = false;
                grid.material.transparent = true;
                scene.add( grid );
            
                const carModel = gltf.scene.children[ 0 ];
                scene.add( carModel );

                resolve([camera, controls])
            }
        })

    
    }
    
    function onWindowResize() {
        const [width, height] = getWidthHeight();
    
        camera.aspect = width / height;
        camera.updateProjectionMatrix();
    
        renderer.setSize( width, height );
    
    }
    
    const render = () => {
        const time = - performance.now() / 1000;
    
        for ( let i = 0; i < wheels.length; i ++ ) {
    
            wheels[ i ].rotation.x = time * Math.PI;
    
        }
    
        grid.position.z = - ( time ) % 5;
    
        renderer.render( scene, camera );
    }
    
    return init();
};

export default RenderThree;