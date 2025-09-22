import * as React from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ConfirmationDialog } from "@/components/ui/confirmation-dialog"
import { Template } from "@/lib/api"
import { cn } from "@/lib/utils"
import { Edit, Trash2, Plus, FileText, Calendar } from "lucide-react"
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
      return format(new Date(dateString), "d 'de' MMMM, yyyy", { locale: es })
    } catch {
      return "Fecha inválida"
    }
  }

  const truncateContent = (content: string, maxLength = 120) => {
    if (content.length <= maxLength) return content
    return content.substring(0, maxLength) + "..."
  }

  if (loading) {
    return (
      <div className="space-y-4">
        {/* Header Skeleton */}
        <div className="flex justify-between items-center">
          <div className="space-y-2">
            <div className="h-8 w-48 bg-muted animate-pulse rounded" />
            <div className="h-4 w-72 bg-muted animate-pulse rounded" />
          </div>
          <div className="h-10 w-32 bg-muted animate-pulse rounded" />
        </div>
        
        {/* Template Cards Skeleton */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardHeader className="space-y-3">
                <div className="h-6 w-3/4 bg-muted rounded" />
                <div className="h-4 w-1/2 bg-muted rounded" />
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="space-y-2">
                  <div className="h-4 w-full bg-muted rounded" />
                  <div className="h-4 w-5/6 bg-muted rounded" />
                  <div className="h-4 w-2/3 bg-muted rounded" />
                </div>
                <div className="flex justify-between items-center pt-2">
                  <div className="h-8 w-16 bg-muted rounded" />
                  <div className="flex gap-2">
                    <div className="h-8 w-8 bg-muted rounded" />
                    <div className="h-8 w-8 bg-muted rounded" />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            Gestión de Plantillas
          </h1>
          <p className="text-muted-foreground">
            Administra tus plantillas de mensajes con variables dinámicas
          </p>
        </div>
        <Button onClick={onCreate} size="lg" className="sm:w-auto">
          <Plus className="mr-2 h-4 w-4" />
          Nueva Plantilla
        </Button>
      </div>

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

      {/* Templates Grid */}
      {templates.length > 0 && (
        <>
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">
              {templates.length} {templates.length === 1 ? 'plantilla encontrada' : 'plantillas encontradas'}
            </p>
          </div>
          
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {templates.map((template) => (
              <Card 
                key={template.id} 
                className={cn(
                  "group hover:shadow-md transition-all duration-200",
                  deleteLoading === template.id && "opacity-50"
                )}
              >
                <CardHeader className="space-y-3">
                  <div className="flex items-start justify-between">
                    <CardTitle className="text-lg leading-tight">
                      {template.name}
                    </CardTitle>
                    <Badge variant="outline" className="ml-2 flex-shrink-0">
                      <Calendar className="mr-1 h-3 w-3" />
                      {formatDate(template.updatedAt)}
                    </Badge>
                  </div>
                  <CardDescription className="line-clamp-3 min-h-[3rem]">
                    {truncateContent(template.content)}
                  </CardDescription>
                </CardHeader>
                
                <CardContent>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      {/* Variable count indicator */}
                      <Badge variant="secondary" className="text-xs">
                        {(template.content.match(/\{[a-zA-Z0-9_]+\}/g) || []).length} variables
                      </Badge>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => onEdit(template)}
                        disabled={deleteLoading === template.id}
                        aria-label={`Editar plantilla ${template.name}`}
                        className="text-action-edit hover:text-action-edit-hover hover:bg-muted/50 border-muted-foreground/20"
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDeleteClick(template)}
                        disabled={deleteLoading === template.id}
                        aria-label={`Eliminar plantilla ${template.name}`}
                        className="text-action-delete hover:text-action-delete-hover hover:bg-destructive/10 border-muted-foreground/20"
                      >
                        {deleteLoading === template.id ? (
                          <svg
                            className="h-4 w-4 animate-spin"
                            fill="none"
                            viewBox="0 0 24 24"
                            aria-hidden="true"
                          >
                            <circle
                              cx="12"
                              cy="12"
                              r="10"
                              stroke="currentColor"
                              strokeWidth="4"
                              className="opacity-25"
                            />
                            <path
                              fill="currentColor"
                              d="m4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                              className="opacity-75"
                            />
                          </svg>
                        ) : (
                          <Trash2 className="h-4 w-4" />
                        )}
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </>
      )}

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