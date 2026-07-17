let nextNodeId = 1;

export function generateNodeId() {
  return `tree-node-${Date.now().toString(36)}-${nextNodeId++}`;
}

export function createNode(data = {}) {
  const name = normalizeName(data.name);
  return {
    id: data.id || generateNodeId(),
    name,
    url: String(data.url || ""),
    image: String(data.image || ""),
    children: Array.isArray(data.children)
      ? data.children.map((child) => createNode(child))
      : [],
    branchLength: Math.max(
      0,
      Number(data.branchLength ?? data.branch_length ?? 120),
    ),
    labelWidth: Math.max(
      56,
      Number(data.labelWidth ?? data.label_width ?? estimateNameWidth(name)),
    ),
    colors: {
      branch: data.colors?.branch || data.branch_color || "#202122",
      text: data.colors?.text || data.text_color || "#202122",
      clade: data.colors?.clade || data.clade_color || null,
    },
    collapsed: Boolean(data.collapsed ?? data.hide_children),
    freeBlocks: Array.isArray(data.freeBlocks)
      ? data.freeBlocks.map((block) => ({ ...block }))
      : [],
  };
}

export function estimateNameWidth(name) {
  const normalized = normalizeName(name);
  const lines = `${normalized.zh}${normalized.latin ? ` ${normalized.latin}` : ""}`.split(
    "\n",
  );
  return Math.min(
    420,
    Math.max(
      72,
      ...lines.map((line) =>
        Math.ceil(
          [...line].reduce(
            (width, character) =>
              width + (/^[\u0000-\u00ff]$/.test(character) ? 9 : 17),
            10,
          ),
        ),
      ),
    ),
  );
}

export function createInitialTree() {
  return createNode({
    name: { zh: "空白", latin: "" },
    branchLength: 0,
    labelWidth: 90,
  });
}

export function normalizeName(name) {
  if (name && typeof name === "object") {
    return {
      zh: String(name.zh || "").trim() || "空白",
      latin: String(name.latin || "").replace(/^[ \t]+/, ""),
    };
  }

  const value = String(name || "").trim();
  if (!value) return { zh: "空白", latin: "" };

  const match = value.match(/^(\S+)([\s\S]*)$/);
  return {
    zh: match?.[1] || "空白",
    latin: String(match?.[2] || "").replace(/^[ \t]+/, ""),
  };
}

export function nodeNameText(node) {
  const name = normalizeName(node?.name);
  if (!name.latin) return name.zh;
  return `${name.zh}${name.latin.startsWith("\n") ? "" : " "}${name.latin}`;
}

export function cloneTree(tree) {
  return JSON.parse(JSON.stringify(tree));
}

export function cloneNodeWithNewIds(node) {
  const copy = createNode({ ...cloneTree(node), id: undefined });
  walkTree(copy, (child) => {
    child.id = generateNodeId();
  });
  return copy;
}

export function walkTree(node, callback, parent = null) {
  if (!node) return;
  callback(node, parent);
  for (const child of node.children || []) {
    walkTree(child, callback, node);
  }
}

export function allNodes(root) {
  const nodes = [];
  walkTree(root, (node) => nodes.push(node));
  return nodes;
}

export function findNode(root, id) {
  let found = null;
  walkTree(root, (node) => {
    if (node.id === id) found = node;
  });
  return found;
}

export function findParent(root, id) {
  let found = null;
  walkTree(root, (node, parent) => {
    if (node.id === id) found = parent;
  });
  return found;
}

export function descendants(node) {
  const result = [];
  walkTree(node, (child) => {
    if (child !== node) result.push(child);
  });
  return result;
}

export function containsNode(root, id) {
  return Boolean(findNode(root, id));
}

export function selectedRootNodes(root, ids) {
  const selected = ids.map((id) => findNode(root, id)).filter(Boolean);
  return selected.filter(
    (node) =>
      !selected.some(
        (other) => other !== node && descendants(other).includes(node),
      ),
  );
}
