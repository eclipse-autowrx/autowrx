import { initializeApp } from "firebase/app";
import { getStorage, ref } from "firebase/storage";
import { getAuth } from "firebase/auth";    
import { collection, getFirestore } from "firebase/firestore";

const firebaseConfig = {
    apiKey: import.meta.env["VITE_FIREBASE_APIKEY"],
    projectId: import.meta.env["VITE_FIREBASE_PROJECT_ID"],
    storageBucket: import.meta.env["VITE_FIREBASE_STORAGE_BUCKET"],
};

export const app = initializeApp(firebaseConfig)

const storage = getStorage();
export const db = getFirestore(app)

export const getStorageRef = (filename: string) => {
    return ref(storage, filename);
}

export const REFS = {
    tenant: collection(db, "tenant"),
    model: collection(db, "model"),
    tags: collection(db, "tags"),
    prototype: collection(db, "project"),
    plugin: collection(db, "plugin"),
    media: collection(db, "media"),
    user: collection(db, "user"),
}

export const auth = getAuth(app)
