function S({ className = "" }: { className?: string }) {
  return <div className={`bg-gray-800 rounded-lg animate-pulse ${className}`} />;
}

export default function Loading() {
  return (
    <div className="space-y-2">
      {/* 티켓 & 내 정보 */}
      <div className="bg-gray-900 rounded-2xl p-4 space-y-3">
        <div className="flex justify-between items-center">
          <S className="w-20 h-5" />
          <S className="w-24 h-6 rounded-full" />
        </div>
        <div className="flex justify-between items-center">
          <S className="w-16 h-4" />
          <S className="w-20 h-5" />
        </div>
      </div>

      {/* 배틀 버튼 */}
      <S className="w-full h-14 rounded-2xl" />

      {/* 랭킹 */}
      <div className="bg-gray-900 rounded-2xl p-4 space-y-3">
        <S className="w-16 h-5" />
        {[...Array(5)].map((_, i) => (
          <div key={i} className="flex items-center gap-3 py-2">
            <S className="w-6 h-6 rounded-full" />
            <S className="flex-1 h-5" />
            <S className="w-12 h-5" />
          </div>
        ))}
      </div>
    </div>
  );
}
