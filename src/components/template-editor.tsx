import * as React from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Separator } from "@/components/ui/separator"
import { PREDEFINED_VARIABLES, validateTemplateContent } from "@/lib/api"
import { cn } from "@/lib/utils"
import { Save, Copy, Check, AlertCircle } from "lucide-react"
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
  const [copiedVariable, setCopiedVariable] = React.useState<string | null>(null)
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

  // Copy variable to clipboard and insert at cursor position
  const handleVariableCopy = async (variableName: string) => {
    const variable = `{${variableName}}`
    
    try {
      await navigator.clipboard.writeText(variable)
      setCopiedVariable(variableName)
      setTimeout(() => setCopiedVariable(null), 2000)
      
      // Insert at cursor position in textarea
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
    } catch (error) {
      toast({
        title: "Error",
        description: "No se pudo copiar la variable",
        variant: "destructive",
      })
    }
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
    <div className="flex flex-col lg:flex-row gap-6 h-full">
      {/* Editor Section */}
      <div className="flex-1 space-y-6">
        <Card className="h-full">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <div className="rounded-md bg-primary/10 p-2">
                <Save className="h-4 w-4 text-primary" />
              </div>
              {mode === "create" ? "Crear Nueva Plantilla" : "Editar Plantilla"}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="template-name">
                Nombre de la plantilla <span className="text-destructive">*</span>
              </Label>
              <Input
                id="template-name"
                placeholder="Ej: Confirmación de pedido"
                value={name}
                onChange={(e) => setName(e.target.value)}
                disabled={loading}
                className="text-base"
                aria-describedby="template-name-help"
                maxLength={100}
              />
              <p id="template-name-help" className="text-sm text-muted-foreground">
                Nombre descriptivo para identificar la plantilla
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="template-content">
                Contenido de la plantilla <span className="text-destructive">*</span>
              </Label>
              <Textarea
                id="template-content"
                ref={textareaRef}
                placeholder="Escribe tu mensaje aquí. Usa variables como {nombre_cliente} para personalizar el contenido..."
                value={content}
                onChange={(e) => setContent(e.target.value)}
                disabled={loading}
                className={cn(
                  "min-h-[200px] text-base resize-none",
                  !validation.isValid && "border-destructive focus-visible:ring-destructive"
                )}
                aria-describedby="template-content-help template-content-errors"
              />
              <p id="template-content-help" className="text-sm text-muted-foreground">
                Utiliza variables dinámicas del panel lateral para personalizar el mensaje
              </p>
              
              {/* Validation Errors */}
              {!validation.isValid && (
                <div 
                  id="template-content-errors" 
                  className="flex items-start gap-2 p-3 rounded-md bg-destructive/10 border border-destructive/20"
                  role="alert"
                  aria-live="polite"
                >
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

            <div className="flex justify-end pt-4">
              <Button
                onClick={handleSave}
                disabled={loading || !isFormValid}
                className="min-w-[120px]"
                size="lg"
              >
                {loading && (
                  <svg
                    className="mr-2 h-4 w-4 animate-spin"
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
                )}
                <Save className="mr-2 h-4 w-4" />
                {mode === "create" ? "Crear Plantilla" : "Guardar Cambios"}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Variables Panel */}
      <div className="w-full lg:w-80">
        <Card className="h-full">
          <CardHeader>
            <CardTitle className="text-lg">Variables Disponibles</CardTitle>
            <p className="text-sm text-muted-foreground">
              Haz clic en una variable para insertarla en el editor
            </p>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-[400px] lg:h-[500px]">
              <div className="space-y-3">
                {PREDEFINED_VARIABLES.map((variable, index) => (
                  <div key={variable.name}>
                    <Button
                      variant="outline"
                      className="w-full justify-start h-auto p-3 text-left hover:bg-accent/50 transition-colors"
                      onClick={() => handleVariableCopy(variable.name)}
                      disabled={loading}
                      aria-label={`Insertar variable ${variable.name}: ${variable.description}`}
                    >
                      <div className="flex items-center justify-between w-full">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <Badge variant="secondary" className="font-mono text-xs">
                              {`{${variable.name}}`}
                            </Badge>
                            {copiedVariable === variable.name && (
                              <Check className="h-3 w-3 text-success" />
                            )}
                          </div>
                          <p className="text-xs text-muted-foreground">
                            {variable.description}
                          </p>
                        </div>
                        <Copy className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                      </div>
                    </Button>
                    {index < PREDEFINED_VARIABLES.length - 1 && (
                      <Separator className="mt-3" />
                    )}
                  </div>
                ))}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}