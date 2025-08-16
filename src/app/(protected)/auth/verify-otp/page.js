import AuthLayout from "@/components/AuthLayout";
import OTPForm from "./OTPForm";

const VerifyOTPPage = () => {
  return (
    <AuthLayout title="Enter OTP">
      <OTPForm />
    </AuthLayout>
  );
};

export default VerifyOTPPage;
