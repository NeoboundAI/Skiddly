"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import TextInput from "@/components/ui/TextInputs";
import PasswordInput from "@/components/ui/TextInputs";
import EmailInput from "@/components/ui/TextInputs";
import BigButton from "@/components/ui/Button";

const LoginForm = () => {
  const router = useRouter();
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    const formData = new FormData(e.target);
    const email = formData.get("email");
    const password = formData.get("password");

    try {
      const result = await signIn("credentials", {
        email,
        password,
        redirect: false,
      });

      if (result.error) {
        setError("Invalid email or password");
      } else {
        router.push("/dashboard");
      }
    } catch (error) {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = () => {
    signIn("google", { callbackUrl: "/dashboard" });
  };

  return (
    <div className="py-[27px] px-[24px] bg-white rounded-lg border border-[#E2E8F0]">
      <form onSubmit={handleSubmit} className="">
        <EmailInput
          label="Email"
          placeholder="Eg. john@abc.com"
          type="email"
          name="email"
          className="mb-4"
        />

        <PasswordInput
          label="Password"
          placeholder="••••"
          type="password"
          name="password"
          className="mb-2"
        />

        <div className="flex items-center justify-start underline">
          <Link
            href="/auth/forgot-password"
            className="text-sm text-[#64748B] hover:text-[#020617]"
          >
            Forgot password?
          </Link>
        </div>

        <BigButton
          type="submit"
          disabled={loading}
          loadingText="Signing in..."
          className="mt-4"
        >
          Sign in via email
        </BigButton>
      </form>

      <div className="text-[#020617] py-4 text-center text-sm font-medium">or</div>

      <button
        type="button"
        onClick={handleGoogleSignIn}
        className="w-full flex justify-center items-center py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500"
      >
        <svg className="w-5 h-10 mr-2" viewBox="0 0 24 24">
          <path
            d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
            fill="#4285F4"
          />
          <path
            d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
            fill="#34A853"
          />
          <path
            d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
            fill="#FBBC05"
          />
          <path
            d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
            fill="#EA4335"
          />
        </svg>
        Sign in with Google
      </button>
    </div>
  );
};

export default LoginForm;
