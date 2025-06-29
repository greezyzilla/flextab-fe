import { useSavedSpaces } from "~src/context/SavedSpacesContext";

export function ProfilePanel() {
  const { savedSpaces } = useSavedSpaces();

  return (
    <div className="w-16 h-full flex flex-col border-r border-black-800">
      <div className="flex flex-col gap-3 py-4 items-center flex-1">
        {savedSpaces.map((space) => (
          <div key={space.id} className="w-10 h-10 bg-black-800 rounded-full"></div>
        ))}
        <div className="w-10 h-10 rounded-full border border-white/30 border-dashed text-white/50 flex items-center justify-center cursor-pointer">
          {/* plus icon */}
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
          </svg>
        </div>
      </div>
      <div className="flex flex-col gap-2 py-4 items-center">
        <div className="w-10 h-10 bg-black-800 rounded-full"></div>
      </div>
    </div>
  )
}
