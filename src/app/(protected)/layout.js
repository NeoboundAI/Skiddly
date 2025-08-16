import AuthWrapper from "@/components/AuthWrapper";

export default function ProtectedLayout({ children }) {
  return <AuthWrapper>{children}</AuthWrapper>;
}
