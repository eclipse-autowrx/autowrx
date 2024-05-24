import { useState } from "react";
import { DaImage } from "../atoms/DaImage";
import { DaButton } from "../atoms/DaButton";
import DaNavUser from "../molecules/DaNavUser";
import { Link } from "react-router-dom";
import { FaCar } from "react-icons/fa";

const NavigationBar = ({}) => {
  const [model, setModel] = useState<any>(null);

  return (
    <div className="da-nav-bar ">
      <Link to="/">
        <DaImage src="/imgs/logo.jpg" className="da-nav-bar-logo" />
      </Link>

      <div className="grow"></div>
      {/* Model selection */}
      <Link to={model ? `/model/${model?.id}` : "/model"}>
        <DaButton variant="plain">
          <div className="flex items-center">
            {model ? (
              <>
                <FaCar style={{ transform: "scale(1.3)" }} className="mr-3" />
                {model.name || "no-name"}
              </>
            ) : (
              <>
                <FaCar style={{ transform: "scale(1.4)" }} className="mr-3" />
                Select Model
              </>
            )}
          </div>
        </DaButton>
      </Link>

      <DaNavUser />
    </div>
  );
};

export { NavigationBar };
