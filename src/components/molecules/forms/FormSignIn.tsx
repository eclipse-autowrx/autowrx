import { DaButton } from "@/components/atoms/DaButton";
import { DaInput } from "@/components/atoms/DaInput";
import { DaText } from "@/components/atoms/DaText";
import { loginService, registerService } from "@/services/auth.service";
import { isAxiosError } from "axios";
import { useState } from "react";
import { TbLoader } from "react-icons/tb";
import { TbAt, TbLock } from "react-icons/tb";

interface FormSignInProps {
  setAuthType: (type: "sign-in" | "register" | "forgot") => void;
}

const FormSignIn = ({ setAuthType }: FormSignInProps) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>("");

  const signIn = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    try {
      setLoading(true);
      const [email, password] = [
        e.currentTarget.email.value,
        e.currentTarget.password.value,
      ];
      await loginService(email, password);
      setError("");
      // eslint-disable-next-line no-self-assign
      window.location.href = window.location.href;
    } catch (error) {
      if (isAxiosError(error)) {
        setError(error.response?.data.message || "Something went wrong");
        return;
      }
      setError("Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form
      onSubmit={signIn}
      className="w-[400px] min-w-[400px] min-h-[300px] block px-2 md:px-6 py-2 bg-da-white"
    >
      {/* Title */}
      <DaText variant="title" className="text-da-primary-500">
        Sign In
      </DaText>

      <div className="mt-6"></div>
      {/* Content */}
      <DaInput
        name="email"
        placeholder="Email"
        label="Email"
        className="mt-4"
        Icon={TbAt}
        iconBefore
        iconSize={18}
      />
      <DaInput
        name="password"
        placeholder="Password"
        label="Password"
        type="password"
        className="mt-4"
        Icon={TbLock}
        iconBefore
        iconSize={18}
      />

      <div className="flex items-center justify-end mt-1">
        <DaButton variant="link">Forget Password</DaButton>
      </div>

      {/* Error */}
      {error && (
        <DaText variant="small" className="mt-2 text-da-accent-500">
          {error}
        </DaText>
      )}
      {/* Action */}
      <DaButton
        disabled={loading}
        type="submit"
        variant="gradient"
        className="w-full mt-2"
      >
        {loading && <TbLoader className="animate-spin text-lg mr-2" />}
        Sign in
      </DaButton>
      {/* More */}
      <div className="mt-4 flex items-center">
        <DaText className="text-da-gray-medium">Don't have an account?</DaText>
        <DaButton
          type="button"
          onClick={() => setAuthType("register")}
          variant="text"
          className="text-da-primary-500"
        >
          Register
        </DaButton>
      </div>
    </form>
  );
};

export default FormSignIn;
