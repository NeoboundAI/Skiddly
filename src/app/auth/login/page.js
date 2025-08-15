import LoginForm from "./LoginForm";

const LoginPage = () => {
  return (
    <div className="min-h-screen flex">
      {/* Left Section - Purple Gradient */}
      <div className="hidden lg:flex lg:w-1/3 bg-gradient-to-br from-purple-600 to-purple-400 items-center justify-center">
        <div className="text-center text-white">
          <div className="flex items-center justify-center space-x-2 mb-8">
            <div className="w-12 h-12 bg-white rounded-lg flex items-center justify-center">
              <svg
                className="w-8 h-8 text-purple-600"
                viewBox="0 0 24 24"
                fill="currentColor"
              >
                <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
              </svg>
            </div>
            <span className="text-3xl font-bold">Skiddly</span>
          </div>
          <h1 className="text-2xl font-semibold mb-2">Welcome back!</h1>
          <p className="text-purple-100">Sign in to your account to continue</p>
        </div>
      </div>

      {/* Right Section - Form */}
      <div className="flex-1 flex items-center justify-center px-4 sm:px-6 lg:px-8">
        <div className="w-full max-w-md">
          {/* Tabs */}
          <div className="flex bg-gray-100 rounded-lg p-1 mb-8">
            <button className="flex-1 py-2 px-4 text-sm font-medium text-gray-900 bg-white rounded-md shadow-sm">
              Sign in
            </button>
            <a
              href="/auth/register"
              className="flex-1 py-2 px-4 text-sm font-medium text-gray-500 hover:text-gray-700"
            >
              Sign up
            </a>
          </div>

          {/* Form */}
          <LoginForm />
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
