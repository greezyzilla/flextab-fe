import { useDraggable } from "@dnd-kit/core"
import { useWindows } from "~src/hooks/use-windows"

const OpenedTab = ({ tab, windowId }: { tab: chrome.tabs.Tab, windowId: number }) => {
  const onTabClick = (tab: chrome.tabs.Tab, windowId: number) => {
    chrome.tabs.update(tab.id, { active: true })
    chrome.windows.update(windowId, { focused: true })
  }

  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: tab.id,
  })

  return (
    <div
      className="flex gap-3 items-center w-full rounded-md bg-black-800 hover:bg-black-700 px-3 py-2 text-left group"
      ref={setNodeRef}
      style={{
        transform: transform ? `translate(${transform.x}px, ${transform.y}px)` : undefined,
        opacity: isDragging ? 0.5 : 1,
      }}
    >
      {/* Drag handle */}
      <div
        {...attributes}
        {...listeners}
        className={`${isDragging ? 'opacity-100' : 'opacity-40 group-hover:opacity-50 hover:!opacity-100'} cursor-grab active:cursor-grabbing p-1 rounded transition-opacity`}
        title="Drag to save"
      >
        <svg className="w-3 h-3 text-white/50" fill="currentColor" viewBox="0 0 20 20">
          <path d="M7 2a2 2 0 1 0 0 4 2 2 0 0 0 0-4zM7 8a2 2 0 1 0 0 4 2 2 0 0 0 0-4zM7 14a2 2 0 1 0 0 4 2 2 0 0 0 0-4zM13 2a2 2 0 1 0 0 4 2 2 0 0 0 0-4zM13 8a2 2 0 1 0 0 4 2 2 0 0 0 0-4zM13 14a2 2 0 1 0 0 4 2 2 0 0 0 0-4z"></path>
        </svg>
      </div>

      {/* Clickable content */}
      <div
        className="flex gap-3 items-center flex-1 cursor-pointer overflow-hidden"
        onClick={() => onTabClick(tab, windowId)}
      >
        <img src={tab.favIconUrl} alt={tab.title} className="w-5 h-5" />
        <div className="flex flex-col text-white/90 truncate">
          <div>{tab.title}</div>
          <div className="truncate">{tab.url}</div>
        </div>
      </div>
    </div>
  )
}

export function RightPanel() {
  const { windows } = useWindows({
    populate: true,
  })

  return (
    <div className="min-w-80 w-80 h-full flex flex-col">
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
                    <OpenedTab key={tab.id} tab={tab} windowId={window.id} />
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
