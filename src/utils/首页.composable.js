import { ref, onMounted, onUnmounted, nextTick } from "vue";
import { EvolutionTree } from "./EvolutionTree.js";

export function useEvolutionTree() {
  const canvasRef = ref(null);
  const containerRef = ref(null);
  const labelLayerRef = ref(null);
  const tooltipRef = ref(null);
  const fileInputRef = ref(null);
  const colorPickerRef = ref(null);

  const selectedInfo = ref("未选中任何节点");
  const editName = ref("");
  const showUserCard = ref(false);

  const layoutMode = ref("rectangular");
  const alignRight = ref(false);
  const hideInternalNames = ref(false);
  const nodeSpacing = ref(42);
  const autoBranchLength = ref(true);
  const labelWrapLines = ref(2);
  const labelPositionMode = ref("above");
  const branchLength = ref(120);
  const hideChildren = ref(false);

  let evolutionTree = null;

  const handleAvatarClick = () => {
    showUserCard.value = !showUserCard.value;
  };

  const handleDocumentClick = (e) => {
    const card = document.querySelector(".user-card");
    const avatar = document.querySelector(".user-avatar");
    if (card && avatar && !card.contains(e.target) && e.target !== avatar) {
      showUserCard.value = false;
    }
  };

  const handleKeydown = (e) => {
    if (e.key === "Escape" && showUserCard.value) {
      showUserCard.value = false;
    }
  };

  const onLayoutChange = (e) => {
    if (evolutionTree) {
      evolutionTree.push_undo();
      evolutionTree.layout_mode = e.target.value;
      evolutionTree.redraw_tree();
    }
  };

  const onAlignChange = (e) => {
    if (evolutionTree) {
      evolutionTree.push_undo();
      evolutionTree.align_right = e.target.checked;
      evolutionTree.redraw_tree();
    }
  };

  const onHideInternalChange = (e) => {
    if (evolutionTree) {
      evolutionTree.push_undo();
      evolutionTree.hide_internal_names = e.target.checked;
      evolutionTree.redraw_tree();
    }
  };

  const onSpacingChange = (e) => {
    if (evolutionTree) {
      evolutionTree.push_undo();
      evolutionTree.node_spacing = parseInt(e.target.value);
      evolutionTree.redraw_tree();
    }
  };

  const onAutoLengthChange = (e) => {
    if (evolutionTree) {
      evolutionTree.push_undo();
      evolutionTree.auto_branch_length = e.target.checked;
      evolutionTree.redraw_tree();
    }
  };

  const onWrapLinesChange = (e) => {
    if (evolutionTree) {
      evolutionTree.push_undo();
      evolutionTree.label_wrap_lines = parseInt(e.target.value);
      evolutionTree.redraw_tree();
    }
  };

  const onLabelPositionChange = (e) => {
    if (evolutionTree) {
      evolutionTree.push_undo();
      evolutionTree.label_position_mode = e.target.value;
      evolutionTree.redraw_tree();
    }
  };

  const onEditNameChange = () => {
    if (evolutionTree) {
      evolutionTree.rename_selected_node(editName.value.trim());
    }
  };

  const onBranchLengthChange = (e) => {
    if (evolutionTree) {
      evolutionTree.diy_change_length(parseInt(e.target.value));
    }
  };

  const onHideChildrenChange = (e) => {
    if (evolutionTree) {
      evolutionTree.diy_toggle_hide_children(e.target.checked ? 2 : 0);
    }
  };

  const handleSave = () => {
    if (evolutionTree) {
      evolutionTree.save_tree_file();
    }
  };

  const handleOpen = () => {
    fileInputRef.value.click();
  };

  const handleFileChange = (e) => {
    if (evolutionTree) {
      evolutionTree.open_tree_file(e);
    }
  };

  const handleReset = () => {
    if (evolutionTree) {
      evolutionTree.reset_to_single_node();
    }
  };

  const handleAdd = () => {
    if (evolutionTree) {
      evolutionTree.diy_add_node();
    }
  };

  const handleAddBlank = () => {
    if (evolutionTree) {
      evolutionTree.diy_add_blank_node();
    }
  };

  const handleDelete = () => {
    if (evolutionTree) {
      evolutionTree.delete_nodes();
    }
  };

  const handleColor = () => {
    if (evolutionTree) {
      evolutionTree.diy_change_color();
    }
  };

  const handleTextColor = () => {
    if (evolutionTree) {
      evolutionTree.diy_change_text_color();
    }
  };

  const handleSubtreeColor = () => {
    if (evolutionTree) {
      evolutionTree.diy_change_subtree_color();
    }
  };

  const handleCladeColor = () => {
    if (evolutionTree) {
      evolutionTree.diy_change_clade_color();
    }
  };

  const handleExport = () => {
    if (evolutionTree) {
      evolutionTree.export_pdf();
    }
  };

  const handleClearClade = () => {
    if (evolutionTree) {
      evolutionTree.diy_clear_clade_color();
    }
  };

  const handleColorPickerChange = (e) => {
    if (evolutionTree && evolutionTree.color_callback) {
      evolutionTree.color_callback(e.target.value);
    }
  };

  onMounted(() => {
    setTimeout(() => {
      if (canvasRef.value && containerRef.value) {
        evolutionTree = new EvolutionTree(
          canvasRef.value,
          containerRef.value,
          (info) => (selectedInfo.value = info),
          (name) => (editName.value = name),
          (length) => (branchLength.value = length),
          (hide) => (hideChildren.value = hide),
          colorPickerRef.value,
          labelLayerRef.value,
          { mode: "diy" },
        );
      }
    }, 100);

    document.addEventListener("click", handleDocumentClick);
    document.addEventListener("keydown", handleKeydown);
  });

  onUnmounted(() => {
    document.removeEventListener("click", handleDocumentClick);
    document.removeEventListener("keydown", handleKeydown);
  });

  return {
    canvasRef,
    containerRef,
    labelLayerRef,
    tooltipRef,
    fileInputRef,
    colorPickerRef,
    selectedInfo,
    editName,
    showUserCard,
    layoutMode,
    alignRight,
    hideInternalNames,
    nodeSpacing,
    autoBranchLength,
    labelWrapLines,
    labelPositionMode,
    branchLength,
    hideChildren,
    handleAvatarClick,
    handleDocumentClick,
    handleKeydown,
    onLayoutChange,
    onAlignChange,
    onHideInternalChange,
    onSpacingChange,
    onAutoLengthChange,
    onWrapLinesChange,
    onLabelPositionChange,
    onEditNameChange,
    onBranchLengthChange,
    onHideChildrenChange,
    handleSave,
    handleOpen,
    handleFileChange,
    handleReset,
    handleAdd,
    handleAddBlank,
    handleDelete,
    handleColor,
    handleTextColor,
    handleSubtreeColor,
    handleCladeColor,
    handleExport,
    handleClearClade,
    handleColorPickerChange,
  };
}
