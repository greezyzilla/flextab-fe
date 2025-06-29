// Groupings: Space -> Project -> Category -> Group (tabs)

export interface SavedTab {
  id: string;
  url: string;
  title: string;
  favicon: string;
  description?: string;
  order?: number;
}

export interface SavedGroup {
  id: string;
  name: string;
  tabs: SavedTab[];
  order?: number;
}

export interface SavedCategory {
  id: string;
  name: string;
  groups: SavedGroup[];
  order?: number;
}

export interface SavedProject {
  id: string;
  name: string;
  categories: SavedCategory[];
  order?: number;
}

export interface SavedSpace {
  id: string;
  name: string;
  projects: SavedProject[];
  order?: number;
}
