import { ZoomIn, ZoomOut } from "lucide-react";
import { Button } from "@/components/ui/button";

interface ZoomButtonProps {
  isActive: boolean;
  onClick: () => void;
}

export function ZoomButton({ isActive, onClick }: ZoomButtonProps) {
  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onClick();
  };

  return (
    <Button
      variant={isActive ? "default" : "secondary"}
      size="icon"
      onClick={handleClick}
      className="fixed top-4 right-4 z-50 shadow-lg"
      data-zoom-button="true"
      aria-label={isActive ? "Desactivar modo zoom" : "Activar modo zoom"}
    >
      {isActive ? (
        <ZoomOut className="h-4 w-4" />
      ) : (
        <ZoomIn className="h-4 w-4" />
      )}
    </Button>
  );
}
