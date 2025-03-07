import { ReactNode, memo, useEffect, useState, useRef } from 'react';

interface TabContentProps {
  children: ReactNode;
  isActive: boolean;
}

// Optimized TabContent with improved transitions
export const TabContent = memo(({ children, isActive }: TabContentProps) => {
  // Add state to track mounting/unmounting for animation
  const [mounted, setMounted] = useState(isActive);
  const [isVisible, setIsVisible] = useState(isActive);
  const contentRef = useRef<HTMLDivElement>(null);
  
  // Handle visibility first, then mounting/unmounting
  useEffect(() => {
    let unmountTimer: ReturnType<typeof setTimeout>;
    
    if (isActive) {
      // If becoming active, mount immediately
      setMounted(true);
      
      // After a small delay (for browser paint), set visible
      const animationFrame = requestAnimationFrame(() => {
        setIsVisible(true);
      });
      
      return () => cancelAnimationFrame(animationFrame);
    } else {
      // If becoming inactive, hide first
      setIsVisible(false);
      
      // Then unmount after transition completes - but keep it longer
      unmountTimer = setTimeout(() => {
        setMounted(false);
      }, 300); // Longer than transition time to ensure it completes
    }
    
    return () => clearTimeout(unmountTimer);
  }, [isActive]);
  
  // If not mounted and not active, don't render
  if (!mounted && !isActive) return null;
  
  // Use data attribute for styling rather than just classes
  return (
    <div 
      className="tab-panel"
      data-active={isActive ? "true" : "false"}
      data-visible={isVisible ? "true" : "false"}
      role="tabpanel" 
      aria-hidden={!isActive}
      ref={contentRef}
    >
      <div className="tab-content">
        {children}
      </div>
    </div>
  );
});

TabContent.displayName = 'TabContent';
