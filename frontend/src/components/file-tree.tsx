"use client";

import { useState } from "react";
import { ChevronRight, File, Folder } from "lucide-react";
import { sortTree, type FileTreeNode } from "@/lib/file-tree";

interface FileTreeProps {
  nodes: FileTreeNode[];
  selectedFileId: string | null;
  onSelectFile: (fileId: string) => void;
  depth?: number;
}

export function FileTree({ nodes, selectedFileId, onSelectFile, depth = 0 }: FileTreeProps) {
  const sorted = sortTree(nodes);

  return (
    <ul className="flex flex-col">
      {sorted.map((node) => (
        <FileTreeItem
          key={node.path}
          node={node}
          depth={depth}
          selectedFileId={selectedFileId}
          onSelectFile={onSelectFile}
        />
      ))}
    </ul>
  );
}

function FileTreeItem({
  node,
  depth,
  selectedFileId,
  onSelectFile,
}: {
  node: FileTreeNode;
  depth: number;
  selectedFileId: string | null;
  onSelectFile: (fileId: string) => void;
}) {
  const [expanded, setExpanded] = useState(depth < 1);
  const paddingLeft = depth * 14 + 8;

  if (node.type === "folder") {
    return (
      <li>
        <button
          onClick={() => setExpanded((v) => !v)}
          className="flex w-full cursor-pointer items-center gap-1.5 rounded py-1 text-sm text-muted hover:bg-surface"
          style={{ paddingLeft }}
        >
          <ChevronRight
            size={14}
            className={`shrink-0 transition-transform ${expanded ? "rotate-90" : ""}`}
          />
          <Folder size={14} className="shrink-0" />
          <span className="truncate">{node.name}</span>
        </button>
        {expanded && (
          <FileTree
            nodes={node.children}
            selectedFileId={selectedFileId}
            onSelectFile={onSelectFile}
            depth={depth + 1}
          />
        )}
      </li>
    );
  }

  const isSelected = node.leaf?.id === selectedFileId;

  return (
    <li>
      <button
        onClick={() => node.leaf && onSelectFile(node.leaf.id)}
        className={`flex w-full cursor-pointer items-center gap-1.5 rounded py-1 text-sm hover:bg-surface ${
          isSelected ? "bg-surface text-accent" : "text-foreground"
        }`}
        style={{ paddingLeft: paddingLeft + 18 }}
      >
        <File size={14} className="shrink-0" />
        <span className="truncate">{node.name}</span>
      </button>
    </li>
  );
}
