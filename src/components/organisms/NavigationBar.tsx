import { DaImage } from "../atoms/DaImage";
import DaNavUser from "../molecules/DaNavUser";

const NavigationBar = ({}) => {
  return (
    <div className="da-nav-bar ">
      <DaImage src="/imgs/logo-wide.png" className="da-nav-bar-logo" />
      <div className="grow"></div>
      <DaNavUser />
    </div>
  );
};

export { NavigationBar };
