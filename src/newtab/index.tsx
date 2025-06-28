import { LeftPanel, RightPanel } from "~src/components"
import "../../style.css"

function NewTabPage() {
  return (
    <>
      <div className="flex h-screen w-screen bg-black-900">
        <LeftPanel />
        <div className="border-x border-black-800 flex-1 flex flex-col">
          <div className="h-16 p-4 flex items-center gap-2 border-b border-black-800">

          </div>
          <div className="flex-1 flex flex-col">
            {/* TODO: tab management */}
          </div>
          <div className="h-16 p-4 flex items-center gap-2 border-t border-black-800">

          </div>
        </div>
        <RightPanel />
      </div>
    </>
  )
}

export default NewTabPage