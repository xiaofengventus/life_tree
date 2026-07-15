export class TreeNode {
  constructor(
    name,
    branch_length = 120,
    branch_color = "#7EC8E3",
    text_color = "#111827",
  ) {
    this.id = TreeNode.next_id++;
    this.name = name;
    this.branch_length = branch_length;
    this.branch_color = branch_color;
    this.text_color = text_color;
    this.color = branch_color;
    this.clade_color = null;
    this.children = [];
    this.parent = null;
    this.hide_children = false;
    this.computed_x = 0;
    this.computed_y = 0;
    this.manual_dx = 0;
    this.manual_dy = 0;
    this.angle = 0;
    this.radius = 0;
    this.leaf_span = [0, 0];
    this.url = "";
    this.label_width = null;
  }

  add_child(child_node) {
    if (child_node === this || this.is_descendant_of(child_node)) {
      return false;
    }
    if (
      child_node.parent !== null &&
      child_node.parent.children.includes(child_node)
    ) {
      child_node.parent.children.splice(
        child_node.parent.children.indexOf(child_node),
        1,
      );
    }
    child_node.parent = this;
    this.children.push(child_node);
    return true;
  }

  is_descendant_of(possible_parent) {
    let node = this.parent;
    while (node !== null) {
      if (node === possible_parent) {
        return true;
      }
      node = node.parent;
    }
    return false;
  }

  is_visible_leaf() {
    return this.children.length === 0 || this.hide_children;
  }

  is_visible() {
    let node = this;
    while (node.parent) {
      if (node.parent.hide_children) return false;
      node = node.parent;
    }
    return true;
  }

  descendants() {
    const nodes = [this];
    for (const child of this.children) {
      nodes.push(...child.descendants());
    }
    return nodes;
  }

  traverse(callback) {
    callback(this);
    for (const child of this.children) {
      child.traverse(callback);
    }
  }
}

TreeNode.next_id = 1;

export class EvolutionTree {
  constructor(
    canvas,
    container,
    updateSelectedInfo,
    updateEditName,
    updateBranchLength,
    updateHideChildren,
    colorPickerRef,
    labelLayer = null,
    options = {},
  ) {
    this.canvas = canvas;
    this.ctx = this.canvas.getContext("2d");
    this.container = container;
    this.updateSelectedInfo = updateSelectedInfo;
    this.updateEditName = updateEditName;
    this.updateBranchLength = updateBranchLength;
    this.updateHideChildren = updateHideChildren;
    this.colorPickerRef = colorPickerRef;
    this.labelLayer = labelLayer;
    this.mode = options.mode || "diy";
    this.onLabelClick = options.onLabelClick || null;

    this.root = new TreeNode("LUCA", 0);

    this.selected_node = null;
    this.selected_nodes = new Set();
    this.is_box_selecting = false;
    this.box_select_start = null;
    this.box_select_end = null;
    this.align_right = false;
    this.hide_internal_names = false;
    this.layout_mode = "rectangular";
    this.node_spacing = 42;
    this.branch_gap = 14;
    this.auto_branch_length = true;
    this.label_wrap_lines = 2;
    this.label_position_mode = "above";
    this.label_font_size = 10;

    this.undo_stack = [];
    this.is_restoring = false;
    this.drag_roots = [];
    this.drag_delta = { x: 0, y: 0 };
    this.drop_hint_node = null;
    this.active_name_editor = null;
    this.leaf_counter = 0;
    this.max_tree_x = 0;
    this.align_right_x = 0;
    this.scene_center = { x: 5, y: 5 };
    this.radial_max_radius = 360;

    this.pan_offset = { x: 0, y: 0 };
    this.zoom = 1;
    this.is_panning = false;
    this.last_mouse_pos = { x: 0, y: 0 };

    this.last_click_time = 0;
    this.last_click_node = null;

    this.node_graphics = {};
    this.node_items = {};
    this.dom_label_records = [];

    this.init_canvas();
    this.redraw_tree();
  }

  init_canvas() {
    const resize = () => {
      const width = this.container.clientWidth;
      const height = this.container.clientHeight;
      if (width > 0 && height > 0) {
        this.canvas.width = width;
        this.canvas.height = height;
        this.redraw_tree();
      }
    };
    window.addEventListener("resize", resize);
    resize();
    setTimeout(resize, 200);
    setTimeout(resize, 500);

    this.canvas.addEventListener("mousedown", this.handle_mousedown.bind(this));
    this.canvas.addEventListener("mousemove", this.handle_mousemove.bind(this));
    this.canvas.addEventListener("mouseup", this.handle_mouseup.bind(this));
    this.canvas.addEventListener("wheel", this.handle_wheel.bind(this), {
      passive: false,
    });
    this.canvas.addEventListener("dblclick", this.handle_dblclick.bind(this));
    this.canvas.addEventListener(
      "contextmenu",
      this.handle_contextmenu.bind(this),
    );

    document.addEventListener("keydown", this.handle_keydown.bind(this));
  }

  screen_to_canvas(screen_x, screen_y) {
    const rect = this.canvas.getBoundingClientRect();
    return {
      x: (screen_x - rect.left - this.pan_offset.x) / this.zoom,
      y: (screen_y - rect.top - this.pan_offset.y) / this.zoom,
    };
  }

  canvas_to_screen(canvas_x, canvas_y) {
    const rect = this.canvas.getBoundingClientRect();
    return {
      x: canvas_x * this.zoom + this.pan_offset.x + rect.left,
      y: canvas_y * this.zoom + this.pan_offset.y + rect.top,
    };
  }

  handle_mousedown(e) {
    if (e.button === 0 && this.active_name_editor) return;

    const pos = this.screen_to_canvas(e.clientX, e.clientY);
    const node = this.node_at(pos);

    if (this.mode === "read") {
      if (e.button === 0) {
        if (node) {
          this.select_node(node);
        } else {
          this.select_node(null);
          this.is_panning = true;
          this.last_mouse_pos = { x: e.clientX, y: e.clientY };
        }
      }
      return;
    }

    if (e.button === 0) {
      if (!node) {
        if (e.shiftKey || e.ctrlKey || e.metaKey) {
          return;
        }
        this.is_box_selecting = true;
        this.box_select_start = { x: e.clientX, y: e.clientY };
        this.box_select_end = { x: e.clientX, y: e.clientY };
      } else {
        const additive = e.shiftKey || e.ctrlKey || e.metaKey;
        const preserve_existing =
          !additive &&
          this.selected_nodes.has(node) &&
          this.selected_nodes.size > 1;
        this.select_node(node, true, additive, preserve_existing);
        if (additive) {
          return;
        }
        if (node === this.root) {
          this.is_panning = true;
          this.last_mouse_pos = { x: e.clientX, y: e.clientY };
          return;
        }
        this.start_drag(node, e);
      }
    } else if (e.button === 2) {
      if (node) {
        this.select_node(node);
      }
    }
  }

