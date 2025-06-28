import config from '../../package.json'

export function LeftPanel() {
  return (
    <div className="w-64 h-full flex flex-col">
      <div className="h-16 p-4 flex items-end gap-2 border-b border-black-800">
        <h1 className="text-white/90 font-sans text-2xl">FlexTab</h1>
        <p className="text-white/50 font-sans text-sm">v{config.version || '0.0.1'}</p>
      </div>
      <div className="flex flex-col gap-4 p-4 overflow-y-auto flex-1">
        {/* TODO: tab management */}
      </div>
      <div className="h-16 p-4 flex items-center gap-2 border-t border-black-800"></div>
    </div>
  )
}
