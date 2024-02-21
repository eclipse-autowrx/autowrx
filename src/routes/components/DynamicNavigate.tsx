import { generatePath, Navigate, NavigateProps, useParams } from "react-router-dom";
import { useParamsX } from "../../reusable/hooks/useUpdateNavigate";

interface DynamicNavigateProps extends NavigateProps {}

const DynamicNavigate = ({ to, ...props }: DynamicNavigateProps) => {
    const dynamicTo = generatePath(to.toString(), useParamsX());

    return <Navigate to={dynamicTo} />;
};

export default DynamicNavigate;
