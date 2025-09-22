import * as React from "react"
import { TemplateList } from "@/components/template-list"
import { TemplateEditor } from "@/components/template-editor"
import { Header } from "@/components/layout/header"
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
  const handleNavigate = (view: ViewState) => {
    setCurrentView(view)
    if (view !== "edit") {
      setEditingTemplate(null)
    }
  }

  const handleCreateNew = () => {
    setEditingTemplate(null)
    setCurrentView("create")
  }

  const handleEdit = (template: Template) => {
    setEditingTemplate(template)
    setCurrentView("edit")
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
      setCurrentView("list")
      setEditingTemplate(null)
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

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <Header 
        currentView={currentView}
        onNavigate={handleNavigate}
      />

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        {currentView === "list" && (
          <TemplateList
            templates={templates}
            onEdit={handleEdit}
            onDelete={handleDelete}
            onCreate={handleCreateNew}
            loading={loading}
            deleteLoading={deleteLoading}
          />
        )}
        
        {currentView === "create" && (
          <TemplateEditor
            onSave={handleSave}
            loading={saving}
            mode="create"
          />
        )}
        
        {currentView === "edit" && editingTemplate && (
          <TemplateEditor
            initialName={editingTemplate.name}
            initialContent={editingTemplate.content}
            onSave={handleSave}
            loading={saving}
            mode="edit"
          />
        )}
      </main>
    </div>
  );
};

export default Index;
