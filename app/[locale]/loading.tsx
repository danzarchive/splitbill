export default function HomeLoading() {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-md mx-auto bg-white min-h-screen shadow-sm flex flex-col">
        <header className="flex items-center justify-between px-5 py-4">
          <div className="h-8 bg-gray-100 rounded animate-pulse w-40" />
          <div className="w-9 h-9 rounded-lg bg-gray-100 animate-pulse" />
        </header>
        <main className="px-5 pb-8 flex-1">
          <div className="py-8 space-y-2">
            <div className="h-6 bg-gray-100 rounded animate-pulse w-48" />
            <div className="h-4 bg-gray-100 rounded animate-pulse w-64" />
          </div>
          <div className="h-14 border-2 border-dashed border-gray-200 rounded-xl animate-pulse" />
        </main>
      </div>
    </div>
  )
}
