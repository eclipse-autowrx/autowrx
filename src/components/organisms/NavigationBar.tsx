import { useState } from "react";
import { DaImage } from "../atoms/DaImage";
import { DaButton } from "../atoms/DaButton";
import DaMenu from "../atoms/DaMenu";
import DaNavUser from "../molecules/DaNavUser";
import { Link } from "react-router-dom";
import { FaCar } from "react-icons/fa";
import { HiMenu } from "react-icons/hi";

const NavigationBar = ({}) => {
  const [model, setModel] = useState<any>(null);

  return (
    <div className="da-nav-bar ">
      <Link to="/">
        <DaImage src="/imgs/logo-wide.png" className="da-nav-bar-logo" />
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

      <DaMenu trigger={<div className="da-clickable flex h-full items-center px-4 text-da-gray-dark">
        <HiMenu size={22}/></div>}>
        <div className="px-4 py-2 da-menu-item ">Menu item 1</div>
        <div className="px-4 py-2 da-menu-item ">Menu item 2</div>
      </DaMenu>

      <DaNavUser />
    </div>
  );
};

export { NavigationBar };
