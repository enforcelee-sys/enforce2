import { createClient } from "@/lib/supabase/server";
import type { Profile } from "@/types/database";
import { getRankings, getTicketInfo } from "./actions";
import BattleClient from "./BattleClient";

export default async function BattlePage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  // 프로필, 랭킹, 티켓 정보를 병렬 조회
  const [{ data: profile }, { rankings, myRank }, ticketInfo] = await Promise.all([
    supabase
      .from("profiles")
      .select("weapon_level, weapon_type")
      .eq("id", user?.id ?? "")
      .single() as Promise<{ data: Pick<Profile, "weapon_level" | "weapon_type"> | null }>,
    getRankings(20),
    getTicketInfo(),
  ]);

  return (
    <div className="space-y-2">
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
