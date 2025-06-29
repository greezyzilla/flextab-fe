import { useSavedSpaces } from '~src/context/SavedSpacesContext';
import config from '../../package.json'

export function LeftPanel() {
  const { savedSpaces, activeSpace } = useSavedSpaces();

  return (
    <div className="w-64 h-full flex flex-col">
      <div className="h-16 p-4 flex items-end gap-2 border-b border-black-800">
        <h1 className="text-white/90 font-sans text-2xl">FlexTab</h1>
        <p className="text-white/50 font-sans text-sm">v{config.version || '0.0.1'}</p>
      </div>
      <div className="flex flex-col gap-4 p-4 overflow-y-auto flex-1 text-sm">
        {/* TODO: tab management */}
        {
          savedSpaces.at(activeSpace)?.projects.map((project) => (
            <div key={project.id} className="flex flex-col gap-2">
              <p className="text-white/70 font-sans">{project.name}</p>
              <div className='flex flex-col gap-2 pl-4'>
                {
                  project.categories.map((category) => (
                    <div key={category.id} className="flex items-center gap-2">
                      <p className="text-white/60 font-sans">{category.name}</p>
                    </div>
                  ))
                }
              </div>
            </div>
          ))
        }
      </div>
      <div className="h-16 p-4 flex items-center gap-2 border-t border-black-800"></div>
    </div>
  )
}