  handle_mousemove(e) {
    if (this.active_name_editor) return;

    const pos = this.screen_to_canvas(e.clientX, e.clientY);

    if (this.is_box_selecting) {
      this.box_select_end = { x: e.clientX, y: e.clientY };
      this.draw_box_select();
      return;
    }

    if (this.is_panning) {
      this.pan_offset.x += e.clientX - this.last_mouse_pos.x;
      this.pan_offset.y += e.clientY - this.last_mouse_pos.y;
      this.last_mouse_pos = { x: e.clientX, y: e.clientY };
      this.redraw_tree();
      return;
    }

    if (this.is_dragging) {
      const delta_x = pos.x - this.drag_start.x;
      const delta_y = pos.y - this.drag_start.y;

      if (Math.abs(delta_x) > 4 || Math.abs(delta_y) > 4) {
        this.dragging = true;
        this.move_drag_preview(this.dragged_node, {
          x: delta_x - this.drag_delta.x,
          y: delta_y - this.drag_delta.y,
        });
        this.drag_delta = { x: delta_x, y: delta_y };
        this.update_drop_hint(pos, this.dragged_node);
      }
      return;
    }

    const node = this.node_at(pos);
    if (this.mode === "read") {
      this.canvas.style.cursor = node ? "pointer" : "grab";
      return;
    }
    if (node) {
      this.canvas.style.cursor = node === this.root ? "grab" : "pointer";
      this.hover_node(node);
    } else {
      this.canvas.style.cursor = "crosshair";
    }
  }

  handle_mouseup(e) {
    if (this.is_box_selecting) {
      this.finish_box_select();
      return;
    }

    if (this.is_panning) {
      this.is_panning = false;
      return;
    }

    if (this.dragging) {
      const pos = this.screen_to_canvas(e.clientX, e.clientY);
      const target = this.node_at(
        pos,
        this.preview_nodes_for_drag(this.dragged_node),
      );
      this.finish_node_drag(this.dragged_node, target);
    }

    this.is_dragging = false;
    this.dragged_node = null;
    this.drag_start = null;
    this.clear_drop_hint();
  }

  handle_wheel(e) {
    e.preventDefault();
    const rect = this.canvas.getBoundingClientRect();
    const mouse_x = e.clientX - rect.left;
    const mouse_y = e.clientY - rect.top;

    const old_x = (mouse_x - this.pan_offset.x) / this.zoom;
    const old_y = (mouse_y - this.pan_offset.y) / this.zoom;

    const factor = e.deltaY > 0 ? 0.85 : 1.15;
    this.zoom = Math.max(0.25, Math.min(4, this.zoom * factor));

    this.pan_offset.x = mouse_x - old_x * this.zoom;
    this.pan_offset.y = mouse_y - old_y * this.zoom;

    this.redraw_tree();
  }

  handle_dblclick(e) {
    const pos = this.screen_to_canvas(e.clientX, e.clientY);
    const node = this.node_at(pos);
    if (node) {
      this.edit_node_name(node);
    }
  }

  handle_contextmenu(e) {
    e.preventDefault();
    const pos = this.screen_to_canvas(e.clientX, e.clientY);
    const node = this.node_at(pos);
    if (node) {
      this.show_context_menu(node, e.clientX, e.clientY);
    }
  }

  handle_keydown(e) {
    if (this.mode === "read") return;

    const target = e.target;
    const isEditing =
      target.classList?.contains("is-editing") ||
      target.contentEditable === "true" ||
      target.closest?.(".is-editing");

    if (isEditing) return;

    if (e.key === "z" && (e.ctrlKey || e.metaKey)) {
      e.preventDefault();
      this.undo();
    }
    if (
      this.selected_node &&
      (e.key === "Delete" || e.key === "Backspace") &&
      !this.active_name_editor
    ) {
      e.preventDefault();
      this.delete_nodes();
    }
    if (e.key === "c" && (e.ctrlKey || e.metaKey)) {
      e.preventDefault();
      this.copy_selected_subtrees();
    }
    if (e.key === "v" && (e.ctrlKey || e.metaKey)) {
      e.preventDefault();
      this.paste_from_clipboard();
    }
  }

  start_drag(node, e) {
    this.is_dragging = true;
    this.dragged_node = node;
    this.drag_start = this.screen_to_canvas(e.clientX, e.clientY);
    this.drag_delta = { x: 0, y: 0 };
    this.dragging = false;
  }

  visible_children(node) {
    return node.hide_children ? [] : node.children;
  }

  all_nodes(node = null) {
    node = node || this.root;
    const nodes = [node];
    for (const child of node.children) {
      nodes.push(...this.all_nodes(child));
    }
    return nodes;
  }

  visible_leaves(node) {
    if (node.is_visible_leaf()) {
      return [node];
    }
    const leaves = [];
    for (const child of node.children) {
      leaves.push(...this.visible_leaves(child));
    }
    return leaves;
  }

  draw_box_select() {
    this.redraw_tree();
    const start = this.box_select_start;
    const end = this.box_select_end;
    const rect = this.canvas.getBoundingClientRect();

    const x = Math.min(start.x, end.x) - rect.left;
    const y = Math.min(start.y, end.y) - rect.top;
    const width = Math.abs(end.x - start.x);
    const height = Math.abs(end.y - start.y);

    this.ctx.strokeStyle = "#4A90E2";
    this.ctx.fillStyle = "rgba(74, 144, 226, 0.15)";
    this.ctx.lineWidth = 2;
    this.ctx.setLineDash([4, 4]);

    this.ctx.beginPath();
    this.ctx.rect(x, y, width, height);
    this.ctx.fill();
    this.ctx.stroke();
    this.ctx.setLineDash([]);
  }

  finish_box_select() {
    const start = this.box_select_start;
    const end = this.box_select_end;
    const width = Math.abs(end.x - start.x);
    const height = Math.abs(end.y - start.y);

    if (width > 5 && height > 5) {
      const min_x = Math.min(start.x, end.x);
      const max_x = Math.max(start.x, end.x);
      const min_y = Math.min(start.y, end.y);
      const max_y = Math.max(start.y, end.y);

      const new_selected = new Set();
      this.root.traverse((node) => {
        if (node.is_visible()) {
          const screen_pos = this.canvas_to_screen(
            node.computed_x,
            node.computed_y,
          );
          if (
            screen_pos.x >= min_x &&
            screen_pos.x <= max_x &&
            screen_pos.y >= min_y &&
            screen_pos.y <= max_y
          ) {
            new_selected.add(node);
          }
        }
      });

      if (new_selected.size > 0) {
        this.selected_nodes = new_selected;
        this.selected_node = Array.from(new_selected)[0];
      } else {
        this.select_node(null);
      }
    } else {
      this.select_node(null);
    }

    this.is_box_selecting = false;
    this.box_select_start = null;
    this.box_select_end = null;
    this.redraw_tree();
  }

  descendant_leaf_count(node) {
    if (node.children.length === 0) {
      return 1;
    }
    return node.children.reduce(
      (sum, child) => sum + this.descendant_leaf_count(child),
      0,
    );
  }

  descendant_max_span(node) {
    if (node.children.length === 0) {
      return node.branch_length;
    }
    return (
      node.branch_length +
      Math.max(...node.children.map((child) => this.descendant_max_span(child)))
    );
  }

