import { DaImage } from "../atoms/DaImage";
import DaNavUser from "../molecules/DaNavUser";
import { Link } from "react-router-dom";

const NavigationBar = ({}) => {
  return (
    <div className="da-nav-bar ">
      <Link to="/">
        <DaImage src="/imgs/logo-wide.png" className="da-nav-bar-logo" />
      </Link>

      <div className="grow"></div>
      <DaNavUser />
    </div>
  );
};

export { NavigationBar };
