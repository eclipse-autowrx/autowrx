import { CachePrototype } from "../../apis/backend/prototypeApi";
import LoadingPage from "../components/LoadingPage";
import PrototypeCard from "./PrototypeCard";

type RecentPrototypesProps = {
    recents: CachePrototype[];
    loading: boolean;
};

function RecentPrototypes({ recents, loading }: RecentPrototypesProps) {
    return loading ? (
        <LoadingPage />
    ) : (
        <>
            {!recents || recents.length === 0 ? (
                <div className="flex items-center justify-center h-full">
                    Your recently accessed prototypes will be shown here.
                </div>
            ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-8 min-h-0 max-h-[calc(100vh-100px)]">
                    {recents.map((recent) => {
                        return <PrototypeCard type="cache" key={recent.id} data={recent} />;
                    })}
                </div>
            )}
        </>
    );
}

export default RecentPrototypes;
