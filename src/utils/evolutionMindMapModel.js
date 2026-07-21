const SUPPORTED_LAYOUTS = new Set([
  "logicalStructure",
  "logicalStructureLeft",
  "mindMap",
  "organizationStructure",
  "catalogOrganization",
]);

export const XUR_FORMAT = "life-tree.xur";
export const XUR_VERSION = 3;

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

function createUid() {
  return `life-node-${Date.now().toString(36)}-${Math.random()
    .toString(36)
    .slice(2, 9)}`;
}

export function createMindMapNode(text = "新分类群", children = [], data = {}) {
  return {
    data: {
      uid: data.uid || createUid(),
      text: String(text || "新分类群"),
      expand: data.expand !== false,
      hyperlink: String(data.hyperlink || ""),
      hyperlinkTitle: String(data.hyperlinkTitle || ""),
      image: String(data.image || ""),
      imageTitle: String(data.imageTitle || ""),
      imageSize: data.image
        ? data.imageSize || { width: 180, height: 110, custom: false }
        : undefined,
      ...data,
    },
    children: Array.isArray(children) ? children : [],
  };
}

export function createInitialMindMapDocument() {
  return {
    layout: "logicalStructure",
    evolution: {
      nodeLineStyle: true,
      hideInternalNames: false,
      alignLeavesRight: false,
    },
    root: createMindMapNode("生命共同祖先", [], {
      fillColor: "#ffffff",
      color: "#000000",
      borderColor: "#ffffff",
      borderWidth: 0,
      fontSize: 20,
      fontWeight: "bold",
      shape: "roundedRectangle",
    }),
    theme: {
      template: "default",
      config: createEvolutionTheme(),
    },
    view: null,
  };
}

export function createEvolutionTheme() {
  return {
    backgroundColor: "#ffffff",
    lineColor: "#000000",
    lineWidth: 2,
    lineStyle: "straight",
    lineRadius: 0,
    nodeUseLineStyle: true,
    hoverRectColor: "#4b5563",
    root: {
      shape: "rectangle",
      fillColor: "#ffffff",
      color: "#000000",
      borderColor: "#ffffff",
      borderWidth: 0,
      borderRadius: 0,
      fontFamily: '"Noto Sans SC", "Microsoft YaHei", sans-serif',
      fontSize: 20,
      fontWeight: "bold",
      marginX: 90,
      marginY: 28,
      paddingX: 20,
      paddingY: 10,
    },
    second: {
      shape: "rectangle",
      fillColor: "#ffffff",
      color: "#000000",
      borderColor: "#ffffff",
      borderWidth: 0,
      borderRadius: 0,
      fontFamily: '"Noto Sans SC", "Microsoft YaHei", sans-serif',
      fontSize: 17,
      fontWeight: "bold",
      marginX: 86,
      marginY: 22,
      paddingX: 14,
      paddingY: 7,
    },
    node: {
      shape: "rectangle",
      fillColor: "#ffffff",
      color: "#000000",
      borderColor: "#ffffff",
      borderWidth: 0,
      borderRadius: 0,
      fontFamily: '"Noto Sans SC", "Microsoft YaHei", sans-serif',
      fontSize: 15,
      marginX: 62,
      marginY: 12,
      paddingX: 12,
      paddingY: 6,
    },
  };
}

function assertNode(node, path = "root") {
  if (!node || typeof node !== "object" || !node.data) {
    throw new Error(`${path} 不是有效的 mind-map 节点`);
  }
  if (typeof node.data.text !== "string") {
    throw new Error(`${path}.data.text 必须是字符串`);
  }
  if (!Array.isArray(node.children)) {
    throw new Error(`${path}.children 必须是数组`);
  }
  node.children.forEach((child, index) =>
    assertNode(child, `${path}.children[${index}]`),
  );
}

export function normalizeMindMapDocument(value) {
  const source = value?.format === XUR_FORMAT ? value.document : value;
  if (!source?.root || !source.root.data) {
    throw new Error("仅支持新版 life-tree.xur 或 simple-mind-map 完整文档");
  }

  const document = clone(source);
  assertNode(document.root);
  document.layout = SUPPORTED_LAYOUTS.has(document.layout)
    ? document.layout
    : "logicalStructure";
  const defaultTheme = createEvolutionTheme();
  const savedTheme = document.theme?.config || {};
  document.theme = {
    template: document.theme?.template || "default",
    config: {
      ...defaultTheme,
      ...savedTheme,
      backgroundColor: "#ffffff",
      lineColor: "#000000",
      lineStyle: "straight",
      lineRadius: 0,
      root: {
        ...defaultTheme.root,
        ...savedTheme.root,
        shape: "rectangle",
        fillColor: "#ffffff",
        color: "#000000",
        borderColor: "#ffffff",
        borderWidth: 0,
        borderRadius: 0,
      },
      second: {
        ...defaultTheme.second,
        ...savedTheme.second,
        shape: "rectangle",
        fillColor: "#ffffff",
        color: "#000000",
        borderColor: "#ffffff",
        borderWidth: 0,
        borderRadius: 0,
      },
      node: {
        ...defaultTheme.node,
        ...savedTheme.node,
        shape: "rectangle",
        fillColor: "#ffffff",
        color: "#000000",
        borderColor: "#ffffff",
        borderWidth: 0,
        borderRadius: 0,
      },
    },
  };
  document.evolution = {
    nodeLineStyle: document.evolution?.nodeLineStyle !== false,
    hideInternalNames: Boolean(document.evolution?.hideInternalNames),
    alignLeavesRight: Boolean(document.evolution?.alignLeavesRight),
  };
  document.theme.config.nodeUseLineStyle = document.evolution.nodeLineStyle;
  document.view ||= null;
  return document;
}

export function createXurFile(document) {
  return {
    format: XUR_FORMAT,
    version: XUR_VERSION,
    engine: "simple-mind-map",
    exportedAt: new Date().toISOString(),
    document: normalizeMindMapDocument(document),
  };
}

export function countMindMapNodes(root) {
  if (!root) return 0;
  return (
    1 +
    (root.children || []).reduce(
      (sum, child) => sum + countMindMapNodes(child),
      0,
    )
  );
}
