import type { FilePublic } from "@/lib/types";

export interface TreeNode<TLeaf> {
  name: string;
  path: string;
  type: "folder" | "file";
  children: TreeNode<TLeaf>[];
  leaf?: TLeaf;
}

export function buildFileTree<TLeaf extends { path: string }>(items: TLeaf[]): TreeNode<TLeaf>[] {
  const root: TreeNode<TLeaf>[] = [];

  for (const item of items) {
    const segments = item.path.split("/").filter(Boolean);
    let currentLevel = root;
    let currentPath = "";

    segments.forEach((segment, index) => {
      currentPath = currentPath ? `${currentPath}/${segment}` : segment;
      const isFile = index === segments.length - 1;

      let node = currentLevel.find((n) => n.name === segment);
      if (!node) {
        node = {
          name: segment,
          path: currentPath,
          type: isFile ? "file" : "folder",
          children: [],
          leaf: isFile ? item : undefined,
        };
        currentLevel.push(node);
      }

      currentLevel = node.children;
    });
  }

  return root;
}

export function sortTree<TLeaf>(nodes: TreeNode<TLeaf>[]): TreeNode<TLeaf>[] {
  const sorted = [...nodes].sort((a, b) => {
    if (a.type !== b.type) return a.type === "folder" ? -1 : 1;
    return a.name.localeCompare(b.name);
  });

  for (const node of sorted) {
    node.children = sortTree(node.children);
  }

  return sorted;
}

export type FileTreeNode = TreeNode<FilePublic>;
