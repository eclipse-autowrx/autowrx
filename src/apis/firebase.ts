import { initializeApp } from "firebase/app";
import { getStorage, ref } from "firebase/storage";
import { getAuth } from "firebase/auth";
import { collection, getFirestore, initializeFirestore } from "firebase/firestore";

const firebaseConfig = {
    authDomain: import.meta.env["VITE_FIREBASE_PROJECT_ID"] + ".firebaseapp.com",
    apiKey: import.meta.env["VITE_FIREBASE_APIKEY"],
    projectId: import.meta.env["VITE_FIREBASE_PROJECT_ID"],
    storageBucket: import.meta.env["VITE_FIREBASE_STORAGE_BUCKET"],
};

export const app = initializeApp(firebaseConfig);

/*
// Enable experimentalForceLongPolling for Firestore
const firestoreConfig = {
    experimentalForceLongPolling: true,
};
initializeFirestore(app, firestoreConfig)
*/

const storage = getStorage();
export const db = getFirestore(app);

export const getStorageRef = (filename: string) => {
    return ref(storage, filename);
};

export const REFS = {
    tenant: collection(db, "tenant"),
    model: collection(db, "model"),
    tags: collection(db, "tags"),
    prototype: collection(db, "project"),
    plugin: collection(db, "plugin"),
    media: collection(db, "media"),
    user: collection(db, "user"),
    feedback: collection(db, "feedback"),
    discussion: collection(db, "discussion"),
    activity_log: collection(db, "activity_log"),
    issue: collection(db, "issue"),
    survey: collection(db, "survey"),
    feature: collection(db, "feature"),
    api: collection(db, "api"),
    addOns: collection(db, "addOns"),
};

export const auth = getAuth(app);
