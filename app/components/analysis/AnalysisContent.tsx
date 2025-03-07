import { Card } from "flowbite-react";
import { ReactNode, useState, useRef, useEffect } from "react";
import { TabContent } from "~/components/analysis/TabContent";

export interface TabItem {
  id: string;
  label: string;
  icon?: ReactNode;
  content: ReactNode;
}

export interface AnalysisContentProps {
  tabs: TabItem[];
  className?: string;
}

export function AnalysisContent({ tabs, className = "" }: AnalysisContentProps) {
  const [activeTab, setActiveTab] = useState(0);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const lastClickTime = useRef<number | null>(null);

  // Handle smooth transitions
  useEffect(() => {
    if (containerRef.current) {
      // Save current scroll position
      const scrollPosition = window.scrollY;
      
      // Set transitioning state
      setIsTransitioning(true);
      
      // After the tab content renders, restore scroll position
      const timer = setTimeout(() => {
        window.scrollTo({
          top: scrollPosition,
          behavior: 'auto'
        });
        
        // Clear transition state
        setIsTransitioning(false);
      }, 220); // Slightly longer than CSS transition duration
      
      return () => {
        clearTimeout(timer);
      };
    }
  }, [activeTab]);

  // Handle tab changes with debouncing
  const handleTabChange = (index: number) => {
    // If already on this tab, do nothing
    if (activeTab === index) return;
    
    // If currently in a very short transition cooldown, ignore rapid clicks 
    if (isTransitioning) {
      const now = Date.now();
      if (!lastClickTime.current || now - lastClickTime.current < 100) {
        return;
      }
    }
    
    // Record last click time for debouncing
    lastClickTime.current = Date.now();
    
    // Update active tab state
    setActiveTab(index);
  };

  return (
    <Card className={`w-full shadow-sm rounded-2xl ${className}`} ref={containerRef}>
      {/* Tabs Navigation */}
      <div className="mb-4 border-b border-gray-200 dark:border-gray-700">
        <ul className="flex flex-wrap -mb-px text-sm font-medium text-center">
          {tabs.map((tab, index) => (
            <li key={tab.id} className="mr-2">
              <button
                onClick={() => handleTabChange(index)}
                className={`inline-flex items-center p-4 border-b-2 rounded-t-lg ${
                  activeTab === index 
                    ? 'text-blue-600 border-blue-600 active dark:text-blue-500 dark:border-blue-500'
                    : 'border-transparent hover:text-gray-600 hover:border-gray-300 dark:hover:text-gray-300'
                }`}
                aria-selected={activeTab === index}
                role="tab"
              >
                {tab.icon && <span className="mr-2">{tab.icon}</span>}
                {tab.label}
              </button>
            </li>
          ))}
        </ul>
      </div>

      {/* Tab Content Area */}
      <div className={`tab-content-wrapper ${isTransitioning ? 'is-transitioning' : ''}`}>
        {tabs.map((tab, index) => (
          <TabContent isActive={activeTab === index} key={tab.id}>
            {tab.content}
          </TabContent>
        ))}
      </div>
    </Card>
  );
}
