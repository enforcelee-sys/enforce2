import { createClient } from "@/lib/supabase/server";
import type { Profile } from "@/types/database";
import { getRankings, getTicketInfo } from "./actions";
import BattleClient from "./BattleClient";

export default async function BattlePage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  // 프로필 정보
  const { data: profile } = await supabase
    .from("profiles")
    .select("weapon_level, weapon_type")
    .eq("id", user?.id ?? "")
    .single() as { data: Pick<Profile, "weapon_level" | "weapon_type"> | null };

  // 랭킹 조회
  const { rankings, myRank } = await getRankings(20);

  // 티켓 정보 조회
  const ticketInfo = await getTicketInfo();

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-white">배틀 / 랭킹</h1>

      <BattleClient
        initialTickets={ticketInfo.tickets}
        nextRegenAt={ticketInfo.nextRegenAt}
        maxTickets={ticketInfo.maxTickets}
        myWeaponLevel={profile?.weapon_level ?? 0}
        myWeaponType={profile?.weapon_type ?? "칼"}
        myRank={myRank}
        rankings={rankings}
      />
    </div>
  );
}
