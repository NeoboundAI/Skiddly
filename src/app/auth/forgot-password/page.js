import AuthLayout from "@/components/AuthLayout";
import ForgotPasswordForm from "./ForgotPasswordForm";

const ForgotPasswordPage = () => {
  return (
    <AuthLayout title="Reset Password">
      <ForgotPasswordForm />
    </AuthLayout>
  );
};

export default ForgotPasswordPage;
