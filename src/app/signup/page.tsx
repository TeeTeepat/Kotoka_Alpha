"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { motion } from "framer-motion";
import { User, Mail, Lock, Eye, EyeOff, AlertCircle, CheckCircle2, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M17.64 9.205c0-.639-.057-1.252-.164-1.841H9v3.481h4.844a4.14 4.14 0 01-1.796 2.716v2.259h2.908c1.702-1.567 2.684-3.875 2.684-6.615z" fill="#4285F4"/>
      <path d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 009 18z" fill="#34A853"/>
      <path d="M3.964 10.71A5.41 5.41 0 013.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.996 8.996 0 000 9c0 1.452.348 2.827.957 4.042l3.007-2.332z" fill="#FBBC05"/>
      <path d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 00.957 4.958L3.964 7.29C4.672 5.163 6.656 3.58 9 3.58z" fill="#EA4335"/>
    </svg>
  );
}

function InputField({
  label, type, value, onChange, onBlur, placeholder, icon: Icon, rightSlot, error,
}: {
  label: string; type: string; value: string; onChange: (v: string) => void;
  onBlur?: () => void;
  placeholder: string; icon: React.ElementType; rightSlot?: React.ReactNode; error?: string;
}) {
  return (
    <div className="space-y-1.5">
      <label className="font-heading font-bold text-sm text-dark block">{label}</label>
      <div className={cn(
        "flex items-center gap-3 px-4 py-3 rounded-2xl bg-white border-[1.5px] transition-colors",
        error ? "border-red-300" : "border-card-border focus-within:border-primary"
      )}>
        <Icon className="w-4 h-4 text-gray-400 flex-shrink-0" />
        <input
          type={type}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onBlur={onBlur}
          placeholder={placeholder}
          className="flex-1 bg-transparent font-body text-sm text-dark placeholder-gray-300 outline-none"
        />
        {rightSlot}
      </div>
      {error && (
        <p className="font-body text-xs text-red-500 flex items-center gap-1">
          <AlertCircle className="w-3 h-3" />{error}
        </p>
      )}
    </div>
  );
}

