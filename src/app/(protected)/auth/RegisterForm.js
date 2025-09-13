"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import TextInput from "@/components/ui/TextInputs";
import PasswordInput from "@/components/ui/TextInputs";
import EmailInput from "@/components/ui/TextInputs";
import BigButton from "@/components/ui/Button";
import { FcGoogle } from "react-icons/fc";

// Validation regex patterns
const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const nameRegex = /^[a-zA-Z\s'-]+$/;

const RegisterForm = () => {
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState(1);
  const [fieldErrors, setFieldErrors] = useState({});
  const [formData, setFormData] = useState({
    email: "",
    name: "",
    password: "",
    confirmPassword: "",
  });

  // Validation functions
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
    if (name.trim().length < 2) {
      return "Name must be at least 2 characters long";
    }
    if (name.trim().length > 50) {
      return "Name must be less than 50 characters";
    }
    if (!nameRegex.test(name.trim())) {
      return "Name can only contain letters, spaces, hyphens, and apostrophes";
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
    if (password.length > 128) {
      return "Password must be less than 128 characters";
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

  const handleEmailSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setFieldErrors({});
    setLoading(true);

    const email = formData.email;
    const emailError = validateEmail(email);

    if (emailError) {
      setFieldErrors({ email: emailError });
      setLoading(false);
      return;
    }

    try {
      // Check if email already exists
      const response = await fetch("/api/auth/check-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim().toLowerCase() }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Failed to check email");
      }

      if (data.exists) {
        setError("Email already registered. Please sign in instead.");
      } else {
        // Email is available, proceed to next step
        setStep(2);
      }
    } catch (error) {
      console.error("Email check error:", error);
      setError(error.message || "Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleFinalSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setFieldErrors({});
    setLoading(true);

    const { email, name, password, confirmPassword } = formData;

    // Validate all fields
    const errors = {};

    const emailError = validateEmail(email);
    if (emailError) errors.email = emailError;

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
      setLoading(false);
      return;
    }

    try {
      const response = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          email: email.trim().toLowerCase(),
          password,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Registration failed");
      }

      // Auto sign in after successful registration
      const result = await signIn("credentials", {
        email: email.trim().toLowerCase(),
        password,
        redirect: false,
      });

      if (result?.error) {
        setError(
          "Registration successful but sign in failed. Please try signing in manually."
        );
      } else {
        // Registration and sign in successful - AuthWrapper will handle routing based on onboarding status
        // No need to redirect here, let AuthWrapper determine the correct path
        console.log(
          "Registration and sign in successful, AuthWrapper will handle routing"
        );
      }
    } catch (error) {
      console.error("Registration error:", error);
      setError(error.message || "Registration failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    try {
      setError("");
      setLoading(true);

      console.log("Starting Google sign in...");

      // Use default redirect behavior for OAuth
      await signIn("google", {
        callbackUrl: "/dashboard",
      });
    } catch (error) {
      console.error("Google sign in error:", error);
      setError(`Google sign in failed: ${error.message}`);
      setLoading(false);
    }
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

  const goBack = () => {
    setStep(1);
    setError("");
    setFieldErrors({});
  };

  return (
    <div className="py-[27px] px-[24px] bg-white rounded-lg border border-[#E2E8F0]">
      {step === 1 ? (
        // Step 1: Email only
        <>
          <h2 className="text-3xl font-semibold text-[#020617] text-center mb-4">
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
              disabled={loading}
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
            disabled={loading}
            className="w-full h-[47px] shadow-[0px_4px_12px_0px_#0000001A] flex justify-center items-center py-2 px-4 border border-[#EAECF0] rounded-md text-sm font-medium text-[#000000] bg-white hover:bg-gray-50 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <FcGoogle className="w-5 h-5 mr-2" />
            Sign up with Google
          </button>
        </>
      ) : (
        // Step 2: Name and Password
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
              placeholder="••••"
              type="password"
              name="password"
              value={formData.password}
              onChange={(e) => handleInputChange("password", e.target.value)}
              error={fieldErrors.password}
              required
              className="mb-4"
            />

            <PasswordInput
              label="Set Password"
              placeholder="••••"
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
              <BigButton
                type="submit"
                disabled={loading}
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
