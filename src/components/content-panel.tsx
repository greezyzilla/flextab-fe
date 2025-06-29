import { useSavedSpaces } from "~src/context/SavedSpacesContext";
import { TabGroup } from "./tab-group";

export function ContentPanel() {
  const { savedSpaces, activeSpace, activeProject, activeCategory } = useSavedSpaces();
  console.log(savedSpaces.at(activeSpace)?.projects.at(activeProject)?.categories.at(activeCategory))
  return (
    <div className="flex-1 flex flex-col">
      <div className="flex justify-between gap-2 p-4 border-b border-black-800">
        <h2 className="text-white/70 font-sans text-base font-medium">{savedSpaces.at(activeSpace)?.projects.at(activeProject)?.categories.at(activeCategory)?.name}</h2>
        <div className="flex gap-2">
          <button className="text-white/70 font-sans text-sm">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
            </svg>
          </button>
        </div>
      </div>
      {savedSpaces.at(activeSpace)?.projects.at(activeProject)?.categories.at(activeCategory)?.groups.length > 0 ? (
        <div className="flex flex-col gap-2">
          {
            savedSpaces.at(activeSpace)?.projects.at(activeProject)?.categories.at(activeCategory)?.groups.map((group) => (
              <TabGroup key={group.id} group={group} />
            ))
          }
        </div>
      ) : (
        <div className="text-white/50 font-sans text-sm p-12 text-center flex items-center justify-center">No saved groups yet</div>
      )}
    </div>
  )
}
