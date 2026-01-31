// 홈(강화) 페이지 스켈레톤
function S({ className = "" }: { className?: string }) {
  return <div className={`bg-gray-800 rounded-lg animate-pulse ${className}`} />;
}

export default function Loading() {
  return (
    <div className="space-y-3">
      {/* 무기 카드 */}
      <div className="rounded-2xl bg-gradient-to-br from-gray-800 to-gray-900 p-5">
        <div className="flex justify-end mb-4">
          <S className="w-20 h-6 rounded-full" />
        </div>
        <div className="text-center space-y-3">
          <S className="w-16 h-16 rounded-full mx-auto" />
          <S className="w-32 h-4 mx-auto" />
          <S className="w-16 h-10 mx-auto" />
        </div>
      </div>

      {/* 강화 버튼 영역 */}
      <div className="bg-gray-900 rounded-2xl p-4 space-y-3">
        <S className="w-full h-12 rounded-xl" />
        <S className="w-full h-12 rounded-xl" />
      </div>

      {/* 실시간 피드 */}
      <div className="bg-gray-900 rounded-2xl p-3 space-y-2">
        <S className="w-16 h-3" />
        <S className="w-full h-8" />
        <S className="w-full h-8" />
        <S className="w-full h-8" />
      </div>
    </div>
  );
}
