import { useState, useEffect, ReactNode } from "react";
import { ZoomButton } from "@/components/ui/zoom-button";

interface ZoomWrapperProps {
  children: ReactNode;
}

export function ZoomWrapper({ children }: ZoomWrapperProps) {
  const [isZoomMode, setIsZoomMode] = useState(false);

  useEffect(() => {
    if (!isZoomMode) return;

    const handleClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      
      // Allow zoom button to work normally
      if (target.closest('[data-zoom-button="true"]')) {
        return;
      }
      
      // Prevent all button and link actions when zoom mode is active
      e.preventDefault();
      e.stopPropagation();
      
      // Get all text from the clicked element and its children
      const textContent = target.textContent || "";
      
      if (textContent.trim()) {
        // Apply zoom effect
        target.style.fontSize = "2rem";
        target.style.fontWeight = "bold";
        target.style.transition = "all 0.3s ease";
        
        // Reset after 3 seconds
        setTimeout(() => {
          target.style.fontSize = "";
          target.style.fontWeight = "";
        }, 3000);
      }
    };

    // Capture phase to ensure we catch the event first
    document.addEventListener("click", handleClick, true);

    return () => {
      document.removeEventListener("click", handleClick, true);
    };
  }, [isZoomMode]);

  const toggleZoomMode = () => {
    setIsZoomMode(prev => !prev);
  };

  return (
    <>
      <ZoomButton isActive={isZoomMode} onClick={toggleZoomMode} />
      <div className={isZoomMode ? "cursor-pointer" : ""}>
        {children}
      </div>
    </>
  );
}
