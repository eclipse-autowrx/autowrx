import { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import React from "react";
import { getStorage, ref, uploadBytesResumable, getDownloadURL } from "firebase/storage";
import {
    doc,
    setDoc,
    getDocs,
    getDoc,
    updateDoc,
    Timestamp,
    DocumentData,
    CollectionReference,
} from "firebase/firestore";
import { REFS } from "../../../apis/firebase";
import { Issue, Survey, User } from "../../../apis/models";
import { addLog } from "../../../apis";

export const formatTimestamp = (Timestamp: { seconds: number } | Date | undefined): string => {
    let dateObject: Date;

    if (Timestamp instanceof Date) {
        dateObject = Timestamp;
    } else if (Timestamp && "seconds" in Timestamp) {
        dateObject = new Date(Timestamp.seconds * 1000);
    } else {
        return "";
    }

    const months = [
        "January",
        "February",
        "March",
        "April",
        "May",
        "June",
        "July",
        "August",
        "September",
        "October",
        "November",
        "December",
    ];

    const month = months[dateObject.getMonth()];
    const day = dateObject.getDate();
    const year = dateObject.getFullYear();

    const hours = dateObject.getHours();
    const minutesNum = dateObject.getMinutes();
    let period = "AM";

    if (hours >= 12) {
        period = "PM";
    }

    let hour12Format = hours % 12;
    if (hour12Format === 0) hour12Format = 12;

    const minutesStr = minutesNum < 10 ? `0${minutesNum}` : `${minutesNum}`;

    return `${month} ${day}, ${year} ${hour12Format}:${minutesStr} ${period}`;
};

// Function for ReportManagement -----------------------------------------------------------------------
export function fetchIssuesAndSurveys() {
    const [issues, setIssues] = useState<Issue[]>([]);
    const [surveys, setSurveys] = useState<Survey[]>([]);

    async function fetchIssues() {
        const issueSnapshot = await getDocs(REFS.issue);
        const issues: Issue[] = issueSnapshot.docs.map((doc) => doc.data() as Issue);
        return issues;
    }

    async function fetchSurveys() {
        const surveySnapshot = await getDocs(REFS.survey);
        // const surveys: Survey[] = surveySnapshot.docs.map(doc => doc.data() as Survey).filter(survey => !survey.lastClosedTimestamp);
        const surveys: Survey[] = surveySnapshot.docs.map((doc) => doc.data() as Survey);
        return surveys;
    }

    useEffect(() => {
        fetchSurveys()
            .then((fetchedSurveys) => {
                // Assign an order number to each survey
                const orderedSurveys = fetchedSurveys.map((survey, index) => ({
                    ...survey,
                    orderNumber: index + 1,
                }));
                setSurveys(orderedSurveys);
                // console.log("oderedSurveys: " + orderedSurveys)
            })
            .catch((err) => console.error("Failed to fetch surveys: ", err));
    }, []);

    useEffect(() => {
        fetchIssues()
            .then((fetchedIssues) => {
                // Assign an order number to each issue
                const orderedIssues = fetchedIssues.map((issue, index) => ({
                    ...issue,
                    orderNumber: index + 1,
                }));
                setIssues(orderedIssues);
            })
            .catch((err) => console.error("Failed to fetch issues: ", err));
    }, []);
    return { issues, surveys };
}

export const routesDict = {
    "/": "Home",
    "/account-verification-success": "AccountVerifySuccessPage",
    "/edit-profile": "EditProfile",
    "/media": "Media",
    "/manage-users": "ManageUsers",
    "/dashboard": "Dashboard",
    "/system-logs": "SystemLogs",
    "/report": "Report",
    "/model/": "SelectModel",
    "/model/:model_id": "ModelHome",
    "/model/:model_id/cvi": "DynamicNavigate",
    "/model/:model_id/cvi/list": "ViewInterface",
    "/model/:model_id/cvi/list/:node_path": "ViewInterface",
    "/model/:model_id/cvi/tree/": "ViewInterface",
    "/model/:model_id/permissions": "ModelPermissions",
    "/model/:model_id/plugins": "Plugins",
    "/model/:model_id/plugins/plugin/:plugin_id": "Plugins",
    "/model/:model_id/plugins/dashboard": "Plugins",
    "/model/:model_id/library": "Library",
    "/model/:model_id/library/prototype/:prototype_id": "Library",
    "/model/:model_id/library/portfolio": "Library",
    "/model/:model_id/library/prototype/:prototype_id/view": "Navigate",
    "/model/:model_id/library/prototype/:prototype_id/view/code": "ViewPrototype",
    "/model/:model_id/library/prototype/:prototype_id/view/run": "ViewPrototype",
    "/model/:model_id/library/prototype/:prototype_id/view/cvi/": "DynamicNavigate",
    "/model/:model_id/library/prototype/:prototype_id/view/cvi/list/": "ViewPrototype",
    "/model/:model_id/library/prototype/:prototype_id/view/cvi/list/:node_path": "ViewPrototype",
    "/model/:model_id/library/prototype/:prototype_id/view/cvi/tree/": "ViewPrototype",
    "/model/:model_id/library/prototype/:prototype_id/view/discussion": "ViewPrototype",
    "/model/:model_id/library/prototype/:prototype_id/view/feedback": "ViewPrototype",
    "/model/:model_id/library/prototype/:prototype_id/view/journey": "ViewPrototype",
    "/user/:user_id": "UserProfilePage",
    "/tags": "TagCategoryList",
    "/tags/:tag_category_id/": "TagCategoryList",
    "/tags/:tag_category_id/:tag_name": "TagCategoryList",
};

// Function for ReportPopup ----------------------------------------------------------------------------
export const useAffectedRoute = () => {
    const location = useLocation();
    const [affectedPath, setAffectedPath] = useState<string | undefined>(undefined);
    const [affectedComponent, setAffectedComponent] = useState<string | undefined>(undefined);
    const [affectedCluster, setAffectedCluster] = useState<string | undefined>(undefined);

    useEffect(() => {
        for (const path of Object.keys(routesDict)) {
            if (!path) continue;
            const match = matchPath(location.pathname, path);
            if (match) {
                setAffectedPath(path); // Set the affected cluster to the route path

                // Split the route path into segments and remove empty strings
                const routeParts = path.split("/").filter(Boolean);
                // Start from the last segment if path is model/:id_model/prototype/:id_prototype (i.e., the affected cluster is prototype)
                let foundCluster = false;
                for (let i = routeParts.length - 1; i >= 0; i--) {
                    // If the segment doesn't start with a colon, use it as the affectedCluster
                    if (!routeParts[i].startsWith(":")) {
                        setAffectedCluster(routeParts[i]);
                        foundCluster = true;
                        break;
                    }
                }

                if (!foundCluster) {
                    setAffectedCluster("Home");
                }

                // Using the dictionary to get the component name
                setAffectedComponent(routesDict[path]);
                break;
            }
        }
    }, [location]);

    // console.log("Affected Path: ", affectedPath + " - Affected Component: " + affectedComponent + "Affected Cluster: " + affectedCluster);
    return { affectedPath, affectedCluster, affectedComponent };
};

const matchPath = (pathname: string, routePath: string) => {
    // the current URL path when user click report issues
    const urlParts = pathname.split("/").filter(Boolean); // filter(Boolean) removes empty strings
    // the route path inside routes.tsx
    const routeParts = routePath.split("/").filter(Boolean);
    // check length first
    if (urlParts.length !== routeParts.length) {
        return false;
    }

    // Check each segment of the URL path against the route path
    for (let i = 0; i < urlParts.length; i++) {
        // ignore the ":id" part
        if (routeParts[i].startsWith(":")) {
            continue;
        }
        // if the user URL path segment doesn't match the route path segment, return false
        if (urlParts[i] !== routeParts[i]) {
            return false;
        }
    }

    return true;
};

export const getBrowserAndOS = () => {
    let userAgent = navigator.userAgent;
    let browserName = "Unknown";
    let browserVersion = "Unknown";
    let os = "Unknown";

    // Detect browser and version
    if (userAgent.indexOf("Firefox") > -1) {
        browserName = "Firefox";
        // Extract version number
        let version = userAgent.split("Firefox/")[1];
        browserVersion = version ? version.split(" ")[0] : "Unknown";
    } else if (userAgent.indexOf("OPR") > -1) {
        browserName = "Opera";
        let version = userAgent.split("OPR/")[1];
        browserVersion = version ? version.split(" ")[0] : "Unknown";
    } else if (userAgent.indexOf("Edg") > -1) {
        browserName = "Edge";
        let version = userAgent.split("Edg/")[1];
        browserVersion = version ? version.split(" ")[0] : "Unknown";
    } else if (userAgent.indexOf("Chrome") > -1) {
        browserName = "Chrome";
        let version = userAgent.split("Chrome/")[1];
        browserVersion = version ? version.split(" ")[0] : "Unknown";
    } else if (userAgent.indexOf("Safari") > -1 && userAgent.indexOf("Chrome") === -1) {
        browserName = "Safari";
        let version = userAgent.split("Safari/")[1];
        browserVersion = version ? version.split(" ")[0] : "Unknown";
    }

    // Detect OS
    if (userAgent.indexOf("Win") > -1) {
        os = "Windows";
    } else if (userAgent.indexOf("Mac") > -1) {
        os = "Mac OS";
    } else if (userAgent.indexOf("X11") > -1) {
        os = "UNIX";
    } else if (userAgent.indexOf("Linux") > -1) {
        os = "Linux";
    }

    // console.log(browserName, browserVersion, os)
    return { browserName, browserVersion, os };
};

function getCanvasSize() {
    return `${document.body.scrollWidth} x ${document.body.scrollHeight}`;
}

async function uploadImageToFirebaseStorage(file: File) {
    const storage = getStorage();
    const storageRef = ref(storage, "issue/" + file.name);

    // Upload the file
    const uploadTask = uploadBytesResumable(storageRef, file);

    // Wait for the upload to complete
    await new Promise((resolve, reject) => {
        uploadTask.on(
            "state_changed",
            (snapshot) => {},
            (error) => {
                reject(error);
            },
            () => {
                resolve(null);
            }
        );
    });

    // Get the download URL
    const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
    return downloadURL;
}

export function dataURLToBlob(dataurl) {
    let arr = dataurl.split(","),
        mime = arr[0].match(/:(.*?);/)[1],
        bstr = atob(arr[1]),
        n = bstr.length,
        u8arr = new Uint8Array(n);
    while (n--) {
        u8arr[n] = bstr.charCodeAt(n);
    }
    return new Blob([u8arr], { type: mime });
}

export async function createIssue(
    file: File,
    description: string,
    affectedPath?: string,
    affectedCluster?: string,
    affectedComponent?: string,
    email?: string,
    profile?: User | null
) {
    const { browserName, browserVersion, os } = getBrowserAndOS();
    const canvas_size = getCanvasSize();
    const docRef = doc(REFS.issue);
    const imageUrl = await uploadImageToFirebaseStorage(file);

    const newIssue: Issue = {
        id: docRef.id,
        filename: file.name,
        status: "Open",
        priority: "Medium",
        imageUrl,
        description,
        email,
        affectedPath,
        affectedCluster,
        affectedComponent,
        os,
        browserName,
        browserVersion,
        canvas_size,
        timestamp: {
            created_time: Timestamp.now(),
            lastUpdated_time: Timestamp.now(),
        },
    };
    // console.log("Created New Issue: " + newIssue);

    // Filter out undefined values (Firebase don't allow undefined)
    const filteredIssue: Partial<Issue> = Object.fromEntries(
        Object.entries(newIssue).filter(([_, v]) => v !== undefined)
    );

    try {
        await setDoc(docRef, filteredIssue);
        if (profile) {
            const username = profile.name || profile.email || "Anonymous";
            addLog(
                `User '${username}' submit issue with id ${newIssue.id}`,
                `User '${username}' submit issue with id ${newIssue.id}`,
                "create",
                profile.uid,
                null,
                newIssue.id,
                "issue",
                null
            );
        }
        return docRef.id;
    } catch (error) {
        console.error("Error creating issue: ", error);
    }
}

// This is a function to create or update a survey based on user input.
export async function createOrUpdateSurvey(
    feeling?: string,
    userThoughts?: string,
    email?: string,
    lastClosedTimestamp?: Timestamp,
    lastSurveyTimestamp?: Timestamp
) {
    // This creates a reference to a specific document in the 'survey' collection using the user's email as the document ID.
    if (!email) return;
    const surveyDocRef = doc(REFS.survey, email);
    // This tries to fetch the data of the document referenced by surveyDocRef.
    const surveyDocSnapshot = await getDoc(surveyDocRef);

    // This is the new data you want to add or update in the document.
    const newSurveyData = {
        userThoughts,
        feeling,
        email,
        lastSurveyTimestamp,
        lastClosedTimestamp,
    };

    // This removes any undefined values from the new data. Firestore does not allow storing undefined values.
    const filteredSurveyData = Object.fromEntries(Object.entries(newSurveyData).filter(([_, v]) => v !== undefined));

    try {
        // If the document already exists (i.e., user has previously submitted a survey)
        if (surveyDocSnapshot.exists()) {
            // Update the existing document with the new data.
            await updateDoc(surveyDocRef, filteredSurveyData);
        } else {
            // If the document doesn't exist (i.e., it's the user's first time submitting a survey)
            // Create a new document with the given data.
            await setDoc(surveyDocRef, filteredSurveyData);
        }
    } catch (error) {
        // If there's any error during the above operations, it will be caught and logged here.
        console.error("Error updating or creating survey: ", error);
    }
}

// Helper function to filter out undefined values
function filterUndefinedFields<T>(data: T): Partial<T> {
    return Object.fromEntries(Object.entries(data as object).filter(([_, v]) => v !== undefined)) as Partial<T>;
}

// Generic function to update or create fields in a document
async function updateOrCreateDocFields<T>(
    collectionRef: CollectionReference,
    docId: string,
    newData: T
): Promise<void> {
    const docRef = doc(collectionRef, docId);
    const docSnapshot = await getDoc(docRef);
    const filteredData = filterUndefinedFields(newData) as DocumentData;

    if (docSnapshot.exists()) {
        await updateDoc(docRef, filteredData);
    } else {
        await setDoc(docRef, filteredData);
    }
}

// Function to update or create the priority of an issue
export async function UpdateCreatePriority(issueId: string, priority: string): Promise<void> {
    await updateOrCreateDocFields(REFS.issue, issueId, { priority });
}

// Function to update or create the status of an issue
export async function UpdateCreateStatus(issueId: string, status: string): Promise<void> {
    await updateOrCreateDocFields(REFS.issue, issueId, { status });
}

export async function UpdateCreateAssignee(issueId: string, assignee: string): Promise<void> {
    await updateOrCreateDocFields(REFS.issue, issueId, { assignee });
}
