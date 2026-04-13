"use client";

import { useState, useEffect, Suspense } from "react";
import { signIn } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { motion } from "framer-motion";
import { Mail, Lock, Eye, EyeOff, AlertCircle, ShieldAlert } from "lucide-react";
import { cn } from "@/lib/utils";
import PDPAConsentModal from "@/components/pdpa/PDPAConsentModal";
import { useLocale } from "@/lib/i18n";

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
  label, type, value, onChange, placeholder, icon: Icon, rightSlot, error,
}: {
  label: string; type: string; value: string; onChange: (v: string) => void;
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

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirected = !!searchParams.get("callbackUrl");

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [error, setError] = useState("");
  const { t } = useLocale();
  const [pdpaAccepted, setPdpaAccepted] = useState(false);
  const [showPdpa, setShowPdpa] = useState(false);

  useEffect(() => {
    const accepted = localStorage.getItem("kotoka_pdpa_accepted") === "true";
    setPdpaAccepted(accepted);
    if (!accepted) setShowPdpa(true);
  }, []);

  const callbackUrl = searchParams.get("callbackUrl") ?? "/";

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) { setError("Please fill in all fields"); return; }
    setLoading(true);
    setError("");
    const res = await signIn("credentials", { email, password, redirect: false });
    setLoading(false);
    if (res?.error) {
      setError("Invalid email or password");
    } else {
      router.push(callbackUrl);
      router.refresh();
    }
  };

  const handleGoogle = async () => {
    if (!pdpaAccepted) { setShowPdpa(true); return; }
    setGoogleLoading(true);
    await signIn("google", { callbackUrl });
  };

  const handlePdpaAccept = () => {
    localStorage.setItem("kotoka_pdpa_accepted", "true");
    setPdpaAccepted(true);
    setShowPdpa(false);
  };

  const handlePdpaDecline = () => {
    setShowPdpa(false);
  };

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center px-4 py-12">
      {showPdpa && <PDPAConsentModal onAccept={handlePdpaAccept} onDecline={handlePdpaDecline} />}
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
            <h1 className="font-heading font-extrabold text-2xl text-dark">{t.loginTitle} 👋</h1>
            <p className="font-body text-sm text-gray-500 mt-1">{t.loginSubtitle}</p>
          </div>
        </div>

        {/* Redirect warning banner */}
        {redirected && (
          <motion.div
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center gap-2 bg-red-50 border border-red-200 rounded-xl px-3 py-2.5"
          >
            <ShieldAlert className="w-4 h-4 text-red-500 flex-shrink-0" />
            <p className="font-body text-sm text-red-600">Please sign in to access that page.</p>
          </motion.div>
        )}

        {/* Google button */}
        <motion.button
          whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}
          onClick={handleGoogle}
          disabled={googleLoading || !pdpaAccepted}
          className="w-full flex items-center justify-center gap-3 py-3.5 rounded-2xl bg-white border-[1.5px] border-card-border shadow-card font-heading font-bold text-sm text-dark hover:border-gray-300 transition-colors disabled:opacity-40"
        >
          {googleLoading ? (
            <div className="w-4 h-4 border-2 border-gray-300 border-t-primary rounded-full animate-spin" />
          ) : <GoogleIcon />}
          {t.loginWithGoogle}
        </motion.button>

        {/* Divider */}
        <div className="flex items-center gap-3">
          <div className="flex-1 h-px bg-card-border" />
          <span className="font-body text-xs text-gray-400">or sign in with email</span>
          <div className="flex-1 h-px bg-card-border" />
        </div>

        {/* Email/password form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <InputField
            label="Email" type="email" value={email} onChange={setEmail}
            placeholder="you@example.com" icon={Mail}
          />
          <InputField
            label="Password" type={showPw ? "text" : "password"} value={password}
            onChange={setPassword} placeholder="••••••••" icon={Lock}
            rightSlot={
              <button type="button" onClick={() => setShowPw(s => !s)} className="text-gray-300 hover:text-gray-500">
                {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            }
          />

          {error && (
            <motion.div initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }}
              className="flex items-center gap-2 bg-red-50 border border-red-200 rounded-xl px-3 py-2.5">
              <AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0" />
              <p className="font-body text-sm text-red-600">{error}</p>
            </motion.div>
          )}

          <motion.button
            whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}
            type="submit"
            disabled={loading}
            className="btn-aqua w-full py-3.5 disabled:opacity-60"
          >
            {loading ? (
              <div className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
            ) : t.loginSignIn}
          </motion.button>
        </form>

        <p className="text-center font-body text-sm text-gray-500">
          {t.loginNoAccount}{" "}
          <Link href="/signup" className="font-bold text-primary hover:underline">{t.loginSignUp}</Link>
        </p>
      </motion.div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-background" />}>
      <LoginForm />
    </Suspense>
  );
}
