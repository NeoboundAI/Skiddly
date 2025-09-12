"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import Link from "next/link";
import TextInput from "@/components/ui/TextInputs";
import PasswordInput from "@/components/ui/TextInputs";
import EmailInput from "@/components/ui/TextInputs";
import BigButton from "@/components/ui/Button";
import { FcGoogle } from "react-icons/fc";

// Email validation regex
const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const LoginForm = () => {
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });
  const [fieldErrors, setFieldErrors] = useState({});
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  // Validate fields before submit
  const validate = () => {
    const errors = {};

    // Email validation
    if (!formData.email.trim()) {
      errors.email = "Email is required";
    } else if (!emailRegex.test(formData.email.trim())) {
      errors.email = "Please enter a valid email address";
    }

    // Password validation
    if (!formData.password) {
      errors.password = "Password is required";
    } else if (formData.password.length < 6) {
      errors.password = "Password must be at least 6 characters";
    }

    return errors;
  };

  const handleInputChange = (field, value) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));

    // Clear field-specific error when user starts typing
    if (fieldErrors[field]) {
      setFieldErrors((prev) => ({
        ...prev,
        [field]: undefined,
      }));
    }

    // Clear general error when user makes changes
    if (error) {
      setError("");
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setFieldErrors({});
    setLoading(true);

    // Client-side validation
    const errors = validate();
    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      setLoading(false);
      return;
    }

    const { email, password } = formData;

    try {
      const result = await signIn("credentials", {
        email: email.trim().toLowerCase(),
        password,
        redirect: false,
      });

      if (result?.error) {
        // Handle specific error cases
        switch (result.error) {
          case "Invalid credentials":
            setError(
              "Invalid email or password. Please check your credentials and try again."
            );
            break;
          default:
            setError(
              "Sign in failed. Please check your credentials and try again."
            );
        }
      } else if (result?.ok) {
        // Sign in successful - AuthWrapper will handle routing based on onboarding status
        // No need to redirect here, let AuthWrapper determine the correct path
        console.log("Sign in successful, AuthWrapper will handle routing");
      } else {
        setError("Something went wrong. Please try again.");
      }
    } catch (error) {
      console.error("Sign in error:", error);
      setError("Network error. Please check your connection and try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    try {
      setError("");
      setLoading(true);

      const result = await signIn("google", {
        redirect: false,
      });

      if (result?.error) {
        setError("Google sign in failed. Please try again.");
      } else if (result?.ok) {
        // Google sign in successful - AuthWrapper will handle routing based on onboarding status
        // No need to redirect here, let AuthWrapper determine the correct path
        console.log(
          "Google sign in successful, AuthWrapper will handle routing"
        );
      }
    } catch (error) {
      console.error("Google sign in error:", error);
      setError("Google sign in failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="py-[27px] px-[24px] bg-white rounded-lg border border-[#E2E8F0]">
      <form onSubmit={handleSubmit} className="">
        <EmailInput
          label="Email"
          placeholder="Eg. john@abc.com"
          type="email"
          name="email"
          value={formData.email}
          onChange={(e) => handleInputChange("email", e.target.value)}
          error={fieldErrors.email}
          required
          className="mb-4"
        />

        <PasswordInput
          label="Password"
          placeholder="••••"
          type="password"
          name="password"
          value={formData.password}
          onChange={(e) => handleInputChange("password", e.target.value)}
          error={fieldErrors.password}
          required
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

        {error && (
          <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-md">
            <p className="text-sm text-red-600">{error}</p>
          </div>
        )}

        <BigButton
          type="submit"
          disabled={loading}
          loadingText="Signing in..."
          className="mt-4"
        >
          Sign in via email
        </BigButton>
      </form>

      <div className="text-[#020617] py-4 text-center text-sm font-medium">
        or
      </div>

      <button
        type="button"
        onClick={handleGoogleSignIn}
        disabled={loading}
        className="w-full h-[47px] shadow-[0px_4px_12px_0px_#0000001A] flex justify-center items-center py-2 px-4 border border-[#EAECF0] rounded-md text-sm font-medium text-[#000000] bg-white hover:bg-gray-50 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
      >
        <FcGoogle className="w-5 h-5 mr-2" />
        Sign in with Google
      </button>
    </div>
  );
};

export default LoginForm;
