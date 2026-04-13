export default function ReviewLoading() {
  return (
    <div className="py-4 space-y-5">
      <div className="space-y-2">
        <div className="h-6 w-32 bg-gray-100 rounded-lg animate-pulse" />
        <div className="h-4 w-48 bg-gray-50 rounded-lg animate-pulse" />
      </div>
      <div className="space-y-4 py-8">
        {[1, 2, 3, 4, 5].map(i => (
          <div key={i} className="flex justify-center">
            <div
              className="w-14 h-14 rounded-full bg-gray-100 animate-pulse"
              style={{ marginLeft: `${(i % 3 - 1) * 40}px` }}
            />
          </div>
        ))}
      </div>
    </div>
  );
}
