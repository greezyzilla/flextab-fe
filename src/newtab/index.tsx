import { ContentPanel, LeftPanel, ProfilePanel, RightPanel } from "~src/components"
import "../../style.css"
import SavedSpacesProvider from "~src/context/SavedSpacesContext"
import { DndContext, type DragEndEvent, DragOverlay, type DragStartEvent, pointerWithin, rectIntersection } from "@dnd-kit/core"
import { arrayMove } from "@dnd-kit/sortable"
import { useSavedSpaces } from "~src/context/SavedSpacesContext"
import { v7 as uuidv7 } from "uuid"
import type { SavedTab, SavedGroup } from "~src/types"
import { useState } from "react"

function NewTabPageContent() {
  const { savedSpaces, setSavedSpaces, activeSpace, activeProject, activeCategory, addSavedTab, updateSavedGroup } = useSavedSpaces();
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
    // But also include droppable containers for cross-group moves
    const allCollisions = pointerWithin(args);
    const droppableCollisions = rectIntersection({
      ...args,
      droppableContainers: args.droppableContainers.filter((container: any) =>
        container.id.toString().startsWith('droppable-')
      ),
    });

    // Combine both types of collisions, prioritizing saved tabs for precise positioning
    return [...allCollisions, ...droppableCollisions];
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;

    console.log('=== DRAG END DEBUG ===');
    console.log('Active ID:', active.id, 'Type:', typeof active.id);
    console.log('Over ID:', over?.id, 'Type:', typeof over?.id);
    console.log('Over element full:', over);

    // Reset drag state
    setActiveId(null);
    setDraggedTab(null);
    setDraggedSavedTab(null);

    if (!over) {
      console.log('No drop target detected - drag was cancelled or dropped outside valid area');
      return;
    }

    const currentSpace = savedSpaces[activeSpace];
    const currentProject = currentSpace?.projects[activeProject];
    const currentCategory = currentProject?.categories[activeCategory];

    if (!currentCategory) {
      console.error('Could not find active space/project/category');
      return;
    }

    // Handle dropping opened tabs (from right panel)
    if (typeof active.id === 'number' && over.id.toString().startsWith('droppable-')) {
      const groupId = over.id.toString().replace('droppable-', '');
      console.log('Dropping opened tab on group:', groupId);

      try {
        const tab = await chrome.tabs.get(active.id as number);
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

        addSavedTab(currentSpace.id, currentProject.id, currentCategory.id, groupId, savedTab);
        console.log('Opened tab successfully added to group!');
      } catch (error) {
        console.error('Error handling opened tab drop:', error);
      }
      return;
    }

    // Handle saved tab operations
    if (typeof active.id === 'string') {
      // Find the source group and dragged tab
      let sourceGroup: SavedGroup | null = null;
      let draggedTab: SavedTab | null = null;

      for (const group of currentCategory.groups) {
        const foundTab = group.tabs.find(tab => tab.id === active.id);
        if (foundTab) {
          sourceGroup = group;
          draggedTab = foundTab;
          break;
        }
      }

      if (!sourceGroup || !draggedTab) {
        console.error('Could not find source group or dragged tab');
        return;
      }

      console.log('Found dragged tab:', draggedTab.title, 'in group:', sourceGroup.name);

      // Case 1: Dropping on another saved tab (reorder within same group or move between groups)
      if (typeof over.id === 'string' && !over.id.toString().startsWith('droppable-')) {
        console.log('Dropping over another saved tab:', over.id);

        // Find which group contains the target tab
        let targetGroup: SavedGroup | null = null;
        let targetTab: SavedTab | null = null;

        for (const group of currentCategory.groups) {
          const foundTab = group.tabs.find(tab => tab.id === over.id);
          if (foundTab) {
            targetGroup = group;
            targetTab = foundTab;
            break;
          }
        }

        if (!targetGroup || !targetTab) {
          console.error('Could not find target group or tab');
          return;
        }

        console.log('Target group:', targetGroup.name, 'Target tab:', targetTab.title);

        // Same group reordering
        if (sourceGroup.id === targetGroup.id) {
          console.log('Reordering within same group');
          const activeIndex = sourceGroup.tabs.findIndex(tab => tab.id === active.id);
          const overIndex = sourceGroup.tabs.findIndex(tab => tab.id === over.id);

          if (activeIndex !== -1 && overIndex !== -1) {
            const newTabs = arrayMove(sourceGroup.tabs, activeIndex, overIndex);
            const tabsWithUpdatedOrder = newTabs.map((tab, index) => ({
              ...tab,
              order: index
            }));

            const updatedGroup = { ...sourceGroup, tabs: tabsWithUpdatedOrder };
            updateSavedGroup(currentSpace.id, currentProject.id, currentCategory.id, updatedGroup);
            console.log('Same group reordering completed');
          }
        } else {
          // Cross-group move
          console.log('Moving between different groups');

          // Sort target group tabs to get correct insertion position
          const sortedTargetTabs = [...targetGroup.tabs].sort((a, b) => {
            const orderA = a.order ?? 0;
            const orderB = b.order ?? 0;
            return orderA - orderB;
          });

          // Find insertion position (before the target tab)
          const insertPosition = sortedTargetTabs.findIndex(tab => tab.id === over.id);
          console.log('Insert position:', insertPosition);

          // Remove from source group
          const updatedSourceTabs = sourceGroup.tabs
            .filter(tab => tab.id !== draggedTab.id)
            .map((tab, index) => ({ ...tab, order: index }));

          // Insert into target group at correct position
          const tabToMove = { ...draggedTab };
          sortedTargetTabs.splice(insertPosition, 0, tabToMove);

          // Update order indices
          const updatedTargetTabs = sortedTargetTabs.map((tab, index) => ({
            ...tab,
            order: index
          }));

          // Update both groups
          const updatedSourceGroup = { ...sourceGroup, tabs: updatedSourceTabs };
          const updatedTargetGroup = { ...targetGroup, tabs: updatedTargetTabs };

          setSavedSpaces(savedSpaces.map(s =>
            s.id === currentSpace.id ? {
              ...s,
              projects: s.projects.map(p =>
                p.id === currentProject.id ? {
                  ...p,
                  categories: p.categories.map(c =>
                    c.id === currentCategory.id ? {
                      ...c,
                      groups: c.groups.map(g => {
                        if (g.id === sourceGroup.id) return updatedSourceGroup;
                        if (g.id === targetGroup.id) return updatedTargetGroup;
                        return g;
                      })
                    } : c
                  )
                } : p
              )
            } : s
          ));

          console.log('Cross-group move completed at position:', insertPosition);
        }
      }
      // Case 2: Dropping on group area (droppable zone)
      else if (over.id.toString().startsWith('droppable-')) {
        const groupId = over.id.toString().replace('droppable-', '');
        const targetGroup = currentCategory.groups.find(g => g.id === groupId);

        if (!targetGroup) {
          console.error('Could not find target group');
          return;
        }

        console.log('Dropping on group area:', targetGroup.name);

        // Only handle cross-group moves here (same group is handled above)
        if (sourceGroup.id !== targetGroup.id) {
          console.log('Moving to different group (append to end)');

          // Remove from source group
          const updatedSourceTabs = sourceGroup.tabs
            .filter(tab => tab.id !== draggedTab.id)
            .map((tab, index) => ({ ...tab, order: index }));

          // Add to end of target group
          const tabToMove = { ...draggedTab, order: targetGroup.tabs.length };
          const updatedTargetTabs = [
            ...targetGroup.tabs.map((tab, index) => ({ ...tab, order: tab.order ?? index })),
            tabToMove
          ];

          // Update both groups
          const updatedSourceGroup = { ...sourceGroup, tabs: updatedSourceTabs };
          const updatedTargetGroup = { ...targetGroup, tabs: updatedTargetTabs };

          setSavedSpaces(savedSpaces.map(s =>
            s.id === currentSpace.id ? {
              ...s,
              projects: s.projects.map(p =>
                p.id === currentProject.id ? {
                  ...p,
                  categories: p.categories.map(c =>
                    c.id === currentCategory.id ? {
                      ...c,
                      groups: c.groups.map(g => {
                        if (g.id === sourceGroup.id) return updatedSourceGroup;
                        if (g.id === targetGroup.id) return updatedTargetGroup;
                        return g;
                      })
                    } : c
                  )
                } : p
              )
            } : s
          ));

          console.log('Cross-group move to end completed');
        }
      }
    }

    console.log('=== DRAG END COMPLETE ===');
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