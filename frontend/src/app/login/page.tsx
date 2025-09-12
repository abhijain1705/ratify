"use client";
import React, { useEffect, useState } from "react";
import toast, { Toaster } from "react-hot-toast";
import Image from "next/image";
import Logo from "@/assets/logo.png";
import { auth, googleProvider } from "@/firebase"; // Adjust path as needed
import { signInWithEmailAndPassword, signInWithPopup } from "firebase/auth";
import { useRouter } from "next/navigation";
import { useAuthState } from "react-firebase-hooks/auth"; // ✅ FIXED import

export default function Login() {
  const [isClient, setIsClient] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  // ✅ useAuthState hook
  const [user, userLoading] = useAuthState(auth);

  useEffect(() => {
    setIsClient(true);
    // If user is already logged in, redirect to home
    if (user && !userLoading) {
      router.replace("/");
    }
  }, [user, userLoading, router]);

  const handleEmailSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await signInWithEmailAndPassword(auth, email, password);
      toast.success("Login successful!");
      router.replace("/");
    } catch (err: any) {
      setError(err.message || "Failed to sign in.");
      toast.error(err.message || "Failed to sign in.");
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setError(null);
    setLoading(true);
    try {
      const result = await signInWithPopup(auth, googleProvider);
      if (
        result &&
        result.user &&
        (result as any)._tokenResponse?.isNewUser
      ) {
        toast.success("Signed up with Google!");
      } else {
        toast.success("Login successful!");
      }
      router.replace("/");
    } catch (err: any) {
      if (err.code === "auth/account-exists-with-different-credential") {
        toast.error("Account exists with different sign-in method.");
      } else {
        toast.error(err.message || "Google sign in failed.");
      }
      setError(err.message || "Google sign in failed.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Toaster position="top-center" />
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="bg-white p-8 rounded-lg shadow-md w-full max-w-md">
          <h2 className="text-2xl font-bold mb-6 text-center">Login</h2>
          <form className="space-y-5" onSubmit={handleEmailSignIn}>
            <div className="flex mx-auto w-full justify-center text-center gap-2 items-center">
              {isClient && (
                <Image src={Logo} alt="Saas logo" height={20} width={85} />
              )}
              <h2 className="text-[45px] font-bold">RATIFY</h2>
            </div>
            <div>
              <label
                htmlFor="email"
                className="block text-sm font-medium text-gray-700"
              >
                Email
              </label>
              <input
                type="email"
                id="email"
                className="mt-1 block w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={loading}
              />
            </div>
            <div>
              <label
                htmlFor="password"
                className="block text-sm font-medium text-gray-700"
              >
                Password
              </label>
              <input
                type="password"
                id="password"
                className="mt-1 block w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={loading}
              />
            </div>
            {error && <div className="text-red-500 text-sm">{error}</div>}
            <button
              type="submit"
              className="w-full bg-blue-600 text-white py-2 rounded-md font-semibold hover:bg-blue-700 transition"
              disabled={loading}
            >
              {loading ? "Logging in..." : "Login"}
            </button>
          </form>
          <div className="mt-4 text-center text-sm text-gray-600">
            Don&#39;t have an account?{" "}
            <a href="/signup" className="text-blue-600 hover:underline">
              Sign up
            </a>
            <div className="w-full mt-6">
              <button
                type="button"
                className="w-full flex items-center justify-center gap-2 border border-gray-300 py-2 rounded-md font-semibold bg-white hover:bg-gray-50 transition shadow-sm"
                onClick={handleGoogleSignIn}
                disabled={loading}
              >
                <svg
                  width="20"
                  height="20"
                  viewBox="0 0 48 48"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <g clipPath="url(#clip0_17_40)">
                    <path
                      d="M47.532 24.552c0-1.638-.147-3.204-.419-4.704H24.468v9.02h13.008c-.56 3.02-2.24 5.58-4.78 7.3v6.06h7.72c4.52-4.16 7.116-10.3 7.116-17.676z"
                      fill="#4285F4"
                    />
                    <path
                      d="M24.468 48c6.48 0 11.92-2.14 15.892-5.82l-7.72-6.06c-2.14 1.44-4.88 2.3-8.172 2.3-6.28 0-11.6-4.24-13.508-9.98H2.572v6.26C6.532 43.98 15.004 48 24.468 48z"
                      fill="#34A853"
                    />
                    <path
                      d="M10.96 28.44c-.52-1.44-.82-2.98-.82-4.56s.3-3.12.82-4.56v-6.26H2.572A23.98 23.98 0 000 24c0 3.98.96 7.76 2.572 11.08l8.388-6.64z"
                      fill="#FBBC05"
                    />
                    <path
                      d="M24.468 9.76c3.52 0 6.68 1.22 9.16 3.62l6.86-6.86C36.388 2.14 30.948 0 24.468 0 15.004 0 6.532 4.02 2.572 10.02l8.388 6.26c1.908-5.74 7.228-9.98 13.508-9.98z"
                      fill="#EA4335"
                    />
                  </g>
                  <defs>
                    <clipPath id="clip0_17_40">
                      <rect width="48" height="48" fill="white" />
                    </clipPath>
                  </defs>
                </svg>
                {loading ? "Please wait..." : "Login with Google"}
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
