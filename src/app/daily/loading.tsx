function S({ className = "" }: { className?: string }) {
  return <div className={`bg-gray-800 rounded-lg animate-pulse ${className}`} />;
}

export default function Loading() {
  return (
    <div className="space-y-6">
      <S className="w-20 h-7" />

      {/* 출석 상태 */}
      <div className="bg-gray-900 rounded-2xl p-5 space-y-4">
        <div className="text-center space-y-3">
          <S className="w-16 h-16 rounded-full mx-auto" />
          <S className="w-40 h-6 mx-auto" />
          <S className="w-56 h-4 mx-auto" />
        </div>
        <S className="w-full h-12 rounded-xl" />
      </div>

      {/* 보상 목록 */}
      <div className="bg-gray-900 rounded-2xl p-4 space-y-3">
        <S className="w-24 h-5" />
        <div className="grid grid-cols-7 gap-2">
          {[...Array(7)].map((_, i) => (
            <S key={i} className="aspect-square rounded-lg" />
          ))}
        </div>
      </div>
    </div>
  );
}
