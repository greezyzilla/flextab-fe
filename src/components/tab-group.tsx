import { SortableContext, useSortable } from "@dnd-kit/sortable";
import { useDroppable } from "@dnd-kit/core";
import { CSS } from "@dnd-kit/utilities";
import type { SavedGroup, SavedTab } from "~src/types";

const SavedTab = ({ tab, isDragOverlay = false }: { tab: SavedTab, isDragOverlay?: boolean }) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: tab.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  const onClick = () => {
    chrome.tabs.create({ url: tab.url });
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`flex items-center gap-2 py-2 px-3 bg-white/5 rounded-md hover:bg-white/10 transition-colors group ${isDragOverlay ? 'pointer-events-none' : ''}`}
    >
      {/* Drag handle */}
      <div
        {...attributes}
        {...listeners}
        className={`${isDragging ? 'opacity-100' : 'opacity-40 group-hover:opacity-50 hover:!opacity-100'} cursor-grab active:cursor-grabbing p-1 rounded transition-opacity`}
        title="Drag to reorder"
      >
        <svg className="w-3 h-3 text-white/50" fill="currentColor" viewBox="0 0 20 20">
          <path d="M7 2a2 2 0 1 0 0 4 2 2 0 0 0 0-4zM7 8a2 2 0 1 0 0 4 2 2 0 0 0 0-4zM7 14a2 2 0 1 0 0 4 2 2 0 0 0 0-4zM13 2a2 2 0 1 0 0 4 2 2 0 0 0 0-4zM13 8a2 2 0 1 0 0 4 2 2 0 0 0 0-4zM13 14a2 2 0 1 0 0 4 2 2 0 0 0 0-4z"></path>
        </svg>
      </div>

      {/* Clickable content */}
      <div
        className="flex items-center gap-3 flex-1 cursor-pointer overflow-hidden"
        onClick={onClick}
      >
        <img src={tab.favicon} alt={tab.title} className="w-5 h-5" />
        <div className="flex flex-col gap-0.5 text-white/90 overflow-hidden">
          <div className="text-xs truncate">{tab.title}</div>
          <div className="text-white/50 text-xs truncate flex-1">{tab.url}</div>
        </div>
      </div>
    </div>
  )
}

export interface TabGroupProps {
  group: SavedGroup;
}

export function TabGroup({ group }: TabGroupProps) {
  const { setNodeRef: setDroppableRef, isOver } = useDroppable({
    id: `droppable-${group.id}`,
  });

  // Sort tabs by order field to maintain consistent ordering
  const sortedTabs = [...(group.tabs || [])].sort((a, b) => {
    const orderA = a.order ?? 0;
    const orderB = b.order ?? 0;
    return orderA - orderB;
  });

  return (
    <div className="flex flex-col gap-2 p-4">
      <h3 className="text-white/60 font-sans text-sm">{group.name}</h3>
      {sortedTabs.length > 0 ? (
        <SortableContext items={sortedTabs.map((tab) => tab.id)}>
          <div
            className={`grid grid-cols-4 gap-2 border border-black-800 rounded-md p-2 transition-colors relative ${isOver ? 'border-blue-500 bg-blue-500/10' : ''}`}
            ref={setDroppableRef}
          >
            {/* Invisible overlay to catch drops when dragging over saved tabs */}
            {isOver && (
              <div className="absolute inset-0 z-10 pointer-events-none bg-blue-500/5 rounded-md" />
            )}
            {
              sortedTabs.map((tab) => (
                <SavedTab key={tab.id} tab={tab} />
              ))
            }
          </div>
        </SortableContext>
      ) : (
        <div
          className={`text-white/50 font-sans text-sm p-12 text-center border border-black-800 rounded-md border-dashed transition-colors ${isOver ? 'border-blue-500 bg-blue-500/10 text-blue-400' : ''}`}
          ref={setDroppableRef}
        >
          {isOver ? 'Drop tab here' : 'No saved tabs yet'}
        </div>
      )}
    </div>
  )
}