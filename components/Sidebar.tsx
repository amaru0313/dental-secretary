
import React, { useState, useEffect } from 'react';
import { NavConfigEntry, SubItemEntry } from '../types';
import { NAV_CONFIG, DEFAULT_APP_TITLE } from '../constants';
import { getIconForNavItem, CloseIcon } from './icons'; 

interface SidebarProps {
  activePageId: string;
  onNavigate: (pageId: string, pageTitle: string) => void;
  clinicName?: string;
  logoImage?: string;
  isSidebarOpen: boolean;
  toggleSidebar: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ activePageId, onNavigate, clinicName, logoImage, isSidebarOpen, toggleSidebar }) => {
  const [openParent, setOpenParent] = useState<string | null>(null);

  useEffect(() => {
    // Determine the initially open parent based on activePageId
    for (const item of NAV_CONFIG) {
        if (item.subItems && item.subItems.some(sub => sub.id === activePageId)) {
            setOpenParent(item.id);
            return; // Exit once found
        }
    }
    // If no sub-item is active, ensure no parent is marked as open unless it's a top-level page itself
    const activeTopLevel = NAV_CONFIG.find(item => item.id === activePageId);
    if (activeTopLevel && !activeTopLevel.subItems) { // It's a direct top-level link
        setOpenParent(null);
    } else if (!activeTopLevel) { // No active page found in nav (e.g. initial load before full state)
        setOpenParent(null);
    }
    // If activeTopLevel has subItems but none are active, openParent remains as determined or null
  }, [activePageId]);


  const handleParentClick = (parentId: string) => {
    setOpenParent(openParent === parentId ? null : parentId);
  };

  const handleSubItemClick = (subItem: SubItemEntry) => {
    onNavigate(subItem.id, subItem.pageTitle);
    if (window.innerWidth < 768) { 
        toggleSidebar(); 
    }
  };
  
  const handleTopLevelItemClick = (item: NavConfigEntry) => {
    if (item.pageTitle) { // It's a direct link
        onNavigate(item.id, item.pageTitle);
        setOpenParent(null); 
        if (window.innerWidth < 768) {
            toggleSidebar();
        }
    } else if (item.subItems) { // It's a parent group
        handleParentClick(item.id);
    }
  };


  const renderNavItem = (item: NavConfigEntry) => {
    const isParentCurrentlyOpen = openParent === item.id;
    // Is this item, or one of its children, the active page?
    const isSectionActive = item.subItems?.some(sub => sub.id === activePageId) ?? (activePageId === item.id && !!item.pageTitle);
    const isDirectlyActivePage = activePageId === item.id && !!item.pageTitle;


    if (item.subItems) { // Parent item with sub-items
      const iconClass = `w-5 h-5 mr-3 flex-shrink-0 transition-colors duration-150 ease-in-out ${
        isParentCurrentlyOpen || (isSectionActive && !isParentCurrentlyOpen) ? 'text-blue-600' : 'text-gray-400 group-hover:text-blue-500'
      }`;
      const textClass = `flex-1 text-left transition-colors duration-150 ease-in-out ${
        isParentCurrentlyOpen || (isSectionActive && !isParentCurrentlyOpen) ? 'text-blue-600 font-medium' : 'text-gray-700 group-hover:text-blue-600'
      }`;
      const arrowClass = `w-5 h-5 ml-auto transform transition-transform duration-150 ${
        isParentCurrentlyOpen ? 'rotate-90 text-blue-600' : (isSectionActive ? 'text-blue-500' : 'text-gray-400 group-hover:text-gray-500')
      }`;
      const buttonBgClass = isParentCurrentlyOpen ? 'bg-blue-50' : (isSectionActive ? 'bg-blue-50' : 'hover:bg-gray-100');


      return (
        <li key={item.id}>
          <button
            onClick={() => handleTopLevelItemClick(item)}
            className={`group w-full flex items-center px-3 py-2.5 text-sm rounded-md transition-colors duration-150 ease-in-out ${buttonBgClass}`}
          >
            {getIconForNavItem(item.iconId, iconClass)}
            <span className={textClass}>{item.name}</span>
            <svg className={arrowClass} fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
            </svg>
          </button>
          {isParentCurrentlyOpen && (
            <ul className="pl-6 mt-0.5 space-y-0.5"> {/* Reduced top margin slightly, increased left padding */}
              {item.subItems.map(subItem => {
                const isSubItemActive = activePageId === subItem.id;
                const subIconClass = `w-4 h-4 mr-2.5 flex-shrink-0 transition-colors duration-150 ease-in-out ${
                    isSubItemActive ? 'text-white' : 'text-gray-400 group-hover:text-blue-500'
                }`;
                const subLinkClass = `group flex items-center pl-3 pr-2 py-2 text-sm font-medium rounded-md transition-colors duration-150 ease-in-out ${
                    isSubItemActive ? 'bg-blue-600 text-white shadow-sm' : 'text-gray-600 hover:bg-gray-100 hover:text-blue-600'
                }`;
                return (
                    <li key={subItem.id}>
                    <a
                        href="#"
                        onClick={(e) => { e.preventDefault(); handleSubItemClick(subItem); }}
                        className={subLinkClass}
                    >
                        {getIconForNavItem(subItem.iconId, subIconClass)}
                        {subItem.name}
                    </a>
                    </li>
                );
            })}
            </ul>
          )}
        </li>
      );
    }

    // Standalone item (not a parent)
    const iconClass = `w-5 h-5 mr-3 flex-shrink-0 transition-colors duration-150 ease-in-out ${
        isDirectlyActivePage ? 'text-white' : 'text-gray-400 group-hover:text-blue-500'
    }`;
    const linkClass = `group flex items-center px-3 py-2.5 text-sm font-medium rounded-md transition-colors duration-150 ease-in-out ${
        isDirectlyActivePage ? 'bg-blue-600 text-white shadow-sm' : 'text-gray-700 hover:bg-gray-100 hover:text-blue-600'
    }`;

    return (
      <li key={item.id}>
        <a
          href="#"
          onClick={(e) => { e.preventDefault(); handleTopLevelItemClick(item);}}
          className={linkClass}
        >
          {getIconForNavItem(item.iconId, iconClass)}
          {item.name}
        </a>
      </li>
    );
  };
  
  return (
    <>
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 z-30 bg-black bg-opacity-30 md:hidden" 
          onClick={toggleSidebar}
          aria-hidden="true"
        ></div>
      )}

      <aside 
        className={`fixed inset-y-0 left-0 z-40 w-64 bg-white p-4 flex flex-col gap-6 transform transition-transform duration-300 ease-in-out md:translate-x-0 border-r border-gray-200
                   ${isSidebarOpen ? 'translate-x-0 shadow-xl md:shadow-none' : '-translate-x-full'}`}
      >
        <div className="flex items-center justify-between h-14"> 
          <div className="flex items-center">
            {logoImage ? (
                <img src={logoImage} alt="Clinic Logo" className="h-9 w-auto mr-2.5 rounded object-contain"/>
            ) : (
                <div className="h-9 w-9 bg-gray-200 rounded flex items-center justify-center text-lg font-bold mr-2.5 text-gray-600">
                    {(clinicName || DEFAULT_APP_TITLE).charAt(0)}
                </div>
            )}
            <span className="text-lg font-semibold truncate text-gray-800" title={clinicName || DEFAULT_APP_TITLE}>
                {clinicName || DEFAULT_APP_TITLE}
            </span>
          </div>
          <button onClick={toggleSidebar} className="md:hidden text-gray-500 hover:text-gray-700 p-1 rounded hover:bg-gray-100">
            <CloseIcon className="w-6 h-6" />
          </button>
        </div>
        
        <nav className="flex-1 overflow-y-auto custom-scrollbar"> 
          <ul className="space-y-0.5">
            {NAV_CONFIG.map(item => renderNavItem(item))}
          </ul>
        </nav>
      </aside>
    </>
  );
};

export default Sidebar;
