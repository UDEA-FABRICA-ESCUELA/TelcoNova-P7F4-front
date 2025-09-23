import * as React from "react"
import { TemplateList } from "@/components/template-list"
import { TemplateEditor } from "@/components/template-editor"
import { useToast } from "@/hooks/use-toast"
import {
  Template,
  listTemplates,
  createTemplate,
  updateTemplate,
  deleteTemplate,
  initializeSampleData,
} from "@/lib/api"

type ViewState = "list" | "create" | "edit"

const Index = () => {
  const [currentView, setCurrentView] = React.useState<ViewState>("list")
  const [templates, setTemplates] = React.useState<Template[]>([])
  const [editingTemplate, setEditingTemplate] = React.useState<Template | null>(null)
  const [loading, setLoading] = React.useState(true)
  const [saving, setSaving] = React.useState(false)
  const [deleteLoading, setDeleteLoading] = React.useState<string | null>(null)
  
  const { toast } = useToast()

  // Initialize data on mount
  React.useEffect(() => {
    const initializeApp = async () => {
      try {
        // Initialize sample data if needed
        initializeSampleData()
        
        // Load templates
        const templateList = await listTemplates()
        setTemplates(templateList)
      } catch (error) {
        toast({
          title: "Error al cargar datos",
          description: "No se pudieron cargar las plantillas",
          variant: "destructive",
        })
      } finally {
        setLoading(false)
      }
    }

    initializeApp()
  }, [toast])

  // Navigation handlers
  const handleCreateNew = () => {
    setEditingTemplate(null)
    setCurrentView("create")
  }

  const handleEdit = (template: Template) => {
    setEditingTemplate(template)
    setCurrentView("edit")
  }

  const handleBackToList = () => {
    setCurrentView("list")
    setEditingTemplate(null)
  }

  // CRUD operations
  const handleSave = async (name: string, content: string) => {
    setSaving(true)
    
    try {
      if (currentView === "create") {
        const newTemplate = await createTemplate({ name, content })
        setTemplates(prev => [newTemplate, ...prev])
        
        toast({
          title: "Plantilla creada",
          description: `La plantilla "${name}" ha sido creada exitosamente`,
        })
      } else if (currentView === "edit" && editingTemplate) {
        const updatedTemplate = await updateTemplate(editingTemplate.id, { name, content })
        setTemplates(prev => 
          prev.map(template => 
            template.id === editingTemplate.id ? updatedTemplate : template
          )
        )
        
        toast({
          title: "Plantilla actualizada",
          description: `La plantilla "${name}" ha sido actualizada exitosamente`,
        })
      }
      
      // Navigate back to list
      handleBackToList()
    } catch (error) {
      const message = error instanceof Error ? error.message : "Error desconocido"
      toast({
        title: "Error al guardar",
        description: message,
        variant: "destructive",
      })
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (id: string) => {
    setDeleteLoading(id)
    
    try {
      await deleteTemplate(id)
      setTemplates(prev => prev.filter(template => template.id !== id))
      
      toast({
        title: "Plantilla eliminada",
        description: "La plantilla ha sido eliminada exitosamente",
      })
    } catch (error) {
      const message = error instanceof Error ? error.message : "Error al eliminar la plantilla"
      toast({
        title: "Error al eliminar",
        description: message,
        variant: "destructive",
      })
    } finally {
      setDeleteLoading(null)
    }
  }

  // Render different views based on current state
  if (currentView === "list") {
    return (
      <div className="min-h-screen bg-background">
        <TemplateList
          templates={templates}
          onEdit={handleEdit}
          onDelete={handleDelete}
          onCreate={handleCreateNew}
          loading={loading}
          deleteLoading={deleteLoading}
        />
      </div>
    )
  }

  if (currentView === "create") {
    return (
      <div className="min-h-screen bg-background">
        <TemplateEditor
          onSave={handleSave}
          onCancel={handleBackToList}
          loading={saving}
          mode="create"
        />
      </div>
    )
  }

  if (currentView === "edit" && editingTemplate) {
    return (
      <div className="min-h-screen bg-background">
        <TemplateEditor
          initialName={editingTemplate.name}
          initialContent={editingTemplate.content}
          onSave={handleSave}
          onCancel={handleBackToList}
          loading={saving}
          mode="edit"
        />
      </div>
    )
  }

  // Fallback
  return (
    <div className="min-h-screen bg-background">
      <TemplateList
        templates={templates}
        onEdit={handleEdit}
        onDelete={handleDelete}
        onCreate={handleCreateNew}
        loading={loading}
        deleteLoading={deleteLoading}
      />
    </div>
  )
};

export default Index;
