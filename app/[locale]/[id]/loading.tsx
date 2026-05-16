export default function BillLoading() {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-md mx-auto bg-white min-h-screen shadow-sm flex flex-col">
        <header className="flex items-center gap-3 px-5 py-4 border-b border-gray-100">
          <div className="w-9 h-9 rounded-full bg-gray-100 animate-pulse" />
          <div className="flex-1 space-y-2">
            <div className="h-5 bg-gray-100 rounded animate-pulse w-3/4" />
            <div className="h-3 bg-gray-100 rounded animate-pulse w-1/2" />
          </div>
        </header>
        <main className="px-5 py-4 space-y-4 flex-1">
          <div className="p-4 bg-gray-50 rounded-xl space-y-2">
            <div className="flex justify-between">
              <div className="h-4 bg-gray-200 rounded animate-pulse w-16" />
              <div className="h-6 bg-gray-200 rounded animate-pulse w-28" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div className="h-12 bg-gray-100 rounded-lg animate-pulse" />
            <div className="h-12 bg-gray-100 rounded-lg animate-pulse" />
          </div>
          <div className="h-14 bg-gray-100 rounded-xl animate-pulse" />
          <div className="space-y-2">
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex items-center gap-3 p-3 bg-white rounded-xl">
                <div className="w-10 h-10 rounded-full bg-gray-100 animate-pulse" />
                <div className="flex-1 h-4 bg-gray-100 rounded animate-pulse" />
              </div>
            ))}
          </div>
        </main>
      </div>
    </div>
  )
}
