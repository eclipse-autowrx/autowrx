import { useState } from "react";
import { DaImage } from "../atoms/DaImage";
import { DaButton } from "../atoms/DaButton";
import DaMenu from "../atoms/DaMenu";
import DaNavUser from "../molecules/DaNavUser";
import { Link } from "react-router-dom";
import { FaCar } from "react-icons/fa";
import { FiGrid } from "react-icons/fi";
import { HiMenu } from "react-icons/hi";
import useModelStore from "@/stores/modelStore";
import { Model } from "@/types/model.type";

const NavigationBar = ({ }) => {
  const [model] = useModelStore(
    (state) => [state.model as Model]
  );

  return (
    <div className="da-nav-bar ">
      <Link to="/">
        <DaImage src="/imgs/logo-wide.png" className="da-nav-bar-logo" />
      </Link>

      <div className="grow"></div>
      {/* Model selection */}
      <Link to="/model">
        <DaButton variant="plain">
          <div className="flex items-center">
            {
              model ? (<>
                <FiGrid style={{ transform: "scale(1.5)" }} className="mr-3" />
                <div className="truncate max-w-[180px]">{model.name || "no-name"}</div>
              </>) : (<>
                <FaCar style={{ transform: "scale(1.5)" }} className="mr-3" />
                Select Model
              </>)
            }
          </div>
        </DaButton>
      </Link>

      {/* <DaMenu trigger={<div className="da-clickable flex h-full items-center px-4 text-da-gray-dark">
        <HiMenu size={22}/></div>}>
        <div className="px-4 py-2 da-menu-item ">Menu item 1</div>
        <div className="px-4 py-2 da-menu-item ">Menu item 2</div>
      </DaMenu> */}

      <DaNavUser />
    </div>
  );
};

export { NavigationBar };