  redraw_tree() {
    this.close_active_name_editor(true);
    this.node_graphics = {};
    this.node_items = {};
    this.dom_label_records = [];
    this.max_tree_x = 0;
    this.get_max_depth(this.root, 50);

    if (this.align_right && this.layout_mode === "rectangular") {
      let branch_only_max_x = 0;
      const get_branch_depth = (node, current_x) => {
        const next_x = current_x + node.branch_length;
        branch_only_max_x = Math.max(branch_only_max_x, next_x);
        if (!node.hide_children) {
          for (const child of node.children) {
            get_branch_depth(child, next_x + this.branch_gap);
          }
        }
      };
      get_branch_depth(this.root, 50);

      let max_label_width = 0;
      this.root.traverse((node) => {
        if (node.is_visible_leaf()) {
          const size = this.node_label_size(node);
          max_label_width = Math.max(max_label_width, size.width);
        }
      });

      this.align_right_x = Math.max(branch_only_max_x, this.max_tree_x) + 40;
      this.max_tree_x = this.align_right_x + max_label_width + 20;
    }

    this.ctx.setTransform(1, 0, 0, 1, 0, 0);
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

    this.ctx.save();
    this.ctx.translate(this.pan_offset.x, this.pan_offset.y);
    this.ctx.scale(this.zoom, this.zoom);

    if (this.layout_mode === "rectangular") {
      this.layout_rectangular();
      this.apply_manual_offsets(this.root);
      this.draw_rectangular_backgrounds(this.root);
      this.draw_rectangular_node(this.root, 50);
    } else {
      this.layout_radial();
      this.apply_manual_offsets(this.root);
      this.draw_radial_backgrounds(this.root);
      this.draw_radial_node(this.root);
    }

    if (this.drop_hint_node) {
      this.draw_drop_hint(this.drop_hint_node);
    }

    this.ctx.restore();
    this.render_dom_labels();
  }

  register_node_graphic(node, item) {
    if (!this.node_graphics[node.id]) {
      this.node_graphics[node.id] = [];
    }
    this.node_graphics[node.id].push(item);
  }

  wrap_text_lines(text) {
    text = (text || "").trim();
    if (!text) return [""];
    const max_lines = Math.max(1, this.label_wrap_lines);
    if (max_lines === 1) return [text];
    if (/^[A-Za-z0-9_\-./]+$/.test(text)) return [text];

    if (text.includes(" ")) {
      const words = text.split(" ");
      const target = Math.max(
        4,
        Math.ceil(words.reduce((sum, w) => sum + w.length, 0) / max_lines),
      );
      const lines = [];
      let current = [];
      let current_len = 0;

      for (const word of words) {
        const projected =
          current_len + word.length + (current.length > 0 ? 1 : 0);
        if (
          current.length > 0 &&
          projected > target &&
          lines.length < max_lines - 1
        ) {
          lines.push(current.join(" "));
          current = [word];
          current_len = word.length;
        } else {
          current.push(word);
          current_len = projected;
        }
      }
      if (current.length > 0) {
        lines.push(current.join(" "));
      }

      if (lines.length > max_lines) {
        const head = lines.slice(0, max_lines - 1);
        const tail = text.includes(" ")
          ? lines.slice(max_lines - 1).join(" ")
          : lines.slice(max_lines - 1).join("");
        return [...head, tail];
      }
      return lines;
    } else {
      const chunk = Math.max(1, Math.ceil(text.length / max_lines));
      return Array.from({ length: max_lines }, (_, i) =>
        text.slice(i * chunk, (i + 1) * chunk),
      ).filter((l) => l);
    }
  }

  classify_label(text) {
    text = (text || "").trim();
    if (!text) return { type: "empty", chinese: "", latin: "", extra: "" };

    const chineseMatch = text.match(/^[\u4e00-\u9fa5]+/);
    const restMatch = text.match(/[\u4e00-\u9fa5]+ (.+)$/);

    if (/^[\u4e00-\u9fa5]+$/.test(text)) {
      return { type: "chinese", chinese: text, latin: "", extra: "" };
    }

    if (/^[A-Za-z]+(?:\s+[A-Za-z]+)*$/.test(text)) {
      return { type: "latin", chinese: "", latin: text, extra: "" };
    }

    if (restMatch) {
      const rest = restMatch[1];
      const latinMatch = rest.match(/^([A-Za-z]+(?:\s+[A-Za-z]+)*)/);
      const extra = latinMatch
        ? rest.substring(latinMatch[0].length).trim()
        : "";
      return {
        type: "dual",
        chinese: chineseMatch ? chineseMatch[0] : "",
        latin: latinMatch ? latinMatch[0] : "",
        extra: extra,
      };
    }

    return { type: "other", chinese: "", latin: text, extra: "" };
  }

  node_label_lines(node) {
    const name = node.name || "";
    const classification = this.classify_label(name);

    if (classification.type === "dual") {
      const secondLine =
        classification.latin +
        (classification.extra ? " " + classification.extra : "");
      return [classification.chinese, secondLine];
    }

    if (classification.type === "chinese") {
      return [name];
    }

    if (classification.type === "latin") {
      return [name];
    }

    return [name];
  }

  node_label_text(node) {
    return this.node_label_lines(node).join("\n");
  }

  node_label_size(node) {
    const lines = this.node_label_lines(node);
    const classification = this.classify_label(node.name || "");
    let max_width = 0;

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      const isItalic =
        classification.type === "latin" ||
        (classification.type === "dual" && i === 1);
      this.ctx.font = `${isItalic ? "italic " : ""}${this.label_font_size}px Microsoft YaHei, sans-serif`;
      const width = this.ctx.measureText(line).width;
      max_width = Math.max(max_width, width);
    }

    const two_line_height = 2 * (this.label_font_size + 4);