function PasswordStrength({ password }: { password: string }) {
  const checks = [
    { label: "6+ characters", ok: password.length >= 6 },
    { label: "Uppercase letter", ok: /[A-Z]/.test(password) },
    { label: "Number", ok: /\d/.test(password) },
  ];
  if (!password) return null;
  return (
    <div className="flex gap-3 flex-wrap">
      {checks.map(({ label, ok }) => (
        <div key={label} className={cn("flex items-center gap-1 text-[11px] font-body", ok ? "text-emerald-500" : "text-gray-400")}>
          <CheckCircle2 className="w-3 h-3" />
          {label}
        </div>
      ))}
    </div>
  );
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
type EmailStatus = "idle" | "checking" | "valid" | "invalid";

export default function SignupPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [emailStatus, setEmailStatus] = useState<EmailStatus>("idle");
  const [emailError, setEmailError] = useState<string | undefined>();
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const verifyEmail = async (value: string) => {
    if (!EMAIL_RE.test(value)) {
      setEmailStatus("invalid");
      setEmailError("Please enter a valid email address");
      return;
    }
    setEmailStatus("checking");
    setEmailError(undefined);
    try {
      const res = await fetch(`/api/auth/verify-email?email=${encodeURIComponent(value)}`);
      const data = await res.json();
      if (data.valid) {
        setEmailStatus("valid");
        setEmailError(undefined);
      } else {
        setEmailStatus("invalid");
        setEmailError(data.message ?? "This email address is not valid");
      }
    } catch {
      setEmailStatus("valid"); // network error → don't block
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) { setError("Please fill in all required fields"); return; }
    if (emailStatus === "checking") { setError("Please wait — verifying your email…"); return; }
    if (emailStatus === "invalid") { setError(emailError ?? "Please enter a valid email address"); return; }
    if (!EMAIL_RE.test(email)) { setError("Please enter a valid email address"); return; }
    if (password.length < 6) { setError("Password must be at least 6 characters"); return; }
    if (password !== confirm) { setError("Passwords do not match"); return; }

    setLoading(true);
    setError("");

    const res = await fetch("/api/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, email, password }),
    });

    if (!res.ok) {
      const data = await res.json();
      setError(data.error || "Registration failed");
      setLoading(false);
      return;
    }

    // Auto sign-in after registration
    const signInRes = await signIn("credentials", { email, password, redirect: false });
    setLoading(false);
    if (signInRes?.error) {
      setSuccess(true); // registered but auto-login failed, redirect manually
      setTimeout(() => router.push("/login"), 1500);
    } else {
      router.push("/onboarding/language");
      router.refresh();
    }
  };

  const handleGoogle = async () => {
    setGoogleLoading(true);
    await signIn("google", { callbackUrl: "/onboarding/language" });
  };

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center px-4 py-12">
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="w-full max-w-sm space-y-6"
      >
        {/* Logo + heading */}
        <div className="flex flex-col items-center gap-3">
          <Image src="/logo.png" alt="Kotoka" width={56} height={56} className="rounded-2xl shadow-card" />
          <div className="text-center">
            <h1 className="font-heading font-extrabold text-2xl text-dark">Create account ✨</h1>
            <p className="font-body text-sm text-gray-500 mt-1">Start your vocabulary journey today</p>
          </div>
        </div>

        {/* Google button */}
        <motion.button
          whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}
          onClick={handleGoogle}
          disabled={googleLoading}
          className="w-full flex items-center justify-center gap-3 py-3.5 rounded-2xl bg-white border-[1.5px] border-card-border shadow-card font-heading font-bold text-sm text-dark hover:border-gray-300 transition-colors disabled:opacity-60"
        >
          {googleLoading ? (
            <div className="w-4 h-4 border-2 border-gray-300 border-t-primary rounded-full animate-spin" />
          ) : <GoogleIcon />}
          Continue with Google
        </motion.button>

        {/* Divider */}
        <div className="flex items-center gap-3">
          <div className="flex-1 h-px bg-card-border" />
          <span className="font-body text-xs text-gray-400">or sign up with email</span>
          <div className="flex-1 h-px bg-card-border" />
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <InputField
            label="Name (optional)" type="text" value={name} onChange={setName}
            placeholder="Your name" icon={User}
          />
          <InputField
            label="Email" type="email" value={email}
            onChange={(v) => {
              setEmail(v);
              setEmailStatus("idle");
              setEmailError(undefined);
            }}
            onBlur={() => { if (email) verifyEmail(email); }}
            placeholder="you@example.com" icon={Mail}
            error={emailError}
            rightSlot={
              emailStatus === "checking" ? (
                <Loader2 className="w-4 h-4 text-gray-400 animate-spin flex-shrink-0" />
              ) : emailStatus === "valid" ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-500 flex-shrink-0" />
              ) : emailStatus === "invalid" ? (
                <AlertCircle className="w-4 h-4 text-red-400 flex-shrink-0" />
              ) : null
            }
          />
          <div className="space-y-1.5">
            <InputField
              label="Password" type={showPw ? "text" : "password"} value={password}
              onChange={setPassword} placeholder="Min. 6 characters" icon={Lock}
              rightSlot={
                <button type="button" onClick={() => setShowPw(s => !s)} className="text-gray-300 hover:text-gray-500">
                  {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              }
            />
            <PasswordStrength password={password} />
          </div>
          <InputField
            label="Confirm Password" type={showPw ? "text" : "password"} value={confirm}
            onChange={setConfirm} placeholder="Repeat password" icon={Lock}
            error={confirm && password !== confirm ? "Passwords don't match" : undefined}
          />

          {error && (
            <motion.div initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }}
              className="flex items-center gap-2 bg-red-50 border border-red-200 rounded-xl px-3 py-2.5">
              <AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0" />
              <p className="font-body text-sm text-red-600">{error}</p>
            </motion.div>
          )}

          {success && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
              className="flex items-center gap-2 bg-emerald-50 border border-emerald-200 rounded-xl px-3 py-2.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-500" />
              <p className="font-body text-sm text-emerald-600">Account created! Redirecting to login…</p>
            </motion.div>
          )}

          <motion.button
            whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}
            type="submit"
            disabled={loading || success}
            className="btn-aqua w-full py-3.5 disabled:opacity-60"
          >
            {loading ? (
              <div className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
            ) : "Create Account"}
          </motion.button>
        </form>

        <p className="text-center font-body text-sm text-gray-500">
          Already have an account?{" "}
          <Link href="/login" className="font-bold text-primary hover:underline">Sign in</Link>
        </p>
      </motion.div>
    </div>
  );
}
