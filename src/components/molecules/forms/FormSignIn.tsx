import { DaButton } from "@/components/atoms/DaButton";
import { DaInput } from "@/components/atoms/DaInput";
import { DaText } from "@/components/atoms/DaText";

const FormSignIn = ({}) => {
  return (
    <div className="w-[400px] min-w-[400px] min-h-[300px] block px-2 md:px-6 py-2 bg-da-white">
      {/* Title */}
      <DaText variant="title" className="text-da-primary-500">
        Sign In
      </DaText>

      <div className="mt-6"></div>
      {/* Content */}
      <DaInput placeholder="Email" label="Email" className="mt-4" />
      <DaInput
        placeholder="Password"
        label="Password"
        type="password"
        className="mt-4"
      />

      <div className="flex items-center justify-end mt-1">
        <DaButton variant="link">Forget Password</DaButton>
      </div>
      {/* Action */}
      <DaButton variant="gradient" className="w-full mt-2">
        Sign in
      </DaButton>
      {/* More */}
      <div className="mt-4 flex items-center">
        <DaText className="text-da-gray-dark">Don't have an account?</DaText>
        <DaButton variant="text" className="text-da-primary-500">
          Sign up
        </DaButton>
      </div>
    </div>
  );
};

export default FormSignIn;
