import { useCurrentModel } from "../reusable/hooks/useCurrentModel";
import { Model, Prototype } from "../apis/models";
import { useParamsX } from "../reusable/hooks/useUpdateNavigate";
import { useEffect, useState } from "react";
import { getPrototypes } from "../apis";
import LoadingPage from "./components/LoadingPage";

const PrototypeStandalonePresent = () => {
    const model = useCurrentModel() as Model;

    const { prototype_id = "" } = useParamsX();

    const [prototype, setPrototype] = useState<Prototype>();
    const [loading, setLoading] = useState(true);

    const downloadPrototype = () => {
        getPrototypes(model.id)
            .then((prototypes) => {
                let proto = prototypes.find((prototype) => prototype.id === prototype_id);
                if (proto) {
                    setPrototype(proto);
                }
            })
            .catch((err) => {
                console.log(err);
            })
            .finally(() => {
                setLoading(false);
            });
    };

    useEffect(() => {
        downloadPrototype();
    }, [model.id]);

    if (loading) {
        return <LoadingPage />;
    }

    return (
        <div className="w-full h-screen grid place-items-center">
            <div className="w-full max-w-[800px] font-bold text-3xl py-16 text-center bg-slate-100 text-slate-400 rounded">
                {model?.name} - {prototype?.name}
            </div>
        </div>
    );
};

export default PrototypeStandalonePresent;
