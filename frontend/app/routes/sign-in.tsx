import type { Route } from "./+types/sign-in";
import { Navigate } from "react-router";

export function meta({}: Route.MetaArgs) {
  return [
    { title: "Sign in — MonadSwift" },
    { name: "description", content: "Sign in with email or Google to open your Nano-Bank." },
  ];
}

/** Opens the home page with the auth modal (Privy). */
export default function SignIn() {
  return <Navigate to="/?auth=1" replace />;
}
