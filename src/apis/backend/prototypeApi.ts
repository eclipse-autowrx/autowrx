import { getDocs, query, where } from "firebase/firestore";
import { cacheAxios } from "../axios";
import { REFS } from "../firebase";
import { Prototype, User } from "../models";
import { Model } from "./modelApi";
import permissions from "../../permissions";
import axios from "axios";
import dayjs from "dayjs";
import { config } from "../../configs/config";

export type CachePrototype = Prototype & {
    page: string;
    model: Model;
    time: Date;
    executedTimes?: number;
};

type CacheEntity = {
    referenceId: string;
    type: string;
    page: string;
    time: Date;
};

export const getRecentPrototypes = async (profile: User) => {
    const recentData = (await cacheAxios.get<CacheEntity[]>(`/get-recent-activities/${profile.uid}`)).data;
    const prototypesId = recentData.map((d) => d.referenceId);
    // getMany<User>(query(REFS.user, where("tenant_id", "==", TENANT_ID), ...queryConstraints));
    const response = await getDocs(query(REFS.prototype, where("id", "in", prototypesId)));
    let results: CachePrototype[] = [];
    response.forEach((doc) => {
        const data = doc.data() as Prototype;
        const prototype = recentData.find((d) => d.referenceId === data.id);
        results.push({
            ...data,
            page: prototype?.page || "",
            time: prototype?.time || new Date(),
        } as CachePrototype);
    });

    results = results.sort((a, b) => dayjs(b.time).unix() - dayjs(a.time).unix());

    const modelIds = results.map((r) => r.model_id);
    const modelResponse = await getDocs(query(REFS.model, where("id", "in", modelIds)));
    const models = modelResponse.docs.map((doc) => doc.data() as Model);

    const promises: Promise<void>[] = [];

    for (let i = 0; i < results.length; i++) {
        const model = models.find((m) => m.id === results[i].model_id);

        if (!model) {
            continue;
        }

        const permission = permissions.MODEL(profile, model);

        if (!permission.canRead()) {
            continue;
        }

        promises.push(
            (async () => {
                try {
                    const runTimesResponse = await axios.get(config.logBaseUrl, {
                        params: {
                            ref_id: results[i].id,
                            type: "run-prototype",
                        },
                    });
                    results[i] = {
                        ...results[i],
                        model,
                        executedTimes: runTimesResponse?.data?.count,
                    };
                } catch (error) {
                    results[i] = {
                        ...results[i],
                        model,
                    };
                }
            })()
        );
    }

    await Promise.all(promises);

    return {
        data: results,
    };
};

export const saveRecentPrototype = async (userId: string, referenceId: string, type: string, page: string) => {
    return cacheAxios.post("/save-to-db", {
        userId,
        referenceId,
        type,
        page,
    });
};
