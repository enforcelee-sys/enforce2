function S({ className = "" }: { className?: string }) {
  return <div className={`bg-gray-800 rounded-lg animate-pulse ${className}`} />;
}

export default function Loading() {
  return (
    <div className="space-y-6">
      <S className="w-20 h-7" />

      {/* 유저 정보 카드 */}
      <div className="bg-gray-900 rounded-2xl p-6">
        <div className="flex items-center gap-4">
          <S className="w-16 h-16 rounded-full shrink-0" />
          <div className="flex-1 space-y-2">
            <S className="w-24 h-6" />
            <S className="w-32 h-4" />
            <S className="w-28 h-4" />
          </div>
        </div>
      </div>

      {/* 강화 & 배틀 통계 */}
      <div className="bg-gray-900 rounded-2xl p-4 space-y-3">
        <S className="w-32 h-5" />
        <div className="grid grid-cols-3 gap-3">
          {[...Array(6)].map((_, i) => (
            <S key={i} className="h-16 rounded-lg" />
          ))}
        </div>
      </div>

      {/* 무기별 최고 기록 */}
      <div className="bg-gray-900 rounded-2xl p-4 space-y-3">
        <S className="w-28 h-5" />
        {[...Array(5)].map((_, i) => (
          <S key={i} className="w-full h-12 rounded-lg" />
        ))}
      </div>
    </div>
  );
}
