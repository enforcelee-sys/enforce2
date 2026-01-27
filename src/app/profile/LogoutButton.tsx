"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import Button from "@/components/ui/Button";

export default function LogoutButton() {
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const supabase = createClient();

  const handleLogout = async () => {
    setLoading(true);

    try {
      await supabase.auth.signOut();
      router.push("/login");
      router.refresh();
    } catch (error) {
      console.error("Logout error:", error);
      alert("로그아웃 실패");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Button
      variant="ghost"
      className="text-red-400 hover:text-red-300 hover:bg-red-900/20"
      onClick={handleLogout}
      disabled={loading}
    >
      {loading ? "로그아웃 중..." : "로그아웃"}
    </Button>
  );
}
