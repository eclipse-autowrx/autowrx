import { initializeApp, cert } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore } from 'firebase-admin/firestore';

const app = initializeApp({
    credential: cert({
        projectId: process.env["REACT_APP_FIREBASE_PROJECT_ID"],
        clientEmail: process.env["FIREBASE_ADMIN_CLIENT_EMAIL"],
        privateKey: (process.env["FIREBASE_ADMIN_PRIVATE_KEY"] ?? "").replace(/\|\|\|/g, "\n")

    })
});


export const db = getFirestore(app)

export const REFS = {
    tenant: db.collection("tenant"),
    model: db.collection("model"),
    prototype: db.collection("project"),
    plugin: db.collection("plugin"),
    media: db.collection("media"),
    user: db.collection("user"),
}

export const auth = getAuth(app)
