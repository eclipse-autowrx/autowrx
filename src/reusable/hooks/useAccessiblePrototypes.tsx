import { useEffect, useState } from "react";
import { query, where, getDocs, FirestoreError } from "firebase/firestore";
import { REFS } from "../../apis/firebase";
import useCurrentUser from "./useCurrentUser";
import { Prototype } from "../../apis/models";
import { useCurrentTenantModels } from "./useCurrentTenantModels";

const useAccessiblePrototypes = () => {
    const { isLoggedIn, user, profile, modelContributor } = useCurrentUser();
    const [prototypes, setPrototypes] = useState<Prototype[]>([]);
    const [error, setError] = useState<FirestoreError | null>(null);
    const models = useCurrentTenantModels();

    useEffect(() => {
        const fetchPrototypes = async () => {
            try {
                // Combine modelContributor IDs with IDs of public models
                const accessibleModelIds = models
                    .filter((model) => model.visibility === "public" || modelContributor.includes(model.id))
                    .map((model) => model.id);

                if (accessibleModelIds.length > 0) {
                    const prototypesQuery = query(REFS.prototype, where("model_id", "in", accessibleModelIds));
                    const querySnapshot = await getDocs(prototypesQuery);
                    const accessiblePrototypes = querySnapshot.docs.map((doc) => doc.data() as Prototype);
                    setPrototypes(accessiblePrototypes);
                }
            } catch (err) {
                if (err instanceof FirestoreError) {
                    setError(err);
                } else {
                    console.error("An unexpected error occurred:", err);
                }
            }
        };

        fetchPrototypes();
    }, [isLoggedIn, modelContributor, models]);

    return { prototypes, error };
};

export default useAccessiblePrototypes;
