import { DaButton } from "@/components/atoms/DaButton";
import { loginService } from "@/services/auth.service";
import useAuthStore from "@/stores/authStore";
import { isAxiosError } from "axios";
import { useState } from "react";
import { shallow } from "zustand/shallow";

const PageLogin = () => {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [access, setAccess, logOut] = useAuthStore(
    (state) => [state.access, state.setAccess, state.logOut],
    shallow
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const response = await loginService(username, password);
      setAccess(response.tokens.access);
    } catch (error) {
      if (isAxiosError(error)) {
        console.error(error.response?.data.message || "An error occurred");
      } else {
        console.error("An error occurred");
      }
    }
  };

  if (access) {
    return (
      <div>
        Logged in
        <DaButton onClick={logOut}>Log out</DaButton>
      </div>
    );
  }

  return (
    <div className="p-4 bg-slate-100 min-h-[86vh]">
      <form onSubmit={handleSubmit}>
        <label htmlFor="username" className="block">
          Username
        </label>
        <input
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          id="username"
          className="border"
        />
        <label htmlFor="username" className="block">
          Password
        </label>
        <input
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          id="password"
          type="password"
          className="border"
        />
        <br />
        <DaButton className="w-40 mt-5">Login</DaButton>
      </form>
    </div>
  );
};

export default PageLogin;