    return {
      width: Math.max(max_width, two_line_height),
      height: two_line_height,
    };
  }

  effective_branch_length(node) {
    if (!this.auto_branch_length || this.layout_mode !== "rectangular") {
      return node.branch_length;
    }
    const padding = 18;
    const size = this.node_label_size(node);
    return Math.max(node.branch_length, Math.ceil(size.width + padding));
  }

  current_state() {
    return {
      version: 1,
      layout_mode: this.layout_mode,
      align_right: this.align_right,
      hide_internal_names: this.hide_internal_names,
      node_spacing: this.node_spacing,
      auto_branch_length: this.auto_branch_length,
      label_wrap_lines: this.label_wrap_lines,
      label_position_mode: this.label_position_mode,
      root: this.serialize_node(this.root),
    };
  }

  apply_state(data) {
    this.root = this.deserialize_node(data.root);
    this.layout_mode = data.layout_mode || "rectangular";
    this.align_right = !!data.align_right;
    this.hide_internal_names = !!data.hide_internal_names;
    this.node_spacing = parseInt(data.node_spacing || 42);
    this.auto_branch_length = !!data.auto_branch_length;
    this.label_wrap_lines = parseInt(data.label_wrap_lines || 2);
    this.label_position_mode = data.label_position_mode || "above";

    this.select_node(this.root);
  }

  push_undo() {
    if (this.is_restoring) return;
    this.undo_stack.push(JSON.parse(JSON.stringify(this.current_state())));
    if (this.undo_stack.length > 80) {
      this.undo_stack.shift();
    }
  }

  undo() {
    if (this.undo_stack.length === 0) return;
    const state = this.undo_stack.pop();
    this.is_restoring = true;
    try {
      this.apply_state(state);
    } finally {
      this.is_restoring = false;
    }
  }

  move_drag_preview(dragged_node, delta) {
    if (this.drag_roots.length === 0) {
      this.drag_roots = this.drag_roots_for(dragged_node);
      this.drag_delta = { x: 0, y: 0 };
    }
    this.drag_delta = {
      x: this.drag_delta.x + delta.x,
      y: this.drag_delta.y + delta.y,
    };
    const nodes = this.preview_nodes_for_drag(dragged_node);
    for (const node of nodes) {
      node.computed_x += delta.x;
      node.computed_y += delta.y;
    }
    this.redraw_tree();
  }

  drag_roots_for(dragged_node) {
    const roots =
      dragged_node instanceof TreeNode
        ? this.selected_nodes.has(dragged_node)
          ? Array.from(this.selected_nodes)
          : [dragged_node]
        : [];
    return roots.filter(
      (node) =>
        !roots.some((other) => other !== node && node.is_descendant_of(other)),
    );
  }

  preview_nodes_for_drag(dragged_node) {
    const roots =
      this.drag_roots.length > 0
        ? this.drag_roots
        : this.drag_roots_for(dragged_node);
    const nodes = [];
    for (const root of roots) {
      for (const node of root.descendants()) {
        if (!nodes.includes(node)) {
          nodes.push(node);
        }
      }
    }
    return nodes;
  }

  clear_drop_hint() {
    this.drop_hint_node = null;
  }

  update_drop_hint(scene_pos, dragged_node) {
    this.clear_drop_hint();
    const target = this.node_at(
      scene_pos,
      this.preview_nodes_for_drag(dragged_node),
    );
    if (target && this.can_accept_drop(dragged_node, target)) {
      this.drop_hint_node = target;
    }
  }

  can_accept_drop(dragged_node, new_parent) {
    const moving_nodes =
      this.drag_roots.length > 0
        ? this.drag_roots
        : this.drag_roots_for(dragged_node);
    if (!new_parent || moving_nodes.includes(new_parent)) {
      return false;
    }
    return !moving_nodes.some((node) => new_parent.is_descendant_of(node));
  }

  finish_node_drag(dragged_node, new_parent) {
    this.clear_drop_hint();
    const roots = (
      this.drag_roots.length > 0
        ? this.drag_roots
        : this.drag_roots_for(dragged_node)
    ).sort((a, b) => a.computed_y - b.computed_y);
    const delta = { x: this.drag_delta.x, y: this.drag_delta.y };
    const accepts_drop = this.can_accept_drop(dragged_node, new_parent);

    this.drag_roots = [];
    this.drag_delta = { x: 0, y: 0 };

    if (roots.length === 0) {
      this.redraw_tree();
      return;
    }

    this.push_undo();

    if (accepts_drop) {
      for (const node of roots) {
        if (node !== this.root) {
          new_parent.add_child(node);
          this.reset_subtree_manual_offsets(node);
        }
      }
      new_parent.hide_children = false;
    }

    this.selected_nodes = new Set(roots);
    this.selected_node = this.selected_nodes.has(dragged_node)
      ? dragged_node
      : roots[0];
    this.redraw_tree();
  }

  reset_subtree_manual_offsets(node) {
    for (const item of node.descendants()) {
      item.manual_dx = 0;
      item.manual_dy = 0;
    }
  }

  get_max_depth(node, current_x) {
    const next_x = current_x + this.effective_branch_length(node);
    this.max_tree_x = Math.max(this.max_tree_x, next_x);
    if (!node.hide_children) {
      for (const child of node.children) {
        this.get_max_depth(child, next_x + this.branch_gap);
      }
    }
  }

  layout_rectangular() {
    this.leaf_counter = 0;
    this.layout_rectangular_node(this.root, 50);
  }

  layout_rectangular_node(node, parent_x) {
    node.computed_x = parent_x + this.effective_branch_length(node);
    if (node.is_visible_leaf()) {
      this.leaf_counter++;
      node.computed_y = this.leaf_counter * this.node_spacing;
      node.leaf_span = [node.computed_y, node.computed_y];
      return;
    }

    for (const child of node.children) {
      this.layout_rectangular_node(child, node.computed_x + this.branch_gap);
    }
    const ys = node.children.map((child) => child.computed_y);
    node.computed_y = ys.reduce((a, b) => a + b, 0) / ys.length;
    node.leaf_span = [
      Math.min(...node.children.map((c) => c.leaf_span[0])),
      Math.max(...node.children.map((c) => c.leaf_span[1])),
    ];
  }

  apply_manual_offsets(node) {
    node.computed_x += node.manual_dx;
    node.computed_y += node.manual_dy;
    if (this.layout_mode === "rectangular" && node.parent) {
      const min_x = node.parent.computed_x + Math.max(24, this.branch_gap);
      if (node.computed_x < min_x) {
        node.computed_x = min_x;
      }
    }
    if (!node.hide_children) {
      for (const child of node.children) {
        this.apply_manual_offsets(child);
      }
    }
  }

  layout_radial() {
    const leaves = this.visible_leaves(this.root);
    if (leaves.length === 0) return;

    const angle_margin = this.layout_mode === "radial" ? Math.PI / 10 : 0;
    const total_angle = Math.PI * 2 - angle_margin * 2;

    if (leaves.length === 1) {
      leaves[0].angle = 0;
    } else {
      leaves.forEach((leaf, index) => {
        leaf.angle = angle_margin + (total_angle * index) / leaves.length;
      });
    }

    const max_depth = Math.max(1, this.max_path_length(this.root, 0));
    this.radial_max_radius = Math.max(280, Math.min(560, max_depth + 90));
    this.scene_center = {
      x: this.canvas.width / this.zoom / 2 - this.pan_offset.x / this.zoom,
      y: this.canvas.height / this.zoom / 2 - this.pan_offset.y / this.zoom,
    };
    this.layout_radial_node(this.root, 0, max_depth);
  }

  max_path_length(node, current) {
    current += node.branch_length;
    if (node.is_visible_leaf()) return current;
    return Math.max(
      ...node.children.map((child) => this.max_path_length(child, current)),
    );
  }

  layout_radial_node(node, current_length, max_depth) {
    current_length += node.branch_length;
    node.radius =
      node === this.root
        ? 0
        : (current_length / max_depth) * this.radial_max_radius;

    if (!node.is_visible_leaf()) {
      for (const child of node.children) {
        this.layout_radial_node(child, current_length, max_depth);
      }
      node.angle = this.mean_angle(node.children.map((c) => c.angle));
    }

    const point = this.polar_to_point(node.angle, node.radius);
    node.computed_x = point.x;
    node.computed_y = point.y;
  }

  mean_angle(angles) {
    const x = angles.reduce((sum, a) => sum + Math.cos(a), 0);
    const y = angles.reduce((sum, a) => sum + Math.sin(a), 0);
    return Math.atan2(y, x);
  }

  polar_to_point(angle, radius) {
    return {
      x: this.scene_center.x + Math.cos(angle) * radius,
      y: this.scene_center.y + Math.sin(angle) * radius,
    };
  }

  angle_between(start, end) {
    while (end < start) end += Math.PI * 2;
    return [start, end];
  }

  draw_rectangular_backgrounds(node) {
    if (node.clade_color) {
      this.draw_rectangular_clade_background(node);
    }
    if (!node.hide_children) {
      for (const child of node.children) {
        this.draw_rectangular_backgrounds(child);
      }
    }
  }

  draw_rectangular_clade_background(node) {
    const leaves = this.visible_leaves(node);
    if (leaves.length === 0) return;

    const y_min = Math.min(...leaves.map((l) => l.computed_y)) - 24;
    const y_max = Math.max(...leaves.map((l) => l.computed_y)) + 24;
    const x_min = node.computed_x - 8;
    const x_max = Math.max(...leaves.map((l) => l.computed_x)) + 120;

    this.ctx.fillStyle = this.hex_to_rgba(node.clade_color, 0.21);
    this.ctx.fillRect(x_min, y_min, x_max - x_min, y_max - y_min);
  }

  draw_radial_backgrounds(node) {
    if (node.clade_color) {
      this.draw_radial_clade_background(node);
    }
    if (!node.hide_children) {
      for (const child of node.children) {
        this.draw_radial_backgrounds(child);
      }
    }
  }

  draw_radial_clade_background(node) {
    const leaves = this.visible_leaves(node);
    if (leaves.length === 0) return;

    const angles = leaves
      .map((l) => l.angle % (Math.PI * 2))
      .sort((a, b) => a - b);
    let start = angles[0] - Math.PI / 45;
    let end = angles[angles.length - 1] + Math.PI / 45;

    if (angles.length > 1 && end - start > Math.PI) {
      const gaps = [];
      const circular_angles = [...angles, angles[0] + Math.PI * 2];
      for (let i = 0; i < angles.length; i++) {
        gaps.push([circular_angles[i + 1] - circular_angles[i], i]);
      }
      gaps.sort((a, b) => b[0] - a[0]);
      const gap_index = gaps[0][1];
      start = circular_angles[gap_index + 1] - Math.PI / 45;
      end = circular_angles[gap_index] + Math.PI * 2 + Math.PI / 45;
    }

    [start, end] = this.angle_between(start, end);

    const inner = Math.max(0, node.radius - 18);
    const outer = Math.max(120, Math.max(...leaves.map((l) => l.radius)) + 72);

    this.ctx.beginPath();
    const first_outer = this.polar_to_point(start, outer);
    this.ctx.moveTo(first_outer.x, first_outer.y);

    const steps = Math.max(8, Math.floor((end - start) / (Math.PI / 45)));
    for (let i = 1; i <= steps; i++) {
      const angle = start + ((end - start) * i) / steps;
      const p = this.polar_to_point(angle, outer);
      this.ctx.lineTo(p.x, p.y);
    }
    for (let i = steps; i >= 0; i--) {
      const angle = start + ((end - start) * i) / steps;
      const p = this.polar_to_point(angle, inner);
      this.ctx.lineTo(p.x, p.y);
    }
    this.ctx.closePath();

    this.ctx.fillStyle = this.hex_to_rgba(node.clade_color, 0.23);
    this.ctx.fill();
  }

  draw_rectangular_node(node, parent_x) {
    const true_x = node.computed_x;
    const current_y = node.computed_y;
    let label_x = true_x + 8;

    const pen = this.node_pen(node);
    this.draw_branch_line(node, parent_x, current_y, true_x, current_y, pen);

    if (this.align_right && node.is_visible_leaf()) {
      if (true_x < this.align_right_x) {
        this.ctx.strokeStyle = "#AAB2BD";
        this.ctx.lineWidth = 1;
        this.ctx.setLineDash([4, 4]);
        this.ctx.beginPath();
        this.ctx.moveTo(true_x, current_y);
        this.ctx.lineTo(this.align_right_x, current_y);
        this.ctx.stroke();
        this.ctx.setLineDash([]);
      }

      label_x = this.align_right_x + 8;
    }

    if (node.hide_children && node.children.length > 0) {
      this.draw_collapsed_triangle_rect(node, true_x, current_y);
    } else if (node.children.length > 0) {
      const child_y_min = Math.min(...node.children.map((c) => c.computed_y));
      const child_y_max = Math.max(...node.children.map((c) => c.computed_y));
      const split_x = true_x + this.branch_gap;

      this.ctx.strokeStyle = node.branch_color;
      this.ctx.lineWidth = 2;
      this.ctx.beginPath();
      this.ctx.moveTo(true_x, current_y);
      this.ctx.lineTo(split_x, current_y);
      this.ctx.stroke();

      this.ctx.beginPath();
      this.ctx.moveTo(split_x, child_y_min);
      this.ctx.lineTo(split_x, child_y_max);
      this.ctx.stroke();

      for (const child of node.children) {
        this.draw_rectangular_node(child, split_x);
      }
    }

    this.draw_node_handle(node, true_x, current_y);

    if (this.should_draw_label(node)) {
      const label_size = this.node_label_size(node);
      let label_y;
      if (node.is_visible_leaf()) {
        label_y = current_y - 16;
      } else {
        label_y = current_y - label_size.height - 8;
        if (!this.align_right) {
          label_x = true_x + 8;
        }
      }
      this.draw_node_label(node, label_x, label_y);
    }
  }

  draw_radial_node(node) {
    if (node.parent) {
      const parent_point = {
        x: node.parent.computed_x,
        y: node.parent.computed_y,
      };
      const node_point = { x: node.computed_x, y: node.computed_y };
      const pen = this.node_pen(node);
      this.draw_branch_line(
        node,
        parent_point.x,
        parent_point.y,
        node_point.x,
        node_point.y,
        pen,
      );
    }

    if (node.hide_children && node.children.length > 0) {
      this.draw_collapsed_triangle_radial(node);
    } else if (node.children.length > 0) {
      for (const child of node.children) {
        this.draw_radial_node(child);
      }
    }

    this.draw_node_handle(node, node.computed_x, node.computed_y);

    if (this.should_draw_label(node)) {
      let label_radius = node.radius + 10;
      if (!node.is_visible_leaf()) {
        label_radius = Math.max(18, node.radius - 24);
      }
      const label_point = this.polar_to_point(node.angle, label_radius);
      let label_x = label_point.x;
      let label_y = label_point.y - 12;

      if (Math.cos(node.angle) < 0) {
        const size = this.node_label_size(node);
        label_x = label_point.x - size.width - 8;
      }
      this.draw_node_label(node, label_x, label_y);
    }
  }

  draw_collapsed_triangle_rect(node, x, y) {
    const species_count = Math.max(1, this.descendant_leaf_count(node));
    const fastest_span = Math.max(
      40,
      Math.min(260, this.descendant_max_span(node) * 0.45),
    );
    const half_height = Math.max(18, Math.min(90, 10 + species_count * 6));

    this.ctx.beginPath();
    this.ctx.moveTo(x, y);
    this.ctx.lineTo(x + fastest_span, y - half_height);
    this.ctx.lineTo(x + fastest_span, y + half_height);
    this.ctx.closePath();

    this.ctx.fillStyle = this.hex_to_rgba(node.branch_color, 0.37);
    this.ctx.fill();
    this.ctx.strokeStyle = node.branch_color;
    this.ctx.lineWidth = 1.5;
    this.ctx.stroke();
  }

  draw_collapsed_triangle_radial(node) {
    const species_count = Math.max(1, this.descendant_leaf_count(node));
    const span = Math.max(
      34,
      Math.min(130, this.descendant_max_span(node) * 0.22),
    );
    const width_angle =
      (Math.PI / 180) * Math.max(8, Math.min(36, species_count * 4));

    const p1 = this.polar_to_point(node.angle, node.radius);
    const p2 = this.polar_to_point(
      node.angle - width_angle / 2,
      node.radius + span,
    );
    const p3 = this.polar_to_point(
      node.angle + width_angle / 2,
      node.radius + span,
    );

    this.ctx.beginPath();
    this.ctx.moveTo(p1.x, p1.y);
    this.ctx.lineTo(p2.x, p2.y);
    this.ctx.lineTo(p3.x, p3.y);
    this.ctx.closePath();

    this.ctx.fillStyle = this.hex_to_rgba(node.branch_color, 0.37);
    this.ctx.fill();
    this.ctx.strokeStyle = node.branch_color;
    this.ctx.lineWidth = 1.5;
    this.ctx.stroke();
  }

  draw_branch_line(node, x1, y1, x2, y2, pen) {
    this.ctx.strokeStyle = pen.color;
    this.ctx.lineWidth = pen.width;
    this.ctx.setLineDash(pen.dashed ? [6, 4] : []);
    this.ctx.beginPath();
    this.ctx.moveTo(x1, y1);
    this.ctx.lineTo(x2, y2);
    this.ctx.stroke();
    this.ctx.setLineDash([]);
  }

  node_pen(node) {
    return {
      color: node.branch_color,
      width: this.selected_nodes.has(node) ? 4 : 3,
      dashed: this.selected_nodes.has(node),
    };
  }

  should_draw_label(node) {
    if (!node.name) return false;
    if (this.hide_internal_names && !node.is_visible_leaf()) return false;
    return true;
  }

  draw_node_label(node, x, y) {
    const lines = this.node_label_lines(node);
    const classification = this.classify_label(node.name || "");

    if (this.labelLayer) {
      this.dom_label_records.push({
        node,
        x,
        y,
        lines,
        classification,
      });
      return;
    }

    this.ctx.fillStyle = this.selected_nodes.has(node)
      ? "#111827"
      : node.text_color;
    this.ctx.textBaseline = "top";

    let draw_y = y;
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      const isItalic =
        classification.type === "latin" ||
        (classification.type === "dual" && i === 1);

      this.ctx.font = `${isItalic ? "italic " : ""}${this.label_font_size}px Microsoft YaHei, sans-serif`;
      this.ctx.fillText(line, x, draw_y);

      draw_y += this.label_font_size + 4;
    }
  }

  render_dom_labels() {
    if (!this.labelLayer) return;

    this.labelLayer.replaceChildren();

    for (const record of this.dom_label_records) {
      const { node, x, y, lines, classification } = record;
      const label = document.createElement("div");
      label.className = "tree-label";
      label.dataset.nodeId = String(node.id);
      label.title =
        this.mode === "read" && node.url
          ? `点击打开：${node.url}`
          : "单击编辑名称";

      if (this.selected_nodes.has(node)) {
        label.classList.add("is-selected");
      }
      if (this.mode === "read" && node.url) {
        label.classList.add("is-read-link");
      }

      label.style.left = `${x * this.zoom + this.pan_offset.x}px`;
      label.style.top = `${y * this.zoom + this.pan_offset.y}px`;
      label.style.transform = `none`;
      label.style.color = this.selected_nodes.has(node)
        ? "#111827"
        : node.text_color;
      label.style.fontSize = `${this.label_font_size}px`;
      label.style.background = "transparent";
      label.style.border = "none";
      label.style.boxShadow = "none";
      label.style.padding = "0";
      label.style.margin = "0";
      label.style.outline = "none";
      label.style.width = "auto";

      for (let i = 0; i < lines.length; i++) {
        const line = document.createElement("span");
        line.className = "tree-label-line";
        const isItalic =
          classification.type === "latin" ||
          (classification.type === "dual" && i === 1);
        if (isItalic) {
          line.classList.add("is-latin");
        }
        line.textContent = lines[i] || "\u00a0";
        label.appendChild(line);
      }

      label.addEventListener("click", (e) => {
        e.stopPropagation();
        if (this.mode === "read") {
          this.open_node_url(node);
        } else {
          const additive = e.shiftKey || e.ctrlKey || e.metaKey;
          this.select_node(node, false, additive);
          this.update_dom_label_selection();
          this.start_dom_label_edit(node, label);
        }
      });

      this.labelLayer.appendChild(label);
    }
  }

  update_dom_label_selection() {
    if (!this.labelLayer) return;
    const selected_ids = new Set(
      Array.from(this.selected_nodes).map((node) => node.id),
    );
    this.labelLayer.querySelectorAll(".tree-label").forEach((label) => {
      const id = Number(label.dataset.nodeId);
      label.classList.toggle("is-selected", selected_ids.has(id));
    });
  }

  open_node_url(node) {
    if (this.onLabelClick) {
      this.onLabelClick(node);
      return;
    }
    if (node.url) {
      window.location.href = node.url;
    }
  }

  start_dom_label_edit(node, label) {
    if (!label || this.mode === "read") return;
    this.close_active_name_editor(true);

    label.classList.add("is-editing");
    label.contentEditable = "true";
    label.style.whiteSpace = "pre-wrap";
    label.textContent = node.name || "";
    label.focus();

    const selection = window.getSelection();
    const range = document.createRange();
    range.selectNodeContents(label);
    range.collapse(false);
    selection.removeAllRanges();
    selection.addRange(range);

    const commit = () => {
      if (this.active_name_editor !== label) return;
      this.active_name_editor = null;
      label.contentEditable = "false";
      label.classList.remove("is-editing");
      const next_name = label.textContent.trim();
      node.label_width = Math.max(
        40,
        Math.round(label.getBoundingClientRect().width / this.zoom),
      );
      if (node.name === next_name) {
        this.redraw_tree();
        return;
      }
      this.set_node_name(node, next_name);
    };

    const cancel = () => {
      if (this.active_name_editor !== label) return;
      this.active_name_editor = null;
      this.redraw_tree();
    };

    label.addEventListener("blur", commit, { once: true });
    label.addEventListener("keydown", (e) => {
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        const selection = window.getSelection();
        const range = selection.getRangeAt(0);
        range.deleteContents();
        const br = document.createElement("br");
        range.insertNode(br);
        range.collapse(false);
        selection.removeAllRanges();
        selection.addRange(range);
      } else if (e.key === "Enter" && e.shiftKey) {
        e.preventDefault();
        label.blur();
      } else if (e.key === "Escape") {
        e.preventDefault();
        cancel();
      }
    });

    this.active_name_editor = label;
  }

  draw_node_handle(node, x, y) {
    const radius = this.selected_nodes.has(node) ? 6 : 5;
    const fill_color = this.selected_nodes.has(node) ? "#FFF4C2" : "#FFFFFF";
    const stroke_color = node.branch_color;

    this.ctx.beginPath();
    this.ctx.arc(x, y, radius, 0, Math.PI * 2);
    this.ctx.fillStyle = fill_color;
    this.ctx.fill();
    this.ctx.strokeStyle = stroke_color;
    this.ctx.lineWidth = 2;
    this.ctx.stroke();
  }

  draw_drop_hint(node) {
    this.ctx.beginPath();
    this.ctx.arc(node.computed_x, node.computed_y, 16, 0, Math.PI * 2);
    this.ctx.strokeStyle = "#4A90E2";
    this.ctx.lineWidth = 2;
    this.ctx.setLineDash([4, 4]);
    this.ctx.stroke();
    this.ctx.setLineDash([]);
  }

  node_at(scene_pos, exclude = null) {
    const excluded_nodes = exclude
      ? Array.isArray(exclude)
        ? new Set(exclude)
        : new Set([exclude])
      : new Set();
    const snap = 36;

    const all_nodes = this.all_nodes();
    let nearest = null;
    let nearest_distance = snap + 1;

    for (const node of all_nodes) {
      if (excluded_nodes.has(node)) continue;
      const distance = Math.hypot(
        node.computed_x - scene_pos.x,
        node.computed_y - scene_pos.y,
      );
      if (distance < nearest_distance) {
        nearest = node;
        nearest_distance = distance;
      }
    }

    return nearest;
  }

  select_node(
    node,
    redraw = true,
    additive = false,
    preserve_existing = false,
  ) {
    if (node === null) {
      this.selected_node = null;
      this.selected_nodes.clear();
    } else if (preserve_existing) {
      this.selected_node = node;
    } else if (additive) {
      if (this.selected_nodes.has(node)) {
        this.selected_nodes.delete(node);
        this.selected_node =
          this.selected_nodes.size > 0
            ? Array.from(this.selected_nodes)[0]
            : null;
      } else {
        this.selected_nodes.add(node);
        this.selected_node = node;
      }
    } else {
      this.selected_node = node;
      this.selected_nodes = new Set([node]);
    }

    const panel_node = this.selected_node;

    if (!panel_node) {
      this.updateSelectedInfo("未选中任何节点");
      this.updateEditName("");
    } else {
      const display_name = panel_node.name || "（空白无名字节点）";
      if (this.selected_nodes.size > 1) {
        this.updateSelectedInfo(
          `当前选中：${display_name}；多选 ${this.selected_nodes.size} 个节点`,
        );
      } else {
        this.updateSelectedInfo(`当前选中：${display_name}`);
      }

      this.updateEditName(panel_node.name);
      this.updateBranchLength(
        Math.max(20, Math.min(500, panel_node.branch_length)),
      );
      this.updateHideChildren(panel_node.hide_children);
    }

    if (redraw) {
      this.redraw_tree();
    }
  }

  hover_node(node) {
    if (!node) return;
    const display_name = node.name || "（空白无名字节点）";
    this.updateSelectedInfo(`鼠标悬停：${display_name}`);
  }

  delete_nodes(anchor_node = null) {
    let targets;
    if (anchor_node && !this.selected_nodes.has(anchor_node)) {
      targets = [anchor_node];
    } else {
      targets = this.selected_copy_roots();
    }
    targets = targets.filter((n) => n !== this.root);

    if (targets.length === 0) return;

    this.close_active_name_editor(true);
    this.clear_drop_hint();
    this.drag_roots = [];
    this.drag_delta = { x: 0, y: 0 };

    this.push_undo();
    let fallback = null;
    for (const node of targets) {
      if (node.parent && node.parent.children.includes(node)) {
        fallback = node.parent;
        node.parent.children.splice(node.parent.children.indexOf(node), 1);
        node.parent = null;
      }
    }

    this.selected_nodes.clear();
    this.selected_node = fallback || this.root;
    this.select_node(this.selected_node);
  }

  selected_copy_roots() {
    const selected = Array.from(this.selected_nodes);
    return selected.filter(
      (node) =>
        !selected.some(
          (other) => other !== node && node.is_descendant_of(other),
        ),
    );
  }

  edit_node_name(node) {
    if (this.mode === "read") return;

    const dom_label = this.labelLayer?.querySelector(
      `.tree-label[data-node-id="${node.id}"]`,
    );
    if (dom_label) {
      this.select_node(node, false);
      this.start_dom_label_edit(node, dom_label);
      return;
    }

    this.close_active_name_editor(true);

    const rect = this.canvas.getBoundingClientRect();
    const screen_pos = this.canvas_to_screen(node.computed_x, node.computed_y);
    const label_size = this.node_label_size(node);

    const input = document.createElement("input");
    input.type = "text";
    input.value = node.name;
    input.style.position = "absolute";
    input.style.left = screen_pos.x + 8 + "px";
    input.style.top = screen_pos.y - 4 + "px";
    input.style.minWidth = Math.max(label_size.width + 8, 100) + "px";
    input.style.maxWidth = "400px";
    input.style.fontSize = this.label_font_size + "px";
    input.style.border = "1px solid #4A90E2";
    input.style.borderRadius = "3px";
    input.style.outline = "none";
    input.style.padding = "2px 4px";
    input.style.background = "#FFFFFF";
    input.style.zIndex = "1000";
    input.style.boxShadow = "0 1px 4px rgba(0,0,0,0.1)";

    document.body.appendChild(input);
    input.focus();
    input.select();

    const commit = () => {
      if (this.active_name_editor) {
        this.set_node_name(node, input.value.trim());
        input.remove();
        this.active_name_editor = null;
        this.redraw_tree();
      }
    };

    const cancel = () => {
      if (this.active_name_editor) {
        input.remove();
        this.active_name_editor = null;
      }
    };

    input.addEventListener("blur", commit);
    input.addEventListener("keydown", (e) => {
      if (e.key === "Enter") {
        e.preventDefault();
        input.blur();
      } else if (e.key === "Escape") {
        cancel();
      }
    });

    this.active_name_editor = input;
  }

  close_active_name_editor(commit = false) {
    if (this.active_name_editor) {
      const editor = this.active_name_editor;
      if (commit && this.selected_node) {
        const value =
          "value" in editor ? editor.value.trim() : editor.textContent.trim();
        this.set_node_name(this.selected_node, value);
      }
      if (editor.classList?.contains("tree-label")) {
        editor.contentEditable = "false";
        editor.classList.remove("is-editing");
      } else {
        editor.remove();
      }
      this.active_name_editor = null;
    }
  }

  set_node_name(node, name) {
    if (node.name === name) return;
    this.push_undo();
    node.name = name;
    if (node === this.selected_node) {
      this.updateEditName(name);
    }
    this.redraw_tree();
  }

  rename_selected_node(name) {
    if (!this.selected_node) return;
    this.set_node_name(this.selected_node, name);
  }

  diy_add_node() {
    if (!this.selected_node) return;
    this.push_undo();
    const new_name = `新进化分支_${this.selected_node.children.length + 1}`;
    const new_node = new TreeNode(
      new_name,
      100,
      this.selected_node.branch_color,
    );
    this.selected_node.add_child(new_node);
    this.selected_node.hide_children = false;
    this.select_node(new_node);
  }

  diy_add_blank_node() {
    if (!this.selected_node) return;
    this.push_undo();
    const new_node = new TreeNode("", 100, this.selected_node.branch_color);
    this.selected_node.add_child(new_node);
    this.selected_node.hide_children = false;
    this.select_node(new_node);
  }

  show_color_picker(callback) {
    this.color_callback = callback;
    this.colorPickerRef.click();
  }

  diy_change_color() {
    if (!this.selected_node) return;
    this.show_color_picker((color) => {
      this.push_undo();
      const targets = this.selected_nodes.has(this.selected_node)
        ? this.selected_nodes
        : new Set([this.selected_node]);
      for (const target of targets) {
        target.branch_color = color;
        target.color = color;
      }
      this.redraw_tree();
    });
  }

  diy_change_text_color() {
    if (!this.selected_node) return;
    this.show_color_picker((color) => {
      this.push_undo();
      const targets = this.selected_nodes.has(this.selected_node)
        ? this.selected_nodes
        : new Set([this.selected_node]);
      for (const target of targets) {
        target.text_color = color;
      }
      this.redraw_tree();
    });
  }

  diy_change_subtree_color() {
    if (!this.selected_node) return;
    this.show_color_picker((color) => {
      this.push_undo();
      for (const target of this.selected_node.descendants()) {
        target.branch_color = color;
        target.color = color;
      }
      this.redraw_tree();
    });
  }

  diy_change_clade_color() {
    if (!this.selected_node) return;
    this.show_color_picker((color) => {
      this.push_undo();
      this.selected_node.clade_color = color;
      this.redraw_tree();
    });
  }

  diy_clear_clade_color() {
    if (!this.selected_node) return;
    this.push_undo();
    this.selected_node.clade_color = null;
    this.redraw_tree();
  }

  diy_change_length(value) {
    if (!this.selected_node) return;
    this.push_undo();
    const targets =
      this.selected_nodes.size > 0
        ? this.selected_nodes
        : new Set([this.selected_node]);
    for (const node of targets) {
      node.branch_length = value;
    }
    this.redraw_tree();
  }

  diy_toggle_hide_children(state) {
    if (!this.selected_node) return;
    this.push_undo();
    const targets =
      this.selected_nodes.size > 0
        ? this.selected_nodes
        : new Set([this.selected_node]);
    for (const node of targets) {
      node.hide_children = state === 2;
    }
    this.redraw_tree();
  }

  copy_selected_subtrees() {
    const roots = this.selected_copy_roots();
    if (roots.length === 0) return;

    const payload = {
      type: "diy-evolution-tree-nodes",
      nodes: roots.map((node) => this.serialize_node(node)),
    };
    navigator.clipboard.writeText(
      "DIY_EVOLUTION_TREE_JSON\n" + JSON.stringify(payload),
    );
  }

  paste_from_clipboard() {
    navigator.clipboard.readText().then((text) => {
      if (!text.trim()) return;
      const parent = this.selected_node || this.root;
      const nodes = this.nodes_from_clipboard_text(text);
      if (nodes.length === 0) return;

      this.push_undo();
      for (const node of nodes) {
        parent.add_child(node);
      }
      parent.hide_children = false;
      this.selected_nodes = new Set(nodes);
      this.selected_node = nodes[nodes.length - 1];
      this.redraw_tree();
    });
  }

  nodes_from_clipboard_text(text) {
    if (text.startsWith("DIY_EVOLUTION_TREE_JSON\n")) {
      try {
        const payload = JSON.parse(text.split("\n", 2)[1]);
        if (payload.type === "diy-evolution-tree-nodes") {
          return payload.nodes.map((item) => this.deserialize_node(item));
        }
      } catch (e) {
        return [];
      }
    }
    return this.nodes_from_text(text);
  }

  nodes_from_text(text, show_empty_warning = true) {
    const lines = text
      .split("\n")
      .map((l) => l.trim())
      .filter((l) => l.length > 0);
    if (lines.length === 0) {
      if (show_empty_warning) {
        alert("没有名单\n请先粘贴至少一行节点名称。");
      }
      return [];
    }

    const root_nodes = [];
    const stack = [];

    for (const raw_line of lines) {
      const indent = raw_line.length - raw_line.replace(/^[ \t]+/, "").length;
      const level = Math.floor(indent / 2);
      const name = raw_line.trim();
      const node = new TreeNode(name, 110);

      while (stack.length > 0 && stack[stack.length - 1][0] >= level) {
        stack.pop();
      }

      if (stack.length > 0) {
        stack[stack.length - 1][1].add_child(node);
      } else {
        root_nodes.push(node);
      }
      stack.push([level, node]);
    }

    return root_nodes;
  }

  reset_to_single_node() {
    this.push_undo();
    this.root = new TreeNode("起始节点", 0);
    this.select_node(this.root);
  }

  serialize_node(node) {
    return {
      name: node.name,
      branch_length: node.branch_length,
      branch_color: node.branch_color,
      text_color: node.text_color,
      url: node.url,
      label_width: node.label_width,
      clade_color: node.clade_color,
      hide_children: node.hide_children,
      children: node.children.map((child) => this.serialize_node(child)),
    };
  }

  deserialize_node(data) {
    const node = new TreeNode(
      data.name,
      data.branch_length,
      data.branch_color,
      data.text_color,
    );
    node.url = data.url || "";
    node.label_width = data.label_width || null;
    node.clade_color = data.clade_color;
    node.hide_children = data.hide_children;
    for (const child_data of data.children) {
      const child = this.deserialize_node(child_data);
      node.add_child(child);
    }
    return node;
  }

  save_tree_file() {
    const state = this.current_state();
    const blob = new Blob([JSON.stringify(state, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "evolution-tree.json";
    a.click();
    URL.revokeObjectURL(url);
  }

  open_tree_file(e) {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const data = JSON.parse(event.target.result);
        this.push_undo();
        this.apply_state(data);
      } catch (err) {
        alert("无法读取文件");
      }
    };
    reader.readAsText(file);
    e.target.value = "";
  }

  export_pdf() {
    this.redraw_tree();
    this.draw_all_labels_to_canvas();

    const canvas = this.canvas;
    const image = canvas.toDataURL("image/png");
    const printWindow = window.open("", "_blank", "noopener,noreferrer");

    if (!printWindow) {
      const link = document.createElement("a");
      link.download = "evolution-tree.png";
      link.href = image;
      link.click();
      this.redraw_tree();
      return;
    }

    printWindow.document.write(`
      <!doctype html>
      <html>
        <head>
          <title>evolution-tree.pdf</title>
          <style>
            @page { margin: 12mm; }
            body {
              margin: 0;
              min-height: 100vh;
              display: grid;
              place-items: center;
              background: #ffffff;
            }
            img {
              max-width: 100%;
              max-height: 100vh;
              object-fit: contain;
            }
          </style>
        </head>
        <body>
          <img src="${image}" alt="evolution tree" />
          <script>
            window.onload = () => {
              window.focus();
              window.print();
            };
          <\/script>
        </body>
      </html>
    `);
    printWindow.document.close();

    this.redraw_tree();
  }

  draw_all_labels_to_canvas() {
    const tempLabelLayer = this.labelLayer;
    this.labelLayer = null;

    this.root.traverse((node) => {
      if (this.should_draw_label(node)) {
        const node_screen_x = this.canvas_to_screen(
          node.computed_x,
          node.computed_y,
        ).x;
        let label_y;
        let label_x = node_screen_x + 8;

        if (this.align_right && node.is_visible_leaf()) {
          label_x = this.align_right_x + 8;
        }

        const label_size = this.node_label_size(node);
        label_y = node.computed_y - label_size.height - 8;
        if (!node.is_visible_leaf()) {
          label_x = node.computed_x + 8;
        }

        const canvas_x = label_x * this.zoom + this.pan_offset.x;
        const canvas_y = label_y * this.zoom + this.pan_offset.y;
        this.draw_node_label(node, canvas_x, canvas_y);
      }
    });

    this.labelLayer = tempLabelLayer;
  }

  hex_to_rgba(hex, alpha) {
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
  }

  show_context_menu(node, x, y) {}
}
