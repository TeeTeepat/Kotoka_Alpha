"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import { Home, BookOpen, Camera, GraduationCap, Users } from "lucide-react";
import { cn } from "@/lib/utils";
import { useSoundPlayer } from "@/components/hooks/useSoundPlayer";
import { useLocale } from "@/lib/i18n";

export default function BottomNav() {
  const pathname = usePathname();
  const { play } = useSoundPlayer();
  const { t } = useLocale();

  const sideTabs = [
    { href: "/", icon: Home, label: t.navHome },
    { href: "/journal", icon: BookOpen, label: t.navJournal },
  ];
  const rightTabs = [
    { href: "/study", icon: GraduationCap, label: t.navStudy },
    { href: "/parent", icon: Users, label: t.navParent },
  ];

  const isActive = (href: string) =>
    href === "/" ? pathname === "/" : pathname.startsWith(href);

  const NavItem = ({ href, icon: Icon, label }: { href: string; icon: typeof Home; label: string }) => {
    const active = isActive(href);
    return (
      <Link href={href} className="relative flex-1" onClick={() => play("click")}>
        <motion.div
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          className={cn(
            "flex flex-col items-center gap-0.5 px-2 py-1.5 rounded-2xl transition-colors duration-200 mx-auto w-fit",
            active ? "text-primary" : "text-gray-400 hover:text-gray-600"
          )}
        >
          <Icon className="w-5 h-5" strokeWidth={active ? 2.5 : 2} />
          <span className="text-[10px] font-body font-medium whitespace-nowrap">{label}</span>
          {active && (
            <motion.div
              layoutId="nav-indicator"
              className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-6 h-1 rounded-full bg-primary"
              transition={{ type: "spring", stiffness: 400, damping: 30 }}
            />
          )}
        </motion.div>
      </Link>
    );
  };

  return (
    <motion.nav
      initial={{ y: 80, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ type: "spring", stiffness: 300, damping: 30, delay: 0.1 }}
      className="fixed bottom-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-xl border-t border-card-border"
    >
      <div className="max-w-[480px] mx-auto flex items-end justify-between px-2 pt-2 pb-2">
        {sideTabs.map((tab) => (
          <NavItem key={tab.href} {...tab} />
        ))}

        {/* Snap — big prominent center camera button */}
        <div className="flex-1 flex flex-col items-center">
          <Link href="/daily" onClick={() => play("click")} className="-translate-y-4">
            <motion.div
              whileHover={{ scale: 1.06 }}
              whileTap={{ scale: 0.92 }}
              className="w-16 h-16 rounded-full bg-gradient-to-br from-primary to-[#0fb8c9] shadow-lg shadow-primary/40 border-4 border-white flex items-center justify-center"
            >
              <Camera className="w-7 h-7 text-white" strokeWidth={2.5} />
            </motion.div>
          </Link>
          <span className="text-[10px] font-body font-medium text-primary -mt-2">{t.navSnap}</span>
        </div>

        {rightTabs.map((tab) => (
          <NavItem key={tab.href} {...tab} />
        ))}
      </div>
    </motion.nav>
  );
}
