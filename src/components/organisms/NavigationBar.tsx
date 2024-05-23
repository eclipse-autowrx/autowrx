import { DaButton } from "../atoms/DaButton";
import { DaImage } from "../atoms/DaImage";

const NavigationBar = ({}) => {
  return (
    <div className="da-nav-bar ">
      <DaImage src="imgs/logo-wide.png" className="da-nav-bar-logo" />
      <div className="grow"></div>
      <DaButton variant="outline-nocolor">Login</DaButton>
    </div>
  );
};

export { NavigationBar };
