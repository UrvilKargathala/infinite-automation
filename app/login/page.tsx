"use client";

import { useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { Eye, EyeOff } from "lucide-react";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (!email.trim() || !password.trim()) {
      setError("Please fill in all fields.");
      return;
    }
    setLoading(true);
    setTimeout(() => {
      if (
        email.trim().toLowerCase() === "infiniteautomation@ia.com" &&
        password === "Infinite@Automation"
      ) {
        localStorage.setItem("ia_logged_in", "true");
        router.push("/dashboard");
      } else {
        setError("Invalid email or password.");
        setLoading(false);
      }
    }, 600);
  }

  return (
    <div className="min-h-screen flex">
      {/* Left — login form */}
      <div className="flex-1 flex items-center justify-center px-6 py-12 bg-white">
        <div className="w-full max-w-sm">
          <div className="flex items-center gap-3 mb-10">
            <Image src="/logo.png" alt="Infinite Automation" width={44} height={44} className="rounded-xl" />
            <div>
              <h1 className="text-xl font-normal text-text-primary leading-tight">Infinite Automation</h1>
              <p className="text-xs text-text-muted">Operations Dashboard</p>
            </div>
          </div>

          <h2 className="text-2xl font-light text-text-primary mb-1">Welcome back</h2>
          <p className="text-sm text-text-secondary mb-8">Sign in to your account</p>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-xs text-text-secondary mb-1.5">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@company.com"
                className="w-full bg-white border border-border rounded-xl py-3 px-4 text-sm text-text-primary placeholder:text-text-muted focus:border-brand-blue focus:outline-none transition-colors"
              />
            </div>
            <div>
              <label className="block text-xs text-text-secondary mb-1.5">Password</label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  className="w-full bg-white border border-border rounded-xl py-3 px-4 pr-11 text-sm text-text-primary placeholder:text-text-muted focus:border-brand-blue focus:outline-none transition-colors"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted hover:text-text-secondary transition-colors"
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            {error && (
              <p className="text-xs text-danger">{error}</p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 rounded-xl text-sm font-normal text-white transition-opacity disabled:opacity-60"
              style={{ background: "linear-gradient(90deg, #3A90C3 0%, #44BE4A 100%)" }}
            >
              {loading ? "Signing in..." : "Sign in"}
            </button>
          </form>
        </div>
      </div>

      {/* Right — image panel */}
      <div className="hidden lg:flex flex-1 relative overflow-hidden">
        <Image
          src="/login-bg.jpg"
          alt="Smart home automation"
          fill
          className="object-cover"
          priority
        />
        <div className="absolute inset-0" style={{ background: "linear-gradient(135deg, #3A90C3CC 0%, #44BE4ACC 100%)" }} />
        <div className="relative z-10 flex flex-col items-center justify-center w-full text-center text-white px-12">
          <Image src="/logo.png" alt="" width={72} height={72} className="mb-6 rounded-2xl shadow-lg" />
          <h2 className="text-3xl font-light mb-3">Smart Automation</h2>
          <p className="text-sm opacity-80 max-w-xs leading-relaxed">
            Building intelligent homes and commercial spaces across Australia
          </p>
        </div>
      </div>
    </div>
  );
}
