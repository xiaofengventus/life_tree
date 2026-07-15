import { nextTick, onMounted, ref } from "vue";
import { EvolutionTree } from "../utils/EvolutionTree.js";

export function useCommunicationTree() {
  const canvasRef = ref(null);
  const containerRef = ref(null);
  const labelLayerRef = ref(null);
  const tooltipRef = ref(null);
  const selectedInfo = ref("点击文字标签可以打开介绍页面");
  const loading = ref(true);
  const errorMessage = ref("");

  let evolutionTree = null;

  async function loadTree() {
    loading.value = true;
    errorMessage.value = "";

    try {
      const response = await fetch("/trees/communication-tree.json", {
        cache: "no-cache",
      });
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const data = await response.json();
      evolutionTree.apply_state(data);
      selectedInfo.value = "共创树已加载：点击带链接的标签跳转介绍页";
    } catch (error) {
      console.error(error);
      errorMessage.value = "共创树文件读取失败，请检查 public/trees/communication-tree.json";
    } finally {
      loading.value = false;
    }
  }

  function openNodePage(node) {
    if (!node?.url) return;
    window.open(node.url, "_blank", "noopener,noreferrer");
  }

  onMounted(() => {
    nextTick(() => {
      if (!canvasRef.value || !containerRef.value) return;

      evolutionTree = new EvolutionTree(
        canvasRef.value,
        containerRef.value,
        (info) => (selectedInfo.value = info),
        () => {},
        () => {},
        () => {},
        null,
        labelLayerRef.value,
        {
          mode: "read",
          onLabelClick: openNodePage,
        },
      );

      loadTree();
    });
  });

  return {
    canvasRef,
    containerRef,
    labelLayerRef,
    tooltipRef,
    selectedInfo,
    loading,
    errorMessage,
    loadTree,
  };
}
