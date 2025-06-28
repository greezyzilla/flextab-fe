import { useWindows } from "~src/hooks/use-windows"

export function RightPanel() {
  const { windows } = useWindows({
    populate: true,
  })

  const onTabClick = (tab: chrome.tabs.Tab, windowId: number) => {
    chrome.tabs.update(tab.id, { active: true })
    chrome.windows.update(windowId, { focused: true })
  }

  return (
    <div className="w-80 h-full overflow-y-hidden flex flex-col">
      <div className="min-h-16 h-16 p-4 flex items-center gap-2 border-b border-black-800">

      </div>
      <div className="flex flex-col gap-4 p-4 overflow-y-auto">
        {
          windows.map((window, windowIndex) => (
            <div key={window.id} className="flex flex-col gap-2">
              <div className="flex items-center gap-2 text-sm text-white/70">Window {windowIndex + 1}</div>
              <div className="flex flex-col gap-2">
                {
                  window.tabs?.map((tab) => (
                    <button key={tab.id} className="flex gap-3 items-center w-full rounded-md bg-black-800 hover:bg-black-700 px-3 py-2 text-left" onClick={() => onTabClick(tab, window.id)}>
                      <img src={tab.favIconUrl} alt={tab.title} className="w-5 h-5" />
                      <div className="flex flex-col text-white/90 truncate">
                        <div>{tab.title}</div>
                        <div className="truncate">{tab.url}</div>
                      </div>
                    </button>
                  ))
                }
              </div>
            </div>
          ))
        }
      </div>
      <div className="min-h-16 h-16 p-4 flex items-center gap-2 border-t border-black-800">

      </div>
    </div>
  )
}
