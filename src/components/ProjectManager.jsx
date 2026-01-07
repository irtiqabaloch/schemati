import { useEffect, useState } from 'react'
import { Button } from './ui/button'
import { Card, CardContent, CardHeader, CardTitle } from './ui/card'
import { Label } from './ui/label'
import { Input } from './ui/input'
import { FolderOpen, Save, Trash2, Download, Edit2, X, FileText } from 'lucide-react'

export default function ProjectManager({
  isOpen,
  onClose,
  projects,
  currentProjectId,
  onLoadProject,
  onSaveProject,
  onDeleteProject,
  onRenameProject,
  onNewProject,
  onExportProject,
  onImportProject,
  autosaveEnabled,
  onToggleAutosave
}) {
  const [editingProject, setEditingProject] = useState(null)
  const [editingName, setEditingName] = useState('')
  const [saveDialog, setSaveDialog] = useState(null)

  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape') {
        if (saveDialog) {
          setSaveDialog(null)
        } else if (isOpen) {
          onClose()
        }
      }
    }
    document.addEventListener('keydown', handleEscape)
    return () => document.removeEventListener('keydown', handleEscape)
  }, [isOpen, onClose, saveDialog])

  const handleBackdropClick = (e) => {
    if (e.target === e.currentTarget) {
      onClose()
    }
  }

  const handleRename = (projectId, currentName) => {
    setEditingProject(projectId)
    setEditingName(currentName)
  }

  const handleRenameSubmit = () => {
    if (editingProject && editingName.trim()) {
      onRenameProject(editingProject, editingName.trim())
      setEditingProject(null)
      setEditingName('')
    }
  }

  const handleSaveDialog = (projectData) => {
    setSaveDialog({
      title: 'Save Project',
      fields: [
        { name: 'name', label: 'Project Name', type: 'text', defaultValue: `Project ${new Date().toLocaleDateString()}` }
      ],
      onSubmit: (values) => {
        onSaveProject(projectData, values.name)
        setSaveDialog(null)
      }
    })
  }

  if (!isOpen) return null

  return (
    <div
      className="fixed inset-0 bg-black/50 backdrop-blur-sm hidden lg:flex items-center justify-center z-50 p-4"
      onClick={handleBackdropClick}
    >
      <div className="bg-card border border-border rounded-lg shadow-2xl max-w-4xl w-full max-h-[80vh] flex flex-col overflow-hidden">
        <div className="flex items-center justify-between p-6 border-b border-border flex-shrink-0">
          <h2 className="text-xl font-semibold">Project Manager</h2>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="h-5 w-5" />
          </Button>
        </div>

        <div className="p-6 overflow-y-auto flex-1 min-h-0">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-4">
              <Button onClick={onNewProject} className="flex items-center gap-2">
                <FileText className="h-4 w-4" />
                New Project
              </Button>
              <Button variant="outline" onClick={() => document.getElementById('project-import').click()}>
                <FolderOpen className="h-4 w-4 mr-2" />
                Import Project
              </Button>
              <input
                id="project-import"
                type="file"
                accept=".json"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0]
                  if (file) {
                    onImportProject(file).catch(error => {
                      alert('Failed to import project: ' + error.message)
                    })
                  }
                  e.target.value = ''
                }}
              />
            </div>

            <div className="flex items-center gap-2">
              <Label htmlFor="autosave" className="text-sm">Auto-save</Label>
              <input
                id="autosave"
                type="checkbox"
                checked={autosaveEnabled}
                onChange={onToggleAutosave}
                className="rounded border-input"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {projects.length === 0 ? (
              <div className="col-span-full text-center py-12 text-muted-foreground">
                <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>No saved projects yet</p>
                <p className="text-sm">Create your first project to get started!</p>
              </div>
            ) : (
              projects.map(project => (
                <Card key={project.id} className={`transition-all border-border ${currentProjectId === project.id ? 'ring-2 ring-primary border-primary' : ''}`}>
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      {editingProject === project.id ? (
                        <div className="flex-1 flex gap-2">
                          <Input
                            value={editingName}
                            onChange={(e) => setEditingName(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') handleRenameSubmit()
                              if (e.key === 'Escape') setEditingProject(null)
                            }}
                            className="h-8"
                            autoFocus
                          />
                          <Button size="sm" onClick={handleRenameSubmit}>Save</Button>
                          <Button size="sm" variant="ghost" onClick={() => setEditingProject(null)}>Cancel</Button>
                        </div>
                      ) : (
                        <>
                          <CardTitle className="text-base truncate" title={project.name}>
                            {project.name}
                          </CardTitle>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleRename(project.id, project.name)}
                            className="h-6 w-6"
                          >
                            <Edit2 className="h-3 w-3" />
                          </Button>
                        </>
                      )}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      Updated: {new Date(project.updatedAt).toLocaleDateString()}
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="flex flex-wrap gap-2 mb-3">
                      <span className="text-xs bg-muted px-2 py-1 rounded">
                        {project.data.nodes?.length || 0} nodes
                      </span>
                      <span className="text-xs bg-muted px-2 py-1 rounded">
                        {project.data.connections?.length || 0} connections
                      </span>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        onClick={() => onLoadProject(project.id)}
                        className="flex-1"
                      >
                        <FolderOpen className="h-3 w-3 mr-1" />
                        Load
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => onExportProject(project.id)}
                      >
                        <Download className="h-3 w-3" />
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          if (confirm(`Delete project "${project.name}"?`)) {
                            onDeleteProject(project.id)
                          }
                        }}
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </div>
      </div>

      {saveDialog && (
        <div 
          className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[60] p-4"
          onClick={(e) => {
            if(e.target === e.currentTarget) setSaveDialog(null)
          }}
        >
          <div className="bg-card border border-border rounded-lg shadow-2xl max-w-md w-full">
            <div className="flex items-center justify-between p-6 border-b border-border">
              <h3 className="text-lg font-semibold">{saveDialog.title}</h3>
              <Button variant="ghost" size="icon" onClick={() => setSaveDialog(null)}>
                <X className="h-5 w-5" />
              </Button>
            </div>
            <form 
              className="p-6"
              onSubmit={(e) => {
                e.preventDefault()
                const formData = new FormData(e.target)
                const values = {}
                saveDialog.fields.forEach(field => {
                  values[field.name] = formData.get(field.name)
                })
                saveDialog.onSubmit(values)
              }}
            >
              <div className="space-y-4">
                {saveDialog.fields.map(field => (
                  <div key={field.name}>
                    <Label htmlFor={field.name} className="text-sm font-medium">
                      {field.label}
                    </Label>
                    <Input
                      id={field.name}
                      name={field.name}
                      type={field.type}
                      defaultValue={field.defaultValue}
                      className="mt-1"
                      autoFocus
                    />
                  </div>
                ))}
              </div>
              <div className="flex justify-end gap-2 mt-6">
                <Button type="button" variant="outline" onClick={() => setSaveDialog(null)}>
                  Cancel
                </Button>
                <Button type="submit">
                  Save
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}