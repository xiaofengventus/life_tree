import JSZip from "jszip";

function createTextNode(text, children = []) {
  return {
    data: {
      text: String(text ?? "").trim(),
      expand: true,
    },
    children,
  };
}

function convertModernTopic(topic) {
  const children = Array.isArray(topic?.children?.attached)
    ? topic.children.attached.map(convertModernTopic)
    : [];
  return createTextNode(topic?.title, children);
}

function directChildrenByName(element, name) {
  return Array.from(element?.children || []).filter(
    (child) => child.localName === name,
  );
}

function convertLegacyTopic(topic) {
  const title = directChildrenByName(topic, "title")[0]?.textContent;
  const childrenContainer = directChildrenByName(topic, "children")[0];
  const attachedGroups = directChildrenByName(
    childrenContainer,
    "topics",
  ).filter(
    (group) =>
      !group.getAttribute("type") || group.getAttribute("type") === "attached",
  );
  const childTopics = attachedGroups.flatMap((group) =>
    directChildrenByName(group, "topic"),
  );
  return createTextNode(title, childTopics.map(convertLegacyTopic));
}

function parseLegacyContent(xml) {
  if (typeof DOMParser === "undefined") {
    throw new Error("当前环境不支持解析 XMind 8 XML");
  }
  const xmlDocument = new DOMParser().parseFromString(xml, "application/xml");
  if (xmlDocument.querySelector("parsererror")) {
    throw new Error("XMind 8 content.xml 内容损坏");
  }
  const sheet = Array.from(xmlDocument.documentElement.children).find(
    (element) => element.localName === "sheet",
  );
  const rootTopic = directChildrenByName(sheet, "topic")[0];
  if (!rootTopic) throw new Error("XMind 8 中没有可导入的主题");
  return convertLegacyTopic(rootTopic);
}

export async function parseXmindTextFile(file) {
  const zip = await JSZip.loadAsync(file);
  const modernFile = zip.file("content.json") || zip.file("/content.json");
  if (modernFile) {
    const sheets = JSON.parse(await modernFile.async("string"));
    const rootTopic = sheets?.[0]?.rootTopic;
    if (!rootTopic) throw new Error("XMind 中没有可导入的主题");
    return convertModernTopic(rootTopic);
  }

  const legacyFile = zip.file("content.xml") || zip.file("/content.xml");
  if (legacyFile) return parseLegacyContent(await legacyFile.async("string"));
  throw new Error("XMind 压缩包中缺少 content.json 或 content.xml");
}
