import * as React from "react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { FileText, Plus, List, ArrowLeft, LogOut } from "lucide-react"
import { useAuth } from "@/hooks/use-auth"

interface HeaderProps {
  currentView: "list" | "create" | "edit"
  onNavigate: (view: "list" | "create") => void
  className?: string
}

export function Header({ currentView, onNavigate, className }: HeaderProps) {
  const { logout, username } = useAuth();

  const getTitle = () => {
    switch (currentView) {
      case "list":
        return "Sistema de Plantillas"
      case "create":
        return "Crear Nueva Plantilla"
      case "edit":
        return "Editar Plantilla"
      default:
        return "Sistema de Plantillas"
    }
  }

  const getDescription = () => {
    switch (currentView) {
      case "list":
        return "Gestiona tus plantillas de mensajes con variables dinámicas"
      case "create":
        return "Crea una nueva plantilla con variables personalizables"
      case "edit":
        return "Modifica el contenido y configuración de la plantilla"
      default:
        return "Gestiona tus plantillas de mensajes"
    }
  }

  return (
    <header className={cn("border-b bg-card/95 backdrop-blur supports-[backdrop-filter]:bg-card/95", className)}>
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          {/* Logo and Navigation */}
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-primary/10 p-2">
                <FileText className="h-6 w-6 text-primary" />
              </div>
              <div>
                <h1 className="text-xl font-bold tracking-tight text-foreground">
                  {getTitle()}
                </h1>
                <p className="text-sm text-muted-foreground hidden sm:block">
                  {getDescription()}
                </p>
              </div>
            </div>
          </div>

          {/* Navigation Actions */}
          <nav className="flex items-center gap-2">
            {username && (
              <span className="text-sm text-muted-foreground hidden md:inline">
                Usuario: <span className="font-medium text-foreground">{username}</span>
              </span>
            )}
            
            {currentView !== "list" && (
              <Button
                variant="outline"
                onClick={() => onNavigate("list")}
                className="gap-2"
              >
                <ArrowLeft className="h-4 w-4" />
                <span className="hidden sm:inline">Volver al Listado</span>
                <span className="sm:hidden">Volver</span>
              </Button>
            )}
            
            {currentView === "list" && (
              <>
                <Button
                  variant="outline"
                  onClick={() => onNavigate("list")}
                  className="gap-2"
                  aria-current={currentView === "list" ? "page" : undefined}
                >
                  <List className="h-4 w-4" />
                  <span className="hidden sm:inline">Ver Plantillas</span>
                </Button>
                <Button
                  onClick={() => onNavigate("create")}
                  className="gap-2"
                >
                  <Plus className="h-4 w-4" />
                  <span className="hidden sm:inline">Nueva Plantilla</span>
                  <span className="sm:hidden">Nueva</span>
                </Button>
              </>
            )}
            
            <Button 
              variant="outline" 
              size="sm"
              onClick={logout}
              className="gap-2"
            >
              <LogOut className="h-4 w-4" />
              <span className="hidden sm:inline">Cerrar sesión</span>
            </Button>
          </nav>
        </div>

        {/* Mobile description */}
        <p className="text-sm text-muted-foreground mt-2 sm:hidden">
          {getDescription()}
        </p>
      </div>
    </header>
  )
}