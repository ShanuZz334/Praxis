import React, { useState } from 'react';
import {
  ChevronRight,
  File as FileIcon,
  Folder as FolderIcon,
  FolderOpen as FolderOpenIcon,
} from 'lucide-react';

import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';

/**
 * Recursive FileTree Component
 *
 * @param {Object} props
 * @param {FileTreeItem} props.item
 * @param {number} props.level
 * @param {Function} props.onFileClick
 * @param {string} props.activeId - currently selected item ID to highlight
 * @param {Function} props.renderActions - optional function to render actions on hover
 */
export const FileTree = ({ item, level, onFileClick, activeId, renderActions }) => {
  if (item.type === 'file') {
    const Icon = item.icon || FileIcon;
    const isActive = activeId === item.id;
    
    return (
      <div
        onClick={() => onFileClick && onFileClick(item)}
        className={`text-muted-foreground flex items-center justify-between gap-2 rounded-md px-2 py-1.5 text-[13px] outline-none cursor-pointer transition-colors group ${
          isActive 
            ? 'bg-muted/60 text-foreground font-medium' 
            : 'hover:bg-muted/40 hover:text-foreground'
        }`}
        style={{ paddingLeft: `${level === 0 ? 0.75 : level * 1.5 + 0.75}rem` }}
      >
        <div className="flex items-center gap-2 overflow-hidden">
          <Icon className="size-4 shrink-0" />
          <span className="truncate">{item.name}</span>
        </div>
        {renderActions && (
          <div className="opacity-0 group-hover:opacity-100 flex items-center shrink-0 transition-opacity">
            {renderActions(item)}
          </div>
        )}
      </div>
    );
  }

  return <FolderTree item={item} level={level} onFileClick={onFileClick} activeId={activeId} renderActions={renderActions} />;
};

const FolderTree = ({ item, level, onFileClick, activeId, renderActions }) => {
  const [open, setOpen] = useState(false); // Default folders to closed
  const CustomIcon = item.icon;

  return (
    <Collapsible
      open={open}
      onOpenChange={setOpen}
      className="flex flex-col gap-0.5"
    >
      <CollapsibleTrigger 
        className="text-muted-foreground hover:bg-muted/40 hover:text-foreground flex items-center gap-2 rounded-md px-2 py-1.5 text-[13px] outline-none cursor-pointer transition-colors"
        style={{ paddingLeft: `${level === 0 ? 0 : level * 1.5}rem` }}
      >
        <ChevronRight
          className={`size-3.5 shrink-0 transition-transform ${open ? 'rotate-90' : ''}`}
        />
        {CustomIcon ? (
          <CustomIcon className="size-4 shrink-0" />
        ) : open ? (
          <FolderOpenIcon className="size-4 shrink-0" />
        ) : (
          <FolderIcon className="size-4 shrink-0" />
        )}
        <span className="font-medium truncate">{item.name}</span>
      </CollapsibleTrigger>
      
      <CollapsibleContent className="flex flex-col gap-0.5 mt-0.5">
        {item.children?.map((child, idx) => (
          <FileTree
            key={`${child.id || child.name}-${idx}`}
            item={child}
            level={level + 1}
            onFileClick={onFileClick}
            activeId={activeId}
            renderActions={renderActions}
          />
        ))}
      </CollapsibleContent>
    </Collapsible>
  );
};

export const FileTreeRoot = ({ data, onFileClick, activeId, renderActions }) => {
  return (
    <div className="flex w-full flex-col gap-1 py-2">
      {data.map((item, idx) => (
        <FileTree 
          key={`${item.id || item.name}-${idx}`} 
          item={item} 
          level={0} 
          onFileClick={onFileClick}
          activeId={activeId}
          renderActions={renderActions}
        />
      ))}
    </div>
  );
};
