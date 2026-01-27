"use client";

import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import Card, { CardHeader, CardTitle, CardContent } from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import { useState, useEffect } from "react";

export default function SettingsPage() {
  const router = useRouter();
  const supabase = createClient();
  const [user, setUser] = useState<{ email?: string } | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      setUser(data.user);
    });
  }, [supabase.auth]);

  const handleLogout = async () => {
    setLoading(true);
    try {
      await supabase.auth.signOut({ scope: "global" });
      router.push("/login");
      router.refresh();
    } catch (error) {
      console.error("Logout error:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-white">⚙️ 설정</h1>

      {/* 계정 정보 */}
      <Card>
        <CardHeader>
          <CardTitle>계정 정보</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex justify-between items-center">
            <span className="text-gray-400">이메일</span>
            <span className="text-white">{user?.email ?? "-"}</span>
          </div>
        </CardContent>
      </Card>

      {/* 게임 설정 */}
      <Card>
        <CardHeader>
          <CardTitle>게임 설정</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex justify-between items-center">
            <span className="text-gray-400">효과음</span>
            {/* TODO: 설정 로직 구현 */}
            <Button size="sm" variant="secondary">
              켜짐
            </Button>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-gray-400">알림</span>
            {/* TODO: 설정 로직 구현 */}
            <Button size="sm" variant="secondary">
              켜짐
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* 로그아웃 */}
      <Card>
        <CardContent>
          <Button
            variant="ghost"
            className="w-full"
            onClick={handleLogout}
            disabled={loading}
          >
            {loading ? "로그아웃 중..." : "로그아웃"}
          </Button>
        </CardContent>
      </Card>

      {/* 앱 정보 */}
      <div className="text-center text-sm text-gray-500 space-y-1">
        <p>강화하기 v0.1.0</p>
        <p>© 2024 Enforce Game</p>
      </div>
    </div>
  );
}
