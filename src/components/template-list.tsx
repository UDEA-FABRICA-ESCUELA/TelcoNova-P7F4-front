import * as React from "react"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { ConfirmationDialog } from "@/components/ui/confirmation-dialog"
import { Template } from "@/lib/api"
import { cn } from "@/lib/utils"
import { Edit, Trash2 } from "lucide-react"

interface TemplateListProps {
  templates: Template[]
  onEdit: (template: Template) => void
  onDelete: (id: number) => Promise<void>
  onCreate: () => void
  loading?: boolean
  deleteLoading?: number | null
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

  const truncateContent = (content: string, maxLength = 100) => {
    if (content.length <= maxLength) return content
    return content.substring(0, maxLength) + "..."
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background p-6">
        <div className="max-w-6xl mx-auto">
          <div className="mb-8">
            <div className="h-8 w-96 bg-muted animate-pulse rounded mb-2" />
            <div className="h-4 w-64 bg-muted animate-pulse rounded" />
          </div>
          <div className="mb-6">
            <div className="h-6 w-80 bg-muted animate-pulse rounded mb-2" />
            <div className="h-4 w-96 bg-muted animate-pulse rounded" />
          </div>
          <div className="bg-white rounded-lg border">
            <div className="border-b p-4">
              <div className="h-6 w-32 bg-muted animate-pulse rounded" />
            </div>
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="border-b p-4 flex justify-between items-center">
                <div className="h-5 w-48 bg-muted animate-pulse rounded" />
                <div className="h-5 flex-1 mx-8 bg-muted animate-pulse rounded" />
                <div className="flex gap-2">
                  <div className="h-8 w-8 bg-muted animate-pulse rounded" />
                  <div className="h-8 w-8 bg-muted animate-pulse rounded" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header Principal */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground mb-2">
            Sistema de Notificaciones
          </h1>
          <p className="text-muted-foreground">
            Gestión de plantillas de mensajes personalizadas
          </p>
        </div>

        {/* Sección Gestión de Plantillas */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-2xl font-semibold text-foreground mb-1">
                Gestión de Plantillas de Mensajes
              </h2>
              <p className="text-muted-foreground">
                Administra las plantillas de notificaciones personalizadas para tu sistema
              </p>
            </div>
            <Button 
              onClick={onCreate}
              className="bg-foreground text-background hover:bg-foreground/90"
            >
              Nueva Plantilla
            </Button>
          </div>
          
          <p className="text-muted-foreground text-sm mb-1">Frame 2</p>
        </div>

        {/* Lista de Notificaciones */}
        <div>
          <h3 className="text-lg font-semibold text-foreground mb-4">
            Lista de Notificaciones
          </h3>
          
          {templates.length === 0 ? (
            <div className="bg-white rounded-lg border p-12 text-center">
              <p className="text-muted-foreground">No hay plantillas creadas</p>
              <Button onClick={onCreate} className="mt-4">
                Crear Primera Plantilla
              </Button>
            </div>
          ) : (
            <div className="bg-white rounded-lg border">
              <Table>
                <TableHeader>
                  <TableRow className="border-b">
                    <TableHead className="text-left font-semibold text-foreground py-4 px-6">
                      Nombre de la plantilla
                    </TableHead>
                    <TableHead className="text-left font-semibold text-foreground py-4 px-6 w-1/2">
                      Contenido
                    </TableHead>
                    <TableHead className="text-left font-semibold text-foreground py-4 px-6 w-24">
                      Actions
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {templates.map((template) => (
                    <TableRow 
                      key={template.id} 
                      className={cn(
                        "border-b hover:bg-muted/50",
                        deleteLoading === template.id && "opacity-50"
                      )}
                    >
                      <TableCell className="py-4 px-6">
                        <div className="font-medium text-foreground">
                          {template.name}
                        </div>
                      </TableCell>
                      <TableCell className="py-4 px-6">
                        <div className="text-muted-foreground text-sm">
                          {truncateContent(template.content)}
                        </div>
                      </TableCell>
                      <TableCell className="py-4 px-6">
                        <div className="flex items-center gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => onEdit(template)}
                            disabled={deleteLoading === template.id}
                            className="p-2 h-8 w-8"
                          >
                            <Edit className="h-4 w-4 text-muted-foreground" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDeleteClick(template)}
                            disabled={deleteLoading === template.id}
                            className="p-2 h-8 w-8"
                          >
                            {deleteLoading === template.id ? (
                              <svg className="h-4 w-4 animate-spin text-muted-foreground" fill="none" viewBox="0 0 24 24">
                                <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" className="opacity-25" />
                                <path fill="currentColor" d="m4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" className="opacity-75" />
                              </svg>
                            ) : (
                              <Trash2 className="h-4 w-4 text-muted-foreground" />
                            )}
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </div>
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