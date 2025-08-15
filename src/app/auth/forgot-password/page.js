import ForgotPasswordForm from "./ForgotPasswordForm";

const ForgotPasswordPage = () => {
  return (
    <div className="min-h-screen p-4 flex bg-gradient-to-b from-purple-200 via-purple-50 to-purple-100">
      {/* Left side with logo */}
      <div className="w-[35%] flex flex-col items-center justify-center">
        <div className="flex flex-col items-center">
          <div className="mb-4">
            {/* Logo */}
            <img
              src="/skiddly.svg"
              alt="Skiddly Logo"
              className="w-60 h-30"
              style={{ filter: "drop-shadow(0 2px 8px rgba(128,90,213,0.15))" }}
            />
          </div>
        </div>
      </div>
      {/* Right side with form */}
      <div
        style={{
          backgroundImage: "url('/dotpattern.svg')",
          backgroundSize: "cover",
          backgroundPosition: "center",
        }}
        className="w-[65%] flex border border-[#D9D6FE] bg-[#F9FAFB] rounded-lg flex-col items-center justify-center"
      >
        <div className="w-[420px]">
          <ForgotPasswordForm />
        </div>
      </div>
    </div>
  );
};

export default ForgotPasswordPage;
