import { useEffect } from "react";
import { doc, getDoc, setDoc, updateDoc, query, getDocs, where } from "firebase/firestore";
import { REFS } from "../../apis/firebase";
import { Model } from "../../apis/models";
import { slugify } from "../../reusable/functions";
import { TENANT_ID } from "../../constants";

interface basicTagCategory {
    id: string;
    name: string;
}

interface basicTag {
    name: string;
}

export interface ApiData {
    apiName: string;
    tags: {
        tagCategoryId: string;
        tagCategoryName: string;
        tag: string;
    }[];
}
// This function is used to create a new tag in "tags" collection
export const upsertCategoryTagGlobal = async (newTagCategory, newTag) => {
    const id = slugify(newTagCategory.name);
    const docRef = doc(REFS.tags, id);
    const docSnap = await getDoc(docRef);

    if (docSnap.exists()) {
        // Check the category exists
        const existingTagCategory = docSnap.data();
        const existingTag = existingTagCategory?.tags[newTag.name]; // Check the tag exists
        if (existingTag) {
            // console.warn('Tag already exists.');
            return;
        }
        await updateDoc(docRef, { [`tags.${newTag.name}`]: newTag }); // add new tag to existing category
    } else {
        // Create a new category with the new tag
        const tagCategoryObject = {
            ...newTagCategory,
            id,
            tenant_id: TENANT_ID,
            tags: {
                [newTag.name]: newTag,
            },
        };
        await setDoc(docRef, tagCategoryObject);
    }
};

// This function is used to append the tags to the "api" collection
export const upsertCategoryTagForAPI = async (
    apiName: string,
    modelID: string,
    newTagCategory: basicTagCategory,
    newTag: basicTag
) => {
    const newCategoryTag = {
        tagCategoryId: newTagCategory.id,
        tagCategoryName: newTagCategory.name,
        tag: newTag.name,
    };

    // Query the document based on apiName and modelID
    const apiQuery = query(REFS.api, where("apiName", "==", apiName), where("modelID", "==", modelID));
    const querySnapshot = await getDocs(apiQuery);

    if (querySnapshot.empty) {
        const newApiObject = {
            apiName,
            modelID,
            tags: [newCategoryTag],
        };
        const docRef = doc(REFS.api);
        await setDoc(docRef, newApiObject);
    } else {
        // Assuming unique apiName and modelID combination
        const apiDoc = querySnapshot.docs[0];
        const apiData = apiDoc.data();
        let tags = apiData.tags || [];

        // Check if the tag already exists
        const existingTag = tags.find((tag) => tag.tag === newTag.name && tag.tagCategoryId === newTagCategory.id);
        if (existingTag) {
            // console.warn('Category/tag already exists on the api for this model');
            return;
        }

        // Update the tags array
        const updatedTags = [...tags, newCategoryTag];
        try {
            await updateDoc(apiDoc.ref, { tags: updatedTags });
        } catch (error) {
            // console.error('Error updating tag:', error);
        }
    }
};

export const removeTagInApi = async (
    apiName: string,
    modelID: string,
    tagToRemove: { tag: string; tagCategoryId: string }
): Promise<void> => {
    // Query the document based on apiName and modelID
    const apiQuery = query(REFS.api, where("apiName", "==", apiName), where("modelID", "==", modelID));
    const querySnapshot = await getDocs(apiQuery);

    if (querySnapshot.empty) {
        // console.warn(`API with name ${apiName} and modelID ${modelID} does not exist.`);
        return;
    }

    // Get the first document from the query (assuming unique apiName and modelID combination)
    const apiDoc = querySnapshot.docs[0];
    const apiData = apiDoc.data();
    let tags = apiData.tags || [];

    // Remove the tag that matches both `tag` and `tagCategoryId`
    tags = tags.filter((tag) => !(tag.tag === tagToRemove.tag && tag.tagCategoryId === tagToRemove.tagCategoryId));

    try {
        await updateDoc(apiDoc.ref, { tags });
    } catch (error) {
        // console.error('Error removing tag:', error);
    }
};

export const fetchTagsInAPI = async (apiName: string, modelID: string): Promise<basicTag[]> => {
    const apiQuery = query(REFS.api, where("apiName", "==", apiName), where("modelID", "==", modelID));
    const querySnapshot = await getDocs(apiQuery);

    if (querySnapshot.empty) {
        // console.warn(`API with name ${apiName} does not exist.`);
        return [];
    }

    const apiData = querySnapshot.docs[0].data();
    return apiData.tags || [];
};

export const fetchAllTags = async (modelID: string): Promise<ApiData[]> => {
    const apiQuery = query(REFS.api, where("modelID", "==", modelID));
    const querySnapshot = await getDocs(apiQuery);

    if (querySnapshot.empty) {
        // console.warn(`No APIs found for modelID ${modelID}`);
        return [];
    } else {
        return querySnapshot.docs.map((doc) => doc.data() as ApiData);
    }
};
