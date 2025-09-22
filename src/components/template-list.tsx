import * as React from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ConfirmationDialog } from "@/components/ui/confirmation-dialog"
import { Template } from "@/lib/api"
import { cn } from "@/lib/utils"
import { Edit, Trash2, Plus, FileText, Eye } from "lucide-react"
import { format } from "date-fns"
import { es } from "date-fns/locale"

interface TemplateListProps {
  templates: Template[]
  onEdit: (template: Template) => void
  onDelete: (id: string) => Promise<void>
  onCreate: () => void
  loading?: boolean
  deleteLoading?: string | null
}

export function TemplateList({
  templates,
  onEdit,
  onDelete,
  onCreate,
  loading = false,
  deleteLoading = null,
}: TemplateListProps) {
  const [deleteDialog, setDeleteDialog] = React.useState<{
    open: boolean
    template: Template | null
  }>({
    open: false,
    template: null,
  })

  const handleDeleteClick = (template: Template) => {
    setDeleteDialog({ open: true, template })
  }

  const handleDeleteConfirm = async () => {
    if (!deleteDialog.template) return

    try {
      await onDelete(deleteDialog.template.id)
      setDeleteDialog({ open: false, template: null })
    } catch (error) {
      // Error handling is managed by parent component
    }
  }

  const formatDate = (dateString: string) => {
    try {
      return format(new Date(dateString), "d 'de' MMM yyyy, HH:mm", { locale: es })
    } catch {
      return "Fecha inválida"
    }
  }

  const truncateContent = (content: string, maxLength = 150) => {
    if (content.length <= maxLength) return content
    return content.substring(0, maxLength) + "..."
  }

  const extractVariables = (content: string) => {
    const matches = content.match(/\{[a-zA-Z0-9_]+\}/g) || []
    return matches.map(match => match.slice(1, -1)) // Remove { }
  }

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto p-6">
        <div className="text-center mb-8">
          <div className="h-8 w-96 bg-muted animate-pulse rounded mx-auto mb-2" />
          <div className="h-4 w-64 bg-muted animate-pulse rounded mx-auto" />
        </div>
        <div className="space-y-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardHeader className="space-y-3">
                <div className="flex justify-between items-start">
                  <div className="h-6 w-1/3 bg-muted rounded" />
                  <div className="flex gap-2">
                    <div className="h-8 w-8 bg-muted rounded" />
                    <div className="h-8 w-8 bg-muted rounded" />
                    <div className="h-8 w-8 bg-muted rounded" />
                  </div>
                </div>
                <div className="h-4 w-1/4 bg-muted rounded" />
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="space-y-2">
                  <div className="h-4 w-full bg-muted rounded" />
                  <div className="h-4 w-5/6 bg-muted rounded" />
                </div>
                <div className="flex gap-2">
                  <div className="h-6 w-20 bg-muted rounded" />
                  <div className="h-6 w-16 bg-muted rounded" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-7xl mx-auto p-6">
      {/* Header */}
      <div className="text-center mb-8">
        <h1 className="text-2xl font-bold text-foreground mb-2">
          Sistema de Gestión de Plantillas de Mensajes
        </h1>
        <p className="text-muted-foreground">
          Crea y gestiona plantillas de mensajes con variables dinámicas para una comunicación consistente
        </p>
      </div>

      {/* Navigation Tabs */}
      <div className="bg-muted/30 rounded-lg p-1 mb-6 inline-flex">
        <Button
          variant="secondary"
          className="bg-white shadow-sm border"
          disabled
        >
          Lista de Plantillas ({templates.length})
        </Button>
        <Button
          variant="ghost"
          onClick={onCreate}
        >
          Crear Plantilla
        </Button>
      </div>

      {/* Templates Section */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold">Plantillas Guardadas</h2>
          <span className="text-muted-foreground">{templates.length} plantillas</span>
        </div>
        <p className="text-sm text-muted-foreground mb-6">
          Gestiona todas tus plantillas de mensajes
        </p>

        {/* Empty State */}
        {templates.length === 0 && (
          <Card className="text-center py-12">
            <CardContent className="space-y-4">
              <div className="rounded-full bg-muted/50 w-16 h-16 flex items-center justify-center mx-auto">
                <FileText className="h-8 w-8 text-muted-foreground" />
              </div>
              <div className="space-y-2">
                <h3 className="text-xl font-semibold">No hay plantillas creadas</h3>
                <p className="text-muted-foreground max-w-md mx-auto">
                  Comienza creando tu primera plantilla para agilizar tu comunicación con clientes
                </p>
              </div>
              <Button onClick={onCreate} size="lg">
                <Plus className="mr-2 h-4 w-4" />
                Crear Primera Plantilla
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Templates List */}
        {templates.length > 0 && (
          <div className="space-y-4">
            {templates.map((template) => {
              const variables = extractVariables(template.content)
              return (
                <Card 
                  key={template.id} 
                  className={cn(
                    "transition-all duration-200 hover:shadow-sm",
                    deleteLoading === template.id && "opacity-50"
                  )}
                >
                  <CardHeader className="pb-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <CardTitle className="text-lg font-semibold mb-1">
                          {template.name}
                        </CardTitle>
                        <CardDescription className="text-sm text-muted-foreground">
                          Creado: {formatDate(template.createdAt)}
                        </CardDescription>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => onEdit(template)}
                          disabled={deleteLoading === template.id}
                          className="text-action-edit hover:text-action-edit-hover"
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => onEdit(template)}
                          disabled={deleteLoading === template.id}
                          className="text-action-edit hover:text-action-edit-hover"
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDeleteClick(template)}
                          disabled={deleteLoading === template.id}
                          className="text-action-delete hover:text-action-delete-hover"
                        >
                          {deleteLoading === template.id ? (
                            <svg className="h-4 w-4 animate-spin" fill="none" viewBox="0 0 24 24">
                              <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" className="opacity-25" />
                              <path fill="currentColor" d="m4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" className="opacity-75" />
                            </svg>
                          ) : (
                            <Trash2 className="h-4 w-4" />
                          )}
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                  
                  <CardContent className="space-y-4">
                    <div>
                      <h4 className="text-sm font-medium mb-2">Contenido:</h4>
                      <div className="bg-muted/50 p-3 rounded-md text-sm text-foreground">
                        {truncateContent(template.content)}
                      </div>
                    </div>
                    
                    {variables.length > 0 && (
                      <div>
                        <h4 className="text-sm font-medium mb-2">Variables utilizadas:</h4>
                        <div className="flex flex-wrap gap-2">
                          {variables.map((variable, index) => (
                            <Badge key={index} variant="secondary" className="text-xs font-mono">
                              {variable}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              )
            })}
          </div>
        )}
      </div>

      {/* Delete Confirmation Dialog */}
      <ConfirmationDialog
        open={deleteDialog.open}
        onOpenChange={(open) => setDeleteDialog({ open, template: null })}
        title="Eliminar Plantilla"
        description={
          deleteDialog.template 
            ? `¿Estás seguro de que deseas eliminar la plantilla "${deleteDialog.template.name}"? Esta acción no se puede deshacer.`
            : ""
        }
        confirmText="Eliminar"
        cancelText="Cancelar"
        variant="destructive"
        onConfirm={handleDeleteConfirm}
        loading={!!deleteLoading}
      />
    </div>
  )
}