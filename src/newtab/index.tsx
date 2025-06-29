import { ContentPanel, LeftPanel, ProfilePanel, RightPanel } from "~src/components"
import "../../style.css"
import SavedSpacesProvider from "~src/context/SavedSpacesContext"
import { DndContext, type DragEndEvent, DragOverlay, type DragStartEvent, pointerWithin, rectIntersection } from "@dnd-kit/core"
import { arrayMove } from "@dnd-kit/sortable"
import { useSavedSpaces } from "~src/context/SavedSpacesContext"
import { v7 as uuidv7 } from "uuid"
import type { SavedTab } from "~src/types"
import { useState } from "react"

function NewTabPageContent() {
  const { savedSpaces, activeSpace, activeProject, activeCategory, addSavedTab, updateSavedGroup } = useSavedSpaces();
  const [activeId, setActiveId] = useState<string | number | null>(null);
  const [draggedTab, setDraggedTab] = useState<chrome.tabs.Tab | null>(null);
  const [draggedSavedTab, setDraggedSavedTab] = useState<SavedTab | null>(null);

  const handleDragStart = async (event: DragStartEvent) => {
    const { active } = event;
    setActiveId(active.id);

    console.log('Drag started:', active.id);

    // Check if we're dragging a saved tab (string ID) or an opened tab (number ID)
    if (typeof active.id === 'string') {
      // Find the saved tab being dragged
      const currentSpace = savedSpaces[activeSpace];
      const currentProject = currentSpace?.projects[activeProject];
      const currentCategory = currentProject?.categories[activeCategory];

      if (currentCategory) {
        for (const group of currentCategory.groups) {
          const foundTab = group.tabs.find(tab => tab.id === active.id);
          if (foundTab) {
            setDraggedSavedTab(foundTab);
            console.log('Dragged saved tab info:', foundTab);
            break;
          }
        }
      }
    } else {
      // It's an opened tab
      try {
        const tab = await chrome.tabs.get(active.id as number);
        setDraggedTab(tab);
        console.log('Dragged opened tab info:', tab);
      } catch (error) {
        console.error('Error getting tab info on drag start:', error);
      }
    }
  };

  // Custom collision detection to prioritize droppable areas
  const collisionDetectionStrategy = (args: any) => {
    // Check if we're dragging an opened tab (number ID) - only then prioritize droppable areas
    if (typeof activeId === 'number') {
      // For opened tabs, prioritize droppable areas to avoid being blocked by saved tabs
      const droppableCollisions = rectIntersection({
        ...args,
        droppableContainers: args.droppableContainers.filter((container: any) =>
          container.id.toString().startsWith('droppable-')
        ),
      });

      if (droppableCollisions.length > 0) {
        return droppableCollisions;
      }

      // Fall back to pointer-based detection for opened tabs
      return pointerWithin(args);
    }

    // For saved tabs (string IDs), use default collision detection to allow reordering
    return pointerWithin(args);
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;

    console.log('Drag ended:', { active: active.id, over: over?.id });
    console.log('Active ID type:', typeof active.id);
    console.log('Over element:', over);

    // Reset drag state
    setActiveId(null);
    setDraggedTab(null);
    setDraggedSavedTab(null);

    if (!over) {
      console.log('No drop target detected - drag was cancelled or dropped outside valid area');
      return;
    }

    // Handle dropping on a group
    if (over.id.toString().startsWith('droppable-')) {
      const groupId = over.id.toString().replace('droppable-', '');
      console.log('Dropping on group:', groupId);

      // Check if we're dropping an opened tab (number ID)
      if (typeof active.id === 'number') {
        const tabId = active.id as number;
        console.log('Tab ID being dragged:', tabId);

        try {
          const tab = await chrome.tabs.get(tabId);
          console.log('Tab info:', tab);

          const currentSpace = savedSpaces[activeSpace];
          const currentProject = currentSpace?.projects[activeProject];
          const currentCategory = currentProject?.categories[activeCategory];

          if (currentSpace && currentProject && currentCategory) {
            // Find the target group to get the next order index
            const targetGroup = currentCategory.groups.find(g => g.id === groupId);
            const nextOrder = targetGroup ? targetGroup.tabs.length : 0;

            const savedTab: SavedTab = {
              id: uuidv7(),
              url: tab.url || '',
              title: tab.title || 'Untitled',
              favicon: tab.favIconUrl || '',
              description: tab.url || '',
              order: nextOrder
            };

            console.log('Created saved tab with order:', savedTab);

            console.log('Adding tab to:', {
              space: currentSpace.name,
              project: currentProject.name,
              category: currentCategory.name,
              groupId
            });

            addSavedTab(currentSpace.id, currentProject.id, currentCategory.id, groupId, savedTab);
            console.log('Tab successfully added to group!');
          } else {
            console.error('Could not find active space/project/category');
          }
        } catch (error) {
          console.error('Error handling tab drop:', error);
        }
      }
    }

    // Handle sorting within the same group
    if (typeof active.id === 'string' && typeof over.id === 'string') {
      const currentSpace = savedSpaces[activeSpace];
      const currentProject = currentSpace?.projects[activeProject];
      const currentCategory = currentProject?.categories[activeCategory];

      if (currentCategory) {
        // Find which group contains the active tab
        for (const group of currentCategory.groups) {
          const activeIndex = group.tabs.findIndex(tab => tab.id === active.id);
          const overIndex = group.tabs.findIndex(tab => tab.id === over.id);

          if (activeIndex !== -1 && overIndex !== -1) {
            console.log('Sorting tabs within group:', group.name);
            const newTabs = arrayMove(group.tabs, activeIndex, overIndex);

            // Update order field for all tabs after reordering
            const tabsWithUpdatedOrder = newTabs.map((tab, index) => ({
              ...tab,
              order: index
            }));

            const updatedGroup = { ...group, tabs: tabsWithUpdatedOrder };

            updateSavedGroup(currentSpace.id, currentProject.id, currentCategory.id, updatedGroup);
            console.log('Tabs reordered successfully with updated order indices!');
            break;
          }
        }
      }
    }
  };

  return (
    <DndContext
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      collisionDetection={collisionDetectionStrategy}
    >
      <div className="flex h-screen w-screen bg-black-900">
        <ProfilePanel />
        <LeftPanel />
        <div className="border-x border-black-800 flex-1 flex flex-col">
          <div className="h-16 p-4 flex items-center gap-2 border-b border-black-800">

          </div>
          <ContentPanel />
          <div className="h-16 p-4 flex items-center gap-2 border-t border-black-800">

          </div>
        </div>
        <RightPanel />
      </div>

      <DragOverlay style={{ zIndex: 1000, pointerEvents: 'none' }}>
        {activeId && (draggedTab || draggedSavedTab) ? (
          <div className="flex gap-3 items-center w-full rounded-md bg-black-800 hover:bg-black-700 px-3 py-2 text-left shadow-lg border border-blue-500">
            <div className="opacity-100 cursor-grabbing p-1 rounded">
              <svg className="w-3 h-3 text-white/50" fill="currentColor" viewBox="0 0 20 20">
                <path d="M7 2a2 2 0 1 0 0 4 2 2 0 0 0 0-4zM7 8a2 2 0 1 0 0 4 2 2 0 0 0 0-4zM7 14a2 2 0 1 0 0 4 2 2 0 0 0 0-4zM13 2a2 2 0 1 0 0 4 2 2 0 0 0 0-4zM13 8a2 2 0 1 0 0 4 2 2 0 0 0 0-4zM13 14a2 2 0 1 0 0 4 2 2 0 0 0 0-4z"></path>
              </svg>
            </div>

            <img
              src={draggedTab?.favIconUrl || draggedSavedTab?.favicon}
              alt={draggedTab?.title || draggedSavedTab?.title}
              className="w-5 h-5"
            />
            <div className="flex flex-col text-white/90 truncate">
              <div>{draggedTab?.title || draggedSavedTab?.title}</div>
              <div className="truncate">{draggedTab?.url || draggedSavedTab?.url}</div>
            </div>
          </div>
        ) : null}
      </DragOverlay>
    </DndContext>
  )
}

function NewTabPage() {
  return (
    <SavedSpacesProvider>
      <NewTabPageContent />
    </SavedSpacesProvider>
  )
}

export default NewTabPage