import { createClient } from "@/lib/supabase/server";
import Card, { CardHeader, CardTitle, CardContent } from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import type { Title, UserTitle } from "@/types/database";

export default async function TitlesPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  // 전체 칭호 목록
  const { data: allTitles } = await supabase
    .from("titles")
    .select("*")
    .order("condition_value", { ascending: true }) as { data: Title[] | null };

  // 유저가 보유한 칭호
  const { data: userTitles } = await supabase
    .from("user_titles")
    .select("*, title:titles(*)")
    .eq("user_id", user?.id ?? "") as { data: UserTitle[] | null };

  const ownedTitleIds = new Set(userTitles?.map((ut) => ut.title_id) ?? []);
  const equippedTitle = userTitles?.find((ut) => ut.is_equipped);

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-white">🏆 칭호</h1>

      {/* 현재 장착 칭호 */}
      <Card variant="highlight">
        <CardHeader>
          <CardTitle>장착 중인 칭호</CardTitle>
        </CardHeader>
        <CardContent className="text-center py-4">
          {equippedTitle?.title ? (
            <div>
              <p className="text-2xl font-bold text-yellow-400">
                {equippedTitle.title.name}
              </p>
              <p className="text-sm text-gray-400 mt-1">
                {equippedTitle.title.description}
              </p>
            </div>
          ) : (
            <p className="text-gray-500">장착된 칭호가 없습니다</p>
          )}
        </CardContent>
      </Card>

      {/* 보유 칭호 */}
      <Card>
        <CardHeader>
          <CardTitle>보유 칭호</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {userTitles && userTitles.length > 0 ? (
              userTitles.map((ut) => (
                <div
                  key={ut.id}
                  className={`flex items-center justify-between p-3 rounded-lg ${
                    ut.is_equipped ? "bg-yellow-900/30 border border-yellow-500" : "bg-gray-800"
                  }`}
                >
                  <div>
                    <p className="font-medium text-white">{ut.title?.name}</p>
                    <p className="text-sm text-gray-400">{ut.title?.description}</p>
                  </div>
                  {/* TODO: 칭호 장착 로직 구현 */}
                  <Button
                    size="sm"
                    variant={ut.is_equipped ? "ghost" : "secondary"}
                  >
                    {ut.is_equipped ? "장착 중" : "장착"}
                  </Button>
                </div>
              ))
            ) : (
              <p className="text-gray-500 text-center py-4">보유한 칭호가 없습니다</p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* 전체 칭호 목록 */}
      <Card>
        <CardHeader>
          <CardTitle>칭호 도감</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {allTitles?.map((title) => {
              const isOwned = ownedTitleIds.has(title.id);
              return (
                <div
                  key={title.id}
                  className={`p-3 rounded-lg ${
                    isOwned ? "bg-gray-800" : "bg-gray-900 opacity-60"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className={`font-medium ${isOwned ? "text-white" : "text-gray-500"}`}>
                        {isOwned ? title.name : "???"}
                      </p>
                      <p className="text-sm text-gray-400">
                        {title.description}
                      </p>
                    </div>
                    {isOwned ? (
                      <span className="text-green-400 text-sm">획득</span>
                    ) : (
                      <span className="text-gray-600 text-sm">미획득</span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      <p className="text-xs text-gray-500 text-center">
        * TODO: 칭호 장착/해제 로직을 Server Action으로 구현하세요
      </p>
    </div>
  );
}
