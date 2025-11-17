import { create } from 'zustand'

type ProjectSummary = { id: string; title: string }

type ProjectState = {
  current?: ProjectSummary
  projects: ProjectSummary[]
  setCurrent: (p?: ProjectSummary) => void
  setProjects: (list: ProjectSummary[]) => void
}

export const useProjectStore = create<ProjectState>((set) => ({
  projects: [],
  setCurrent: (p) => set({ current: p }),
  setProjects: (list) => set({ projects: list })
}))


