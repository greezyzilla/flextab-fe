import { createContext, useContext, useEffect, useState } from "react";
import type { SavedCategory, SavedGroup, SavedProject, SavedSpace, SavedTab } from "../types";
import { v7 as uuidv7 } from "uuid";

type SavedSpacesContextType = {
  savedSpaces: SavedSpace[];
  setSavedSpaces: (savedSpaces: SavedSpace[]) => void;
  addSavedSpace: (space: SavedSpace) => void;
  removeSavedSpace: (space: SavedSpace) => void;
  updateSavedSpace: (space: SavedSpace) => void;
  addSavedProject: (spaceId: string, project: SavedProject) => void;
  removeSavedProject: (spaceId: string, project: SavedProject) => void;
  updateSavedProject: (spaceId: string, project: SavedProject) => void;
  addSavedCategory: (spaceId: string, projectId: string, category: SavedCategory) => void;
  removeSavedCategory: (spaceId: string, projectId: string, category: SavedCategory) => void;
  updateSavedCategory: (spaceId: string, projectId: string, category: SavedCategory) => void;
  addSavedGroup: (spaceId: string, projectId: string, categoryId: string, group: SavedGroup) => void;
  removeSavedGroup: (spaceId: string, projectId: string, categoryId: string, group: SavedGroup) => void;
  updateSavedGroup: (spaceId: string, projectId: string, categoryId: string, group: SavedGroup) => void;
  addSavedTab: (spaceId: string, projectId: string, categoryId: string, groupId: string, tab: SavedTab) => void;
  removeSavedTab: (spaceId: string, projectId: string, categoryId: string, groupId: string, tab: SavedTab) => void;
  updateSavedTab: (spaceId: string, projectId: string, categoryId: string, groupId: string, tab: SavedTab) => void;
  activeSpace: number;
  setActiveSpace: (space: number) => void;
  activeProject: number;
  setActiveProject: (project: number) => void;
  activeCategory: number;
  setActiveCategory: (category: number) => void;
};
const SavedSpacesContext = createContext<SavedSpacesContextType>({
  savedSpaces: [],
  setSavedSpaces: () => {},
  addSavedSpace: () => {},
  removeSavedSpace: () => {},
  updateSavedSpace: () => {},
  addSavedProject: () => {},
  removeSavedProject: () => {},
  updateSavedProject: () => {},
  addSavedCategory: () => {},
  removeSavedCategory: () => {},
  updateSavedCategory: () => {},
  addSavedGroup: () => {},
  removeSavedGroup: () => {},
  updateSavedGroup: () => {},
  addSavedTab: () => {},
  removeSavedTab: () => {},
  updateSavedTab: () => {},
  activeSpace: 0,
  setActiveSpace: () => {},
  activeProject: 0,
  setActiveProject: () => {},
  activeCategory: 0,
  setActiveCategory: () => {},
});

