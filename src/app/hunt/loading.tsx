function S({ className = "" }: { className?: string }) {
  return <div className={`bg-gray-800 rounded-lg animate-pulse ${className}`} />;
}

export default function Loading() {
  return (
    <div className="space-y-6">
      <S className="w-24 h-7" />

      {/* 보유 자원 */}
      <div className="bg-gray-900 rounded-2xl p-4">
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <S className="w-16 h-3" />
            <S className="w-24 h-7" />
          </div>
          <div className="space-y-2">
            <S className="w-12 h-3" />
            <S className="w-16 h-7" />
          </div>
        </div>
      </div>

      {/* 현재 사냥터 */}
      <div className="bg-gray-900 rounded-2xl p-4 space-y-4">
        <div className="flex justify-between">
          <S className="w-20 h-5" />
          <S className="w-12 h-5" />
        </div>
        <div className="text-center py-4 space-y-3">
          <S className="w-12 h-12 rounded-full mx-auto" />
          <S className="w-36 h-6 mx-auto" />
          <S className="w-48 h-4 mx-auto" />
        </div>
        <S className="w-full h-12 rounded-xl" />
      </div>

      {/* 보상 및 확률 */}
      <div className="bg-gray-900 rounded-2xl p-4 space-y-3">
        <S className="w-24 h-5" />
        <S className="w-full h-14 rounded-lg" />
        <S className="w-full h-14 rounded-lg" />
        <S className="w-full h-14 rounded-lg" />
      </div>
    </div>
  );
}
