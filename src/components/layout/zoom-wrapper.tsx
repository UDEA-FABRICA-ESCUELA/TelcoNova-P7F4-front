import { useState, useEffect, ReactNode, useRef } from "react";
import { createPortal } from "react-dom";
import { ZoomButton } from "@/components/ui/zoom-button";

interface ZoomWrapperProps {
  children: ReactNode;
}

export function ZoomWrapper({ children }: ZoomWrapperProps) {
  const [isZoomMode, setIsZoomMode] = useState(false);
  const zoomedElementRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (!isZoomMode) {
      // Reset any zoomed element when zoom mode is disabled
      if (zoomedElementRef.current) {
        zoomedElementRef.current.style.fontSize = "";
        zoomedElementRef.current.style.fontWeight = "";
        zoomedElementRef.current = null;
      }
      // Remove cursor override
      document.body.classList.remove('zoom-mode-active');
      return;
    }

    // Add cursor override class to body
    document.body.classList.add('zoom-mode-active');

    const handleClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      
      // Allow zoom button to work normally - don't interfere with it at all
      if (target.closest('[data-zoom-button="true"]')) {
        return;
      }
      
      // Don't interfere with dialog/modal overlays or content
      if (target.closest('[role="dialog"]') || target.closest('[data-radix-portal]')) {
        return;
      }
      
      // Prevent all button and link actions when zoom mode is active
      e.preventDefault();
      e.stopPropagation();
      
      // If clicking the same element, toggle zoom off
      if (zoomedElementRef.current === target) {
        target.style.fontSize = "";
        target.style.fontWeight = "";
        zoomedElementRef.current = null;
        return;
      }
      
      // Reset previous zoomed element
      if (zoomedElementRef.current) {
        zoomedElementRef.current.style.fontSize = "";
        zoomedElementRef.current.style.fontWeight = "";
      }
      
      // Get all text from the clicked element and its children
      const textContent = target.textContent || "";
      
      if (textContent.trim()) {
        // Apply zoom effect permanently
        target.style.fontSize = "2rem";
        target.style.fontWeight = "bold";
        target.style.transition = "all 0.3s ease";
        zoomedElementRef.current = target;
      }
    };

    // Capture phase to ensure we catch the event first
    document.addEventListener("click", handleClick, true);

    return () => {
      document.removeEventListener("click", handleClick, true);
      document.body.classList.remove('zoom-mode-active');
    };
  }, [isZoomMode]);

  const toggleZoomMode = () => {
    setIsZoomMode(prev => !prev);
  };

  return (
    <>
      {createPortal(
        <ZoomButton isActive={isZoomMode} onClick={toggleZoomMode} />,
        document.body
      )}
      <div className={isZoomMode ? "cursor-zoom-in" : ""}>
        {children}
      </div>
    </>
  );
}
