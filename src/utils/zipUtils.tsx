import JSZip from "jszip";
import JSZipUtils from "jszip-utils";
import { saveAs } from "save-as";
import { Model, Prototype } from "../apis/models";
import { getPlugins, getPrototypes } from "../apis";
import { prototype } from "events";

const removeSpecialCharacters = (str: string) => {
    return str.replace(/[^a-zA-Z0-9 ]/g, "");
};

const getImgFile = (zip, image_url, filename) => {
    return new Promise((resolve) => {
        JSZipUtils.getBinaryContent(image_url, function (err, data) {
            if (err) {
                resolve(null);
            }
            zip.file(filename, data, { binary: true });
            resolve(null);
        });
    });
};

const downloadAllPluginInModel = async (model, zip) => {
    try {
        if (!model || !model.id) return;
        let plugins = await getPlugins(model.id);
        zip.file(
            "plugins.json",
            JSON.stringify(
                plugins.map((plugin) => {
                    return {
                        name: plugin.name,
                        description: plugin.description,
                        image_file: plugin.image_file,
                        js_code_url: plugin.js_code_url,
                    };
                }),
                null,
                4
            )
        );
    } catch (err) {
        console.log("downloadAllPluginInModel", err);
    }
};

const downloadAllPrototypeInModel = async (model, zip) => {
    try {
        if (!model || !model.id) return;
        let prototypes = await getPrototypes(model.id);
        zip.file(
            "prototypes.json",
            JSON.stringify(
                prototypes.map((prototype) => {
                    return {
                        name: prototype.name,
                        description: prototype.description,
                        tags: prototype.tags,
                        state: prototype.state,
                        model_id: prototype.model_id,
                        image_file: prototype.image_file,
                        complexity_level: prototype.complexity_level,
                        journey_image_file: prototype.journey_image_file,
                        analysis_image_file: prototype.analysis_image_file,
                        customer_journey: prototype.customer_journey,
                        partner_logo: prototype.partner_logo,
                    };
                }),
                null,
                4
            )
        );
        for (let i = 0; i < prototypes.length; i++) {
            let prototype = prototypes[i];
            // prototypes.forEach(async prototype => {
            zip.file(`prototypes/${prototype.name}/code.py`, prototype.code);
            zip.file(`prototypes/${prototype.name}/dashboard.json`, prototype.widget_config || '{"widgets": []}');
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
                        journey_image_file: prototype.journey_image_file,
                        analysis_image_file: prototype.analysis_image_file,
                        customer_journey: prototype.customer_journey,
                        partner_logo: prototype.partner_logo,
                    },
                    null,
                    4
                )
            );
            if (prototype.image_file) {
                await getImgFile(zip, prototype.image_file, `prototypes/${prototype.name}/image_file.png`);
            }
            // })
        }
    } catch (err) {
        console.log("downloadAllPrototypeInModel", err);
    }
};

export const downloadModelZip = async (model: Model) => {
    if (!model) return;

    try {
        let zip = new JSZip();
        let zipFilename = `model_${removeSpecialCharacters(model.name)}.zip`;
        zip.file("vss.json", JSON.stringify(JSON.parse(model.cvi), null, 4));
        zip.file("custom_api.json", JSON.stringify(model.custom_apis, null, 4));
        zip.file(
            "metadata.json",
            JSON.stringify(
                {
                    name: model.name,
                    model_files: JSON.stringify(model.model_files, null, 4),
                    main_api: model.main_api,
                    model_home_image_file: model.model_home_image_file,
                    visibility: model.visibility,
                },
                null,
                4
            )
        );
        if (model.model_home_image_file) {
            await getImgFile(zip, model.model_home_image_file, "model_home_image_file.png");
        }
        await downloadAllPluginInModel(model, zip);
        await downloadAllPrototypeInModel(model, zip);

        let content = await zip.generateAsync({ type: "blob" });
        saveAs(content, zipFilename);
    } catch (err) {
        console.log("Error on zip prototype", err);
    }
};

