import * as React from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { PREDEFINED_VARIABLES, validateTemplateContent } from "@/lib/api"
import { cn } from "@/lib/utils"
import { Save, AlertCircle } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

interface TemplateEditorProps {
  initialName?: string
  initialContent?: string
  onSave: (name: string, content: string) => Promise<void>
  loading?: boolean
  mode: "create" | "edit"
}

export function TemplateEditor({
  initialName = "",
  initialContent = "",
  onSave,
  loading = false,
  mode,
}: TemplateEditorProps) {
  const [name, setName] = React.useState(initialName)
  const [content, setContent] = React.useState(initialContent)
  const [validation, setValidation] = React.useState<{
    isValid: boolean
    errors: string[]
  }>({ isValid: true, errors: [] })
  
  const { toast } = useToast()
  const textareaRef = React.useRef<HTMLTextAreaElement>(null)

  // Validate content whenever it changes
  React.useEffect(() => {
    if (content.trim()) {
      setValidation(validateTemplateContent(content))
    } else {
      setValidation({ isValid: true, errors: [] })
    }
  }, [content])

  // Insert variable at cursor position
  const handleVariableInsert = (variableName: string) => {
    const variable = `{${variableName}}`
    
    if (textareaRef.current) {
      const textarea = textareaRef.current
      const start = textarea.selectionStart
      const end = textarea.selectionEnd
      const newContent = content.substring(0, start) + variable + content.substring(end)
      
      setContent(newContent)
      
      // Restore cursor position after variable
      setTimeout(() => {
        textarea.focus()
        textarea.setSelectionRange(start + variable.length, start + variable.length)
      }, 0)
    }

    toast({
      title: "Variable insertada",
      description: `${variable} ha sido insertado en el editor`,
    })
  }

  const handleSave = async () => {
    if (!name.trim()) {
      toast({
        title: "Error de validación",
        description: "El nombre de la plantilla es requerido",
        variant: "destructive",
      })
      return
    }

    if (!content.trim()) {
      toast({
        title: "Error de validación", 
        description: "El contenido de la plantilla es requerido",
        variant: "destructive",
      })
      return
    }

    if (!validation.isValid) {
      toast({
        title: "Error de validación",
        description: validation.errors[0],
        variant: "destructive",
      })
      return
    }

    try {
      await onSave(name.trim(), content.trim())
    } catch (error) {
      // Error handling is managed by parent component
    }
  }

  const isFormValid = name.trim() && content.trim() && validation.isValid

  return (
    <div className="max-w-7xl mx-auto p-6">
      <div className="text-center mb-8">
        <h1 className="text-2xl font-bold text-foreground mb-2">
          Sistema de Gestión de Plantillas de Mensajes
        </h1>
        <p className="text-muted-foreground">
          Crea y gestiona plantillas de mensajes con variables dinámicas para una comunicación consistente
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Editor Section - Left Side */}
        <Card className="h-fit">
          <CardHeader className="bg-muted/30 border-b">
            <CardTitle className="text-lg font-semibold">
              {mode === "create" ? "Crear Nueva Plantilla" : "Editar Plantilla"}
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6 space-y-4">
            <div className="space-y-2">
              <Label htmlFor="template-name" className="text-sm font-medium">
                Nombre de la Plantilla
              </Label>
              <Input
                id="template-name"
                placeholder="Ingresa el nombre de la plantilla"
                value={name}
                onChange={(e) => setName(e.target.value)}
                disabled={loading}
                className="w-full"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="template-content" className="text-sm font-medium">
                Contenido del Mensaje
              </Label>
              <Textarea
                id="template-content"
                ref={textareaRef}
                placeholder="Escribe aquí el contenido de tu plantilla. Usa las variables disponibles del panel derecho."
                value={content}
                onChange={(e) => setContent(e.target.value)}
                disabled={loading}
                className={cn(
                  "min-h-[200px] resize-none text-sm",
                  !validation.isValid && "border-destructive focus-visible:ring-destructive"
                )}
              />
              
              {/* Validation Errors */}
              {!validation.isValid && (
                <div className="flex items-start gap-2 p-3 rounded-md bg-destructive/10 border border-destructive/20">
                  <AlertCircle className="h-4 w-4 text-destructive mt-0.5 flex-shrink-0" />
                  <div className="space-y-1">
                    {validation.errors.map((error, index) => (
                      <p key={index} className="text-sm text-destructive">
                        {error}
                      </p>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="pt-4">
              <Button
                onClick={handleSave}
                disabled={loading || !isFormValid}
                className="w-full bg-primary hover:bg-primary-hover text-primary-foreground"
              >
                {loading && (
                  <svg className="mr-2 h-4 w-4 animate-spin" fill="none" viewBox="0 0 24 24">
                    <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" className="opacity-25" />
                    <path fill="currentColor" d="m4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" className="opacity-75" />
                  </svg>
                )}
                {mode === "create" ? "Crear Plantilla" : "Actualizar Plantilla"}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Variables Panel - Right Side */}
        <Card className="h-fit">
          <CardHeader className="bg-muted/30 border-b">
            <CardTitle className="text-lg font-semibold">Variables Disponibles</CardTitle>
            <p className="text-sm text-muted-foreground mt-1">
              Haz clic en las variables para insertarlas en tu plantilla
            </p>
          </CardHeader>
          <CardContent className="p-6">
            <ScrollArea className="h-[400px]">
              <div className="space-y-2">
                {PREDEFINED_VARIABLES.map((variable) => (
                  <Button
                    key={variable.name}
                    variant="outline"
                    size="sm"
                    className="w-full justify-start p-3 h-auto text-left hover:bg-accent/50 transition-colors"
                    onClick={() => handleVariableInsert(variable.name)}
                    disabled={loading}
                  >
                    <div className="flex flex-col items-start gap-1 w-full">
                      <div className="font-mono text-xs bg-muted px-2 py-1 rounded">
                        {`{${variable.name}}`}
                      </div>
                      <p className="text-xs text-muted-foreground">
                        {variable.description}
                      </p>
                    </div>
                  </Button>
                ))}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}