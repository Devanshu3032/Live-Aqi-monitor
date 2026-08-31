export default function Header() {
  return (
    <header className="bg-transparent">
      <div className="container mx-auto max-w-6xl px-4 pb-3 pt-8">
        <div className="flex items-center gap-3 text-slate-100">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-cyan-400 to-blue-500">
            <span className="text-lg font-bold text-slate-900">AQ</span>
          </div>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">AeroSense - An AQI Determinator</h1>
            <p className="text-sm text-slate-300">Your city air, weather, and forecast in one panel.</p>
            <p className="mt-1 text-xs italic text-slate-400">
              Made and designed by <span className="font-semibold text-cyan-300">DEVANSHU K</span>
            </p>
          </div>
        </div>
      </div>
    </header>
  )
}