export const zipToModel = async (file: File) => {
    let zip = new JSZip();
    let model: any = {
        name: "",
        main_api: "",
        cvi: "",
        custom_apis: {},
        model_files: {},
        model_home_image_file: "",
        visibility: "",
    };
    let plugins: any[] = [];
    let prototypes: any[] = [];

    try {
        let zipFile = await zip.loadAsync(file);
        if (!zipFile) throw new Error("Error on import model");
        let metadata: any = (await zipFile.file("metadata.json")?.async("string")) || "{}";
        metadata = JSON.parse(metadata);
        model = {
            name: metadata.name,
            main_api: metadata.main_api,
            model_files: JSON.parse(metadata.model_files || "{}"),
            model_home_image_file: metadata.model_home_image_file,
            visibility: metadata.visibility,
        };

        let cvi = (await zipFile.file("vss.json")?.async("string")) || "{}";
        model.cvi = cvi;
        let custom_apis = (await zipFile.file("custom_api.json")?.async("string")) || "{}";
        model.custom_apis = JSON.parse(custom_apis);

        let prototypesStr = (await zipFile.file("prototypes.json")?.async("string")) || "[]";
        prototypes = JSON.parse(prototypesStr);
        for (let i = 0; i < prototypes.length; i++) {
            let prototype = prototypes[i];
            prototype.code = (await zipFile.file(`prototypes/${prototype.name}/code.py`)?.async("string")) || "";
            prototype.widget_config =
                (await zipFile.file(`prototypes/${prototype.name}/dashboard.json`)?.async("string")) || "[]";
        }

        let pluginsStr = (await zipFile.file("plugins.json")?.async("string")) || "[]";
        plugins = JSON.parse(pluginsStr);
    } catch (err) {
        console.log("Error on import prototype", err);
        return null;
    }
    return { model, plugins, prototypes };
};

export const downloadPrototypeZip = async (prototype: Prototype) => {
    if (!prototype) return;

    try {
        let zip = new JSZip();
        let zipFilename = `prototype_${removeSpecialCharacters(prototype.name)}.zip`;
        zip.file("code.py", prototype.code);
        zip.file("dashboard.json", prototype.widget_config || '{"widgets":[]}');
        zip.file(
            "metadata.json",
            JSON.stringify(
                {
                    name: prototype.name,
                    description: prototype.description,
                    state: prototype.state,
                    tags: prototype.tags,
                    model_id: prototype.model_id,
                    image_file: prototype.image_file,
                    complexity_level: prototype.complexity_level,
                    journey_image_file: prototype.journey_image_file,
                    analysis_image_file: prototype.analysis_image_file,
                    customer_journey: prototype.customer_journey,
                    partner_logo: prototype.partner_logo,
                },
                null,
                4
            )
        );
        if (prototype.image_file) {
            await getImgFile(zip, prototype.image_file, "image_file.png");
        }

        if (prototype.widget_config) {
            try {
                let pluginList: any[] = [];
                let wConfig = JSON.parse(prototype.widget_config);
                if (Array.isArray(wConfig) && wConfig.length > 0) {
                    for (let i = 0; i < wConfig.length; i++) {
                        let widget: any = wConfig[i];
                        if (widget.plugin && widget.plugin.length > 0 && !pluginList.includes(widget.plugin)) {
                            pluginList.push(widget.plugin);
                        }
                    }
                }
                if (pluginList.length > 0) {
                    let plugins = await getPlugins(prototype.model_id);
                    plugins = plugins.filter((plugin) => pluginList.includes(plugin.name));
                    zip.file(
                        "plugins.json",
                        JSON.stringify(
                            plugins.map((plugin) => {
                                return {
                                    name: plugin.name,
                                    description: plugin.description,
                                    image_file: plugin.image_file,
                                    js_code_url: plugin.js_code_url,
                                };
                            }),
                            null,
                            4
                        )
                    );
                }
            } catch (e) {
                console.log("Error on widget_config", e);
            }
        }

        let content = await zip.generateAsync({ type: "blob" });
        saveAs(content, zipFilename);
    } catch (err) {
        console.log("Error on zip prototype", err);
    }
};

export const zipToPrototype = async (model: Model, file: File) => {
    let zip = new JSZip();
    let prototype: any = {
        name: "",
        description: {
            problem: "",
            says_who: "",
            solution: "",
            status: "",
        },
        tags: [],
        model_id: model.id,
        code: "",
        widget_config: "",
        image_file: "",
        complexity_level: 3,
        journey_image_file: "",
        analysis_image_file: "",
        customer_journey: "",
        partner_logo: "",
    };
    try {
        let zipFile = await zip.loadAsync(file);
        if (!zipFile) throw new Error("Error on import prototype");
        let metadata = (await zipFile.file("metadata.json")?.async("string")) || "{}";
        let code = (await zipFile.file("code.py")?.async("string")) || "";
        let dashboard = (await zipFile.file("dashboard.json")?.async("string")) || "[]";
        prototype = {
            ...prototype,
            ...JSON.parse(metadata),
            code,
            widget_config: dashboard,
        };

        let pluginsStr = (await zipFile.file("plugins.json")?.async("string")) || "[]";
        prototype.plugins = JSON.parse(pluginsStr) || [];
    } catch (err) {
        console.log("Error on import prototype", err);
        return null;
    }
    return prototype;
};
