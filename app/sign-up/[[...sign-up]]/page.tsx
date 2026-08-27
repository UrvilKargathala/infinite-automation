import Image from "next/image";
import { SignUp } from "@clerk/nextjs";
import { clerkAppearance } from "@/lib/clerkAppearance";

export default function SignUpPage() {
  return (
    <div className="min-h-screen flex">
      {/* Left — sign-up form */}
      <div className="flex-1 flex items-center justify-center px-6 py-12 bg-white">
        <div className="w-full max-w-sm">
          <div className="flex items-center gap-3 mb-10">
            <Image src="/logo.png" alt="Infinite Automation" width={44} height={44} className="rounded-xl" />
            <div>
              <h1 className="text-xl font-normal text-text-primary leading-tight">Infinite Automation</h1>
              <p className="text-xs text-text-muted">Operations Dashboard</p>
            </div>
          </div>

          <h2 className="text-2xl font-light text-text-primary mb-1">Create your account</h2>
          <p className="text-sm text-text-secondary mb-8">Sign up to get started</p>

          <SignUp
            appearance={clerkAppearance}
            signInUrl="/sign-in"
            fallbackRedirectUrl="/dashboard"
          />
        </div>
      </div>

      {/* Right — image panel */}
      <div className="hidden lg:flex flex-1 relative overflow-hidden">
        <Image src="/login-bg.jpg" alt="Smart home automation" fill className="object-cover" priority />
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
