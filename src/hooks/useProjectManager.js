import { useState, useEffect, useCallback } from 'react'

const PROJECTS_KEY = 'schemati_projects'
const CURRENT_PROJECT_KEY = 'schemati_current_project'
const AUTOSAVE_KEY = 'schemati_autosave'

export function useProjectManager() {
  const [projects, setProjects] = useState([])
  const [currentProjectId, setCurrentProjectId] = useState(null)
  const [autosaveEnabled, setAutosaveEnabled] = useState(true)

  useEffect(() => {
    const savedProjects = localStorage.getItem(PROJECTS_KEY)
    if (savedProjects) {
      try {
        const parsed = JSON.parse(savedProjects)
        setProjects(parsed)
      } catch (error) {
        console.error('Failed to load projects from localStorage:', error)
      }
    }

    const savedCurrentProject = localStorage.getItem(CURRENT_PROJECT_KEY)
    if (savedCurrentProject) {
      setCurrentProjectId(savedCurrentProject)
    }

    const savedAutosave = localStorage.getItem(AUTOSAVE_KEY)
    if (savedAutosave !== null) {
      setAutosaveEnabled(JSON.parse(savedAutosave))
    }
  }, [])

  const saveProject = useCallback((projectData, projectName = null) => {
    const projectId = currentProjectId || `project-${Date.now()}`
    const project = {
      id: projectId,
      name: projectName || `Project ${new Date().toLocaleDateString()}`,
      data: projectData,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }

    setProjects(prevProjects => {
      const existingIndex = prevProjects.findIndex(p => p.id === projectId)
      let newProjects

      if (existingIndex >= 0) {
        newProjects = [...prevProjects]
        newProjects[existingIndex] = project
      } else {
        newProjects = [...prevProjects, project]
      }

      localStorage.setItem(PROJECTS_KEY, JSON.stringify(newProjects))
      return newProjects
    })

    if (!currentProjectId) {
      setCurrentProjectId(projectId)
      localStorage.setItem(CURRENT_PROJECT_KEY, projectId)
    }

    return projectId
  }, [currentProjectId])

  const loadProject = useCallback((projectId) => {
    const project = projects.find(p => p.id === projectId)
    if (project) {
      setCurrentProjectId(projectId)
      localStorage.setItem(CURRENT_PROJECT_KEY, projectId)
      return project.data
    }
    return null
  }, [projects])

  const deleteProject = useCallback((projectId) => {
    setProjects(prevProjects => {
      const newProjects = prevProjects.filter(p => p.id !== projectId)
      localStorage.setItem(PROJECTS_KEY, JSON.stringify(newProjects))
      return newProjects
    })

    if (currentProjectId === projectId) {
      setCurrentProjectId(null)
      localStorage.removeItem(CURRENT_PROJECT_KEY)
    }
  }, [currentProjectId])

  const renameProject = useCallback((projectId, newName) => {
    setProjects(prevProjects => {
      const newProjects = prevProjects.map(p =>
        p.id === projectId
          ? { ...p, name: newName, updatedAt: new Date().toISOString() }
          : p
      )
      localStorage.setItem(PROJECTS_KEY, JSON.stringify(newProjects))
      return newProjects
    })
  }, [])

  const newProject = useCallback(() => {
    setCurrentProjectId(null)
    localStorage.removeItem(CURRENT_PROJECT_KEY)
  }, [])

  const toggleAutosave = useCallback(() => {
    const newValue = !autosaveEnabled
    setAutosaveEnabled(newValue)
    localStorage.setItem(AUTOSAVE_KEY, JSON.stringify(newValue))
  }, [autosaveEnabled])

  const exportProject = useCallback((projectId) => {
    const project = projects.find(p => p.id === projectId)
    if (project) {
      const data = {
        ...project.data,
        metadata: {
          version: '1.0',
          exportedAt: new Date().toISOString(),
          projectName: project.name,
          projectId: project.id
        }
      }

      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `${project.name.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.json`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
    }
  }, [projects])

  const importProject = useCallback((file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = (event) => {
        try {
          const data = JSON.parse(event.target?.result)
          if (data.nodes && data.connections) {
            const projectName = data.metadata?.projectName || `Imported ${new Date().toLocaleDateString()}`
            const projectData = {
              nodes: data.nodes,
              connections: data.connections,
              borders: data.borders || []
            }
            const projectId = saveProject(projectData, projectName)
            resolve({ projectId, projectData })
          } else {
            reject(new Error('Invalid project file format'))
          }
        } catch (error) {
          reject(error)
        }
      }
      reader.readAsText(file)
    })
  }, [saveProject])

  const autosave = useCallback((projectData) => {
    if (autosaveEnabled) {
      saveProject(projectData, 'Autosave')
    }
  }, [autosaveEnabled, saveProject])

  return {
    projects,
    currentProjectId,
    autosaveEnabled,
    saveProject,
    loadProject,
    deleteProject,
    renameProject,
    newProject,
    toggleAutosave,
    exportProject,
    importProject,
    autosave
  }
}