const SavedSpacesProvider = ({ children }: { children: React.ReactNode }) => {
  const [savedSpaces, setSavedSpaces] = useState<SavedSpace[]>([
    {
      id: uuidv7(),
      name: "Personal",
      projects: [
        {
          id: uuidv7(),
          name: "Default Project",
          categories: [
            {
              id: uuidv7(),
              name: "Default Category",
              groups: [
                {
                  id: uuidv7(),
                  name: "Default Group",
                  tabs: [],
                },
                {
                  id: uuidv7(),
                  name: "Dummy Group",
                  tabs: [],
                }
              ],
            },
          ],
        },
      ],
    },
  ]);

  const [activeSpace, setActiveSpace] = useState<number>(0);
  const [activeProject, setActiveProject] = useState<number>(0);
  const [activeCategory, setActiveCategory] = useState<number>(0);

  useEffect(() => {
    const savedSpaces = localStorage.getItem("spaces");
    if (savedSpaces) {
      setSavedSpaces(JSON.parse(savedSpaces));
    } else {
      localStorage.setItem("spaces", JSON.stringify([]));
    }
  }, []);

  useEffect(() => {
    localStorage.setItem("spaces", JSON.stringify(savedSpaces));
  }, [savedSpaces]);

  const addSavedSpace = (space: SavedSpace) => {
    setSavedSpaces([...savedSpaces, space]);
  };

  const removeSavedSpace = (space: SavedSpace) => {
    setSavedSpaces(savedSpaces.filter((s) => s.id !== space.id));
  };

  const updateSavedSpace = (space: SavedSpace) => {
    setSavedSpaces(savedSpaces.map((s) => (s.id === space.id ? space : s)));
  };

  const addSavedProject = (spaceId: string, project: SavedProject) => {
    setSavedSpaces(savedSpaces.map((s) => (s.id === spaceId ? { ...s, projects: [...s.projects, project] } : s)));
  };

  const removeSavedProject = (spaceId: string, project: SavedProject) => {
    setSavedSpaces(savedSpaces.map((s) => (s.id === spaceId ? { ...s, projects: s.projects.filter((p) => p.id !== project.id) } : s)));
  };

  const updateSavedProject = (spaceId: string, project: SavedProject) => {
    setSavedSpaces(savedSpaces.map((s) => (s.id === spaceId ? { ...s, projects: s.projects.map((p) => (p.id === project.id ? project : p)) } : s)));
  };

  const addSavedCategory = (spaceId: string, projectId: string, category: SavedCategory) => {
    setSavedSpaces(savedSpaces.map((s) => (s.id === spaceId ? { ...s, projects: s.projects.map((p) => (p.id === projectId ? { ...p, categories: [...p.categories, category] } : p)) } : s)));
  };

  const removeSavedCategory = (spaceId: string, projectId: string, category: SavedCategory) => {
    setSavedSpaces(savedSpaces.map((s) => (s.id === spaceId ? { ...s, projects: s.projects.map((p) => (p.id === projectId ? { ...p, categories: p.categories.filter((c) => c.id !== category.id) } : p)) } : s)));
  };

  const updateSavedCategory = (spaceId: string, projectId: string, category: SavedCategory) => {
    setSavedSpaces(savedSpaces.map((s) => (s.id === spaceId ? { ...s, projects: s.projects.map((p) => (p.id === projectId ? { ...p, categories: p.categories.map((c) => (c.id === category.id ? category : c)) } : p)) } : s)));
  };

  const addSavedGroup = (spaceId: string, projectId: string, categoryId: string, group: SavedGroup) => {
    setSavedSpaces(savedSpaces.map((s) => (s.id === spaceId ? { ...s, projects: s.projects.map((p) => (p.id === projectId ? { ...p, categories: p.categories.map((c) => (c.id === categoryId ? { ...c, groups: [...c.groups, group] } : c)) } : p)) } : s)));
  };

  const removeSavedGroup = (spaceId: string, projectId: string, categoryId: string, group: SavedGroup) => {
    setSavedSpaces(savedSpaces.map((s) => (s.id === spaceId ? { ...s, projects: s.projects.map((p) => (p.id === projectId ? { ...p, categories: p.categories.map((c) => (c.id === categoryId ? { ...c, groups: c.groups.filter((g) => g.id !== group.id) } : c)) } : p)) } : s)));
  };

  const updateSavedGroup = (spaceId: string, projectId: string, categoryId: string, group: SavedGroup) => {
    setSavedSpaces(savedSpaces.map((s) => (s.id === spaceId ? { ...s, projects: s.projects.map((p) => (p.id === projectId ? { ...p, categories: p.categories.map((c) => (c.id === categoryId ? { ...c, groups: c.groups.map((g) => (g.id === group.id ? group : g)) } : c)) } : p)) } : s)));
  };

  const addSavedTab = (spaceId: string, projectId: string, categoryId: string, groupId: string, tab: SavedTab) => {
    setSavedSpaces(savedSpaces.map((s) =>
      s.id === spaceId ? {
        ...s,
        projects: s.projects.map((p) =>
          p.id === projectId ? {
            ...p,
            categories: p.categories.map((c) =>
              c.id === categoryId ? {
                ...c,
                groups: c.groups.map((g) =>
                  g.id === groupId ? {
                    ...g,
                    tabs: [
                      ...g.tabs.map((existingTab, index) => ({
                        ...existingTab,
                        order: existingTab.order ?? index // Ensure existing tabs have order
                      })),
                      {
                        ...tab,
                        order: tab.order ?? g.tabs.length // Ensure new tab has order
                      }
                    ]
                  } : g
                )
              } : c
            )
          } : p
        )
      } : s
    ));
  };

  const removeSavedTab = (spaceId: string, projectId: string, categoryId: string, groupId: string, tab: SavedTab) => {
    setSavedSpaces(savedSpaces.map((s) => (s.id === spaceId ? { ...s, projects: s.projects.map((p) => (p.id === projectId ? { ...p, categories: p.categories.map((c) => (c.id === categoryId ? { ...c, groups: c.groups.map((g) => (g.id === groupId ? { ...g, tabs: g.tabs.filter((t) => t.id !== tab.id) } : g)) } : c)) } : p)) } : s)));
  };

  const updateSavedTab = (spaceId: string, projectId: string, categoryId: string, groupId: string, tab: SavedTab) => {
    setSavedSpaces(savedSpaces.map((s) => (s.id === spaceId ? { ...s, projects: s.projects.map((p) => (p.id === projectId ? { ...p, categories: p.categories.map((c) => (c.id === categoryId ? { ...c, groups: c.groups.map((g) => (g.id === groupId ? { ...g, tabs: g.tabs.map((t) => (t.id === tab.id ? tab : t)) } : g)) } : c)) } : p)) } : s)));
  };

  return (
    <SavedSpacesContext.Provider value={{ savedSpaces, setSavedSpaces, addSavedSpace, removeSavedSpace, updateSavedSpace, addSavedProject, removeSavedProject, updateSavedProject, addSavedCategory, removeSavedCategory, updateSavedCategory, addSavedGroup, removeSavedGroup, updateSavedGroup, addSavedTab, removeSavedTab, updateSavedTab, activeSpace, setActiveSpace, activeProject, setActiveProject, activeCategory, setActiveCategory }}>
      {children}
    </SavedSpacesContext.Provider>
  );
};

export const useSavedSpaces = () => {
  return useContext(SavedSpacesContext);
};

export default SavedSpacesProvider;
