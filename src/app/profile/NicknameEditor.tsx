"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import Button from "@/components/ui/Button";
import { useRouter } from "next/navigation";

interface NicknameEditorProps {
  currentNickname: string | null;
}

export default function NicknameEditor({ currentNickname }: NicknameEditorProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [nickname, setNickname] = useState(currentNickname ?? "");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  const supabase = createClient();

  const handleSave = async () => {
    if (!nickname.trim()) {
      setError("닉네임을 입력해주세요");
      return;
    }

    if (nickname.length < 2 || nickname.length > 12) {
      setError("닉네임은 2~12자로 입력해주세요");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("로그인이 필요합니다");

      const { error: updateError } = await supabase
        .from("profiles")
        .update({ nickname: nickname.trim() })
        .eq("id", user.id);

      if (updateError) throw updateError;

      setIsEditing(false);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "저장 실패");
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    setNickname(currentNickname ?? "");
    setError(null);
    setIsEditing(false);
  };

  if (!isEditing) {
    return (
      <div className="flex items-center gap-2">
        <h2 className="text-xl font-bold text-white">
          {currentNickname ?? "닉네임 미설정"}
        </h2>
        <button
          onClick={() => setIsEditing(true)}
          className="text-gray-400 hover:text-white text-sm"
        >
          수정
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2">
        <input
          type="text"
          value={nickname}
          onChange={(e) => setNickname(e.target.value)}
          placeholder="닉네임 입력"
          maxLength={12}
          className="px-3 py-1 bg-gray-800 border border-gray-600 rounded text-white text-sm focus:outline-none focus:border-blue-500"
        />
        <Button size="sm" onClick={handleSave} disabled={loading}>
          {loading ? "저장중..." : "저장"}
        </Button>
        <Button size="sm" variant="ghost" onClick={handleCancel} disabled={loading}>
          취소
        </Button>
      </div>
      {error && <p className="text-red-400 text-xs">{error}</p>}
      <p className="text-gray-500 text-xs">2~12자</p>
    </div>
  );
}
