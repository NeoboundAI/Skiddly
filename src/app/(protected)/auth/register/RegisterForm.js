"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import EmailInput from "@/components/ui/TextInputs";
import PasswordInput from "@/components/ui/TextInputs";
import TextInput from "@/components/ui/TextInputs";
import BigButton from "@/components/ui/Button";
import { FcGoogle } from "react-icons/fc";
import { useAuth, useCheckEmail } from "@/lib/hooks";

// Validation regex patterns
const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const nameRegex = /^[a-zA-Z\s]{2,50}$/;

const RegisterForm = () => {
  const router = useRouter();
  const { checkEmail, register } = useAuth();

  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    email: "",
    name: "",
    password: "",
    confirmPassword: "",
  });
  const [fieldErrors, setFieldErrors] = useState({});
  const [error, setError] = useState("");

  // Email validation functions
  const validateEmail = (email) => {
    if (!email.trim()) {
      return "Email is required";
    }
    if (!emailRegex.test(email.trim())) {
      return "Please enter a valid email address";
    }
    return null;
  };

  const validateName = (name) => {
    if (!name.trim()) {
      return "Name is required";
    }
    if (!nameRegex.test(name.trim())) {
      return "Name must be 2-50 characters and contain only letters and spaces";
    }
    return null;
  };

  const validatePassword = (password) => {
    if (!password) {
      return "Password is required";
    }
    if (password.length < 6) {
      return "Password must be at least 6 characters long";
    }
    return null;
  };

  const validateConfirmPassword = (password, confirmPassword) => {
    if (!confirmPassword) {
      return "Please confirm your password";
    }
    if (password !== confirmPassword) {
      return "Passwords do not match";
    }
    return null;
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

  const handleEmailSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setFieldErrors({});

    // Validate email
    const emailError = validateEmail(formData.email);
    if (emailError) {
      setFieldErrors({ email: emailError });
      return;
    }

    try {
      // Check if email is available
      await checkEmail.mutateAsync({
        email: formData.email.trim().toLowerCase(),
      });
      setStep(2);
    } catch (error) {
      if (error.status === 409) {
        setError(
          "An account with this email already exists. Please sign in instead."
        );
      } else {
        setError(error.message || "Something went wrong. Please try again.");
      }
    }
  };

  const handleFinalSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setFieldErrors({});

    const { name, password, confirmPassword } = formData;

    // Validate all fields
    const errors = {};

    const nameError = validateName(name);
    if (nameError) errors.name = nameError;

    const passwordError = validatePassword(password);
    if (passwordError) errors.password = passwordError;

    const confirmPasswordError = validateConfirmPassword(
      password,
      confirmPassword
    );
    if (confirmPasswordError) errors.confirmPassword = confirmPasswordError;

    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      return;
    }

    try {
      // Register user
      await register.mutateAsync({
        name: name.trim(),
        email: formData.email.trim().toLowerCase(),
        password,
      });

      // Auto sign in after successful registration
      const result = await signIn("credentials", {
        email: formData.email.trim().toLowerCase(),
        password,
        redirect: false,
      });

      if (result?.ok) {
        router.push("/dashboard");
      } else {
        setError(
          "Registration successful but sign in failed. Please sign in manually."
        );
      }
    } catch (error) {
      setError(error.message || "Registration failed. Please try again.");
    }
  };

  const goBack = () => {
    setStep(1);
    setError("");
    setFieldErrors({});
  };

  const handleGoogleSignIn = async () => {
    try {
      setError("");
      const result = await signIn("google", {
        callbackUrl: "/dashboard",
        redirect: false,
      });

      if (result?.error) {
        setError("Google sign in failed. Please try again.");
      }
    } catch (error) {
      console.error("Google sign in error:", error);
      setError("Google sign in failed. Please try again.");
    }
  };

  return (
    <div className="py-[27px] px-[24px] bg-white rounded-lg border border-[#E2E8F0]">
      {step === 1 ? (
        // Step 1: Email input
        <>
          <h2 className="text-3xl font-semibold text-center mb-4">
            Start for free
          </h2>

          <form onSubmit={handleEmailSubmit} className="">
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

            {error && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md">
                <p className="text-sm text-red-600">{error}</p>
              </div>
            )}

            <BigButton
              type="submit"
              disabled={checkEmail.isPending}
              loadingText="Checking email..."
              className="mt-4"
            >
              Sign up via email
            </BigButton>
          </form>

          <div className="text-[#020617] py-4 text-center text-sm font-medium">
            or
          </div>

          <button
            type="button"
            onClick={handleGoogleSignIn}
            disabled={checkEmail.isPending}
            className="w-full h-[47px] shadow-[0px_4px_12px_0px_#0000001A] flex justify-center items-center py-2 px-4 border border-[#EAECF0] rounded-md text-sm font-medium text-[#000000] bg-white hover:bg-gray-50 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <FcGoogle className="w-5 h-5 mr-2" />
            Sign up with Google
          </button>
        </>
      ) : (
        // Step 2: Name and password
        <>
          <h2 className="text-3xl font-semibold text-center text-[#020617] mb-4">
            One last step
          </h2>

          <form onSubmit={handleFinalSubmit} className="">
            <TextInput
              label="Name"
              placeholder="Enter your full name"
              type="text"
              name="name"
              value={formData.name}
              onChange={(e) => handleInputChange("name", e.target.value)}
              error={fieldErrors.name}
              required
              className="mb-4"
            />

            <PasswordInput
              label="Password"
              placeholder="••••••"
              type="password"
              name="password"
              value={formData.password}
              onChange={(e) => handleInputChange("password", e.target.value)}
              error={fieldErrors.password}
              required
              className="mb-4"
            />

            <PasswordInput
              label="Confirm Password"
              placeholder="••••••"
              type="password"
              name="confirmPassword"
              value={formData.confirmPassword}
              onChange={(e) =>
                handleInputChange("confirmPassword", e.target.value)
              }
              error={fieldErrors.confirmPassword}
              required
              className="mb-4"
            />

            {error && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md">
                <p className="text-sm text-red-600">{error}</p>
              </div>
            )}

            <div className="flex gap-3">
              <button
                type="button"
                onClick={goBack}
                className="flex-1 py-2 px-4 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
              >
                Back
              </button>

              <BigButton
                type="submit"
                disabled={register.isPending}
                loadingText="Creating account..."
                className="flex-1"
              >
                Sign In
              </BigButton>
            </div>
          </form>
        </>
      )}
    </div>
  );
};

export default RegisterForm;
