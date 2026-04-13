"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Shield, X } from "lucide-react";

interface PDPAConsentModalProps {
  onAccept: () => void;
  onDecline?: () => void;
}

const CONTENT = {
  th: {
    title: "นโยบายความเป็นส่วนตัว",
    subtitle: "ข้อตกลงการเก็บรวบรวมข้อมูลส่วนบุคคล",
    body: `Kotoka เก็บรวบรวมข้อมูลส่วนบุคคลของท่าน ได้แก่ ชื่อ อีเมล ภาษาที่ต้องการเรียน และข้อมูลการใช้งาน เพื่อวัตถุประสงค์ในการพัฒนาประสบการณ์การเรียนรู้ภาษาของท่าน

วัตถุประสงค์การเก็บข้อมูล:
• ปรับปรุงระบบการเรียนรู้แบบเฉพาะบุคคล
• วิเคราะห์พฤติกรรมการใช้งานเพื่อพัฒนาแอปพลิเคชัน
• ติดต่อสื่อสารเกี่ยวกับบัญชีและการอัปเดต

สิทธิ์ของท่านตาม PDPA:
• สิทธิ์ในการเข้าถึงข้อมูลส่วนบุคคล
• สิทธิ์ในการแก้ไขข้อมูลที่ไม่ถูกต้อง
• สิทธิ์ในการลบข้อมูลส่วนบุคคล
• สิทธิ์ในการระงับการใช้ข้อมูล

ระยะเวลาเก็บรักษาข้อมูล: 3 ปีนับจากวันที่ยุติการใช้บริการ

ติดต่อขอใช้สิทธิ์: privacy@kotoka.app`,
    accept: "ฉันยอมรับ",
    decline: "ปฏิเสธ",
    declineMsg: "คุณต้องยอมรับนโยบายความเป็นส่วนตัวเพื่อใช้งาน Kotoka",
  },
  en: {
    title: "Privacy Policy",
    subtitle: "Personal Data Protection Act (PDPA) Consent",
    body: `Kotoka collects your personal data including name, email, language preferences, and usage data to improve your language learning experience.

Purpose of data collection:
• Personalize the learning experience
• Analyze usage to improve the application
• Communicate about your account and updates

Your rights under PDPA:
• Right to access your personal data
• Right to correct inaccurate data
• Right to delete your personal data
• Right to restrict data processing

Data retention period: 3 years after service termination

Contact for data requests: privacy@kotoka.app`,
    accept: "I Accept",
    decline: "Decline",
    declineMsg: "You must accept the Privacy Policy to use Kotoka.",
  },
};

export default function PDPAConsentModal({ onAccept }: PDPAConsentModalProps) {
  const [lang, setLang] = useState<"th" | "en">("th");
  const [declined, setDeclined] = useState(false);
  const c = CONTENT[lang];

  const handleDecline = () => {
    setDeclined(true);
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/40 backdrop-blur-sm px-4 pb-4"
    >
      <motion.div
        initial={{ y: 80, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ type: "spring", stiffness: 300, damping: 30 }}
        className="w-full max-w-sm bg-white rounded-3xl shadow-xl overflow-hidden"
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-primary/10 to-blue-50 px-5 pt-5 pb-4">
          <div className="flex items-center justify-between mb-1">
            <div className="flex items-center gap-2">
              <Shield className="w-5 h-5 text-primary" />
              <h2 className="font-heading font-extrabold text-base text-dark">{c.title}</h2>
            </div>
            {/* Language toggle */}
            <div className="flex items-center bg-white rounded-full border border-card-border text-xs font-body font-bold overflow-hidden">
              <button
                onClick={() => setLang("th")}
                className={`px-3 py-1 transition-colors ${lang === "th" ? "bg-primary text-white" : "text-gray-500"}`}
              >TH</button>
              <button
                onClick={() => setLang("en")}
                className={`px-3 py-1 transition-colors ${lang === "en" ? "bg-primary text-white" : "text-gray-500"}`}
              >EN</button>
            </div>
          </div>
          <p className="font-body text-xs text-gray-500">{c.subtitle}</p>
        </div>

        {/* Body */}
        <div className="px-5 py-4 max-h-52 overflow-y-auto">
          <pre className="font-body text-xs text-gray-600 whitespace-pre-wrap leading-relaxed">
            {c.body}
          </pre>
        </div>

        {/* Declined message */}
        <AnimatePresence>
          {declined && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="px-5 py-2 bg-red-50 flex items-center gap-2"
            >
              <X className="w-4 h-4 text-red-500 flex-shrink-0" />
              <p className="font-body text-xs text-red-600">{c.declineMsg}</p>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Actions */}
        <div className="px-5 pb-5 pt-3 flex gap-3">
          <motion.button
            whileTap={{ scale: 0.97 }}
            onClick={handleDecline}
            className="flex-1 py-3 rounded-2xl border-2 border-gray-200 font-body font-semibold text-sm text-gray-500 hover:bg-gray-50 transition-colors"
          >
            {c.decline}
          </motion.button>
          <motion.button
            whileTap={{ scale: 0.97 }}
            onClick={onAccept}
            className="flex-1 py-3 rounded-2xl bg-primary font-body font-bold text-sm text-white shadow-md hover:bg-primary/90 transition-colors"
          >
            {c.accept}
          </motion.button>
        </div>
      </motion.div>
    </motion.div>
  );
}
