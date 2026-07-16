<template>
  <section class="create-post-page">
    <div class="create-post-container">
      <h1>创建新帖子</h1>
    </div>

    <form class="create-post-form" @submit.prevent="submitPost">
      <label for="post-title">标题</label>
      <input
        id="post-title"
        v-model="title"
        type="text"
        name="title"
        placeholder="请输入帖子标题"
        required
      />

      <div class="metadata-grid">
        <div class="metadata-item">
          <label for="post-creator">创建者</label>
          <input id="post-creator" :value="creator" type="text" readonly />
          <small>拥有管理权限的创建者</small>
        </div>

        <div class="metadata-item">
          <label for="post-author">作者</label>
          <input
            id="post-author"
            v-model="author"
            type="text"
            placeholder="可填写多人，用逗号分隔"
          />
          <small>实际文章作者</small>
        </div>

        <div class="metadata-item">
          <label for="post-time">提交时间</label>
          <input id="post-time" :value="submissionTime" type="text" readonly />
          <small>由系统生成</small>
        </div>

        <div class="metadata-item">
          <label for="post-views">浏览量</label>
          <input id="post-views" :value="viewCount" type="text" readonly />
          <small>新文章默认从 0 开始</small>
        </div>
      </div>

      <label>内容</label>
      <div class="editor-wrapper">
        <Toolbar
          :editor="editorRef"
          :default-config="toolbarConfig"
          mode="default"
        />
        <Editor
          v-model="content"
          :default-config="editorConfig"
          mode="default"
          class="post-editor"
          @on-created="handleCreated"
        />
      </div>

      <div class="tag-section">
        <label for="post-tag-input">关键词 / 标签</label>
        <div class="tag-input-row">
          <input
            id="post-tag-input"
            v-model="tagInput"
            type="text"
            placeholder="输入标签后按 Enter 添加"
            @keydown.enter.prevent="addTag"
          />
          <button type="button" class="secondary-button" @click="addTag">
            添加标签
          </button>
        </div>
        <div v-if="tags.length" class="tag-list">
          <span v-for="(tag, index) in tags" :key="tag" class="tag-item">
            {{ tag }}
            <button
              type="button"
              aria-label="删除标签"
              @click="removeTag(index)"
            >
              ×
            </button>
          </span>
        </div>
      </div>

      <div class="submission-section">
        <h2>提交声明</h2>
        <label class="agreement-row">
          <input v-model="agreementAccepted" type="checkbox" />
          <span>我确认文章内容符合社区发布规范。</span>
        </label>

        <div class="submission-options">
          <label for="post-license">协议选择</label>
          <select id="post-license" v-model="license">
            <option value="支持闭源">支持闭源</option>
            <option value="CC BY-NC-SA 4.0">CC BY-NC-SA 4.0</option>
            <option value="CC BY 4.0">CC BY 4.0</option>
          </select>
          <small>如果是关联到Communition的文件强烈建议选择开源</small>
        </div>

        <label for="post-note">提交说明</label>
        <textarea
          id="post-note"
          v-model="changeNote"
          rows="3"
          placeholder="说明本次提交的内容，类似 git commit 的说明"
        ></textarea>
      </div>

      <p v-if="errorMessage" class="error-message">{{ errorMessage }}</p>

      <button type="submit" :disabled="!canSubmit">创建帖子</button>
    </form>
  </section>
</template>

<script setup>
import { computed, onBeforeUnmount, ref, shallowRef } from "vue";
import { Editor, Toolbar } from "@wangeditor/editor-for-vue";
import "@wangeditor/editor/dist/css/style.css";
import { useUserStore } from "@/stores/user";
import { formatDateTime } from "@/utils/date";

const emit = defineEmits(["submit"]);
const userStore = useUserStore();

const editorRef = shallowRef();
const title = ref("");
const author = ref("");
const content = ref("");
const tagInput = ref("");
const tags = ref([]);
const license = ref("支持闭源");
const changeNote = ref("");
const agreementAccepted = ref(false);
const errorMessage = ref("");
const viewCount = 0;
const createdAt = new Date();

const creator = computed(() => userStore.user?.name || "未注册用户");
const submissionTime = formatDateTime(createdAt.toISOString());

const toolbarConfig = {
  toolbarKeys: [
    "headerSelect",
    "bold",
    "italic",
    "underline",
    "through",
    "color",
    "bgColor",
    "bulletedList",
    "numberedList",
    "blockquote",
    "insertLink",
    "insertImage",
    "undo",
    "redo",
  ],
};

const editorConfig = {
  placeholder: "请输入文章内容，可以选择文字后设置颜色……",
};

const plainContent = computed(() =>
  content.value
    .replace(/<[^>]*>/g, "")
    .replace(/&nbsp;/g, " ")
    .trim(),
);

const canSubmit = computed(
  () => title.value.trim() && plainContent.value && agreementAccepted.value,
);

function handleCreated(editor) {
  editorRef.value = editor;
}

function addTag() {
  const tag = tagInput.value.trim();
  if (!tag || tags.value.includes(tag)) return;

  tags.value.push(tag);
  tagInput.value = "";
}

function removeTag(index) {
  tags.value.splice(index, 1);
}

function submitPost() {
  errorMessage.value = "";

  if (!title.value.trim()) {
    errorMessage.value = "请输入帖子标题";
    return;
  }

  if (!plainContent.value) {
    errorMessage.value = "请输入帖子内容";
    return;
  }

  if (!agreementAccepted.value) {
    errorMessage.value = "请先确认提交声明";
    return;
  }

  emit("submit", {
    title: title.value.trim(),
    creator: creator.value,
    author: author.value.trim() || creator.value,
    content: content.value,
    contentType: "html",
    tags: [...tags.value],
    license: license.value,
    viewCount,
    submittedAt: createdAt.toISOString(),
    changeNote: changeNote.value.trim(),
  });
}

onBeforeUnmount(() => {
  editorRef.value?.destroy();
});
</script>

<style scoped>
.create-post-page {
  min-height: 100vh;
  padding: 84px 20px 60px;
  background: #f8fafc;
}

.create-post-container,
.create-post-form {
  width: min(100%, 960px);
  margin: 0 auto;
}

.create-post-container {
  margin-bottom: 22px;
}

.create-post-container h1 {
  margin: 0;
  color: #1e293b;
  font-size: 2rem;
}

.create-post-form {
  display: flex;
  flex-direction: column;
  gap: 10px;
  padding: 28px;
  background: #ffffff;
  border: 1px solid #e2e8f0;
  border-radius: 12px;
  box-shadow: 0 2px 10px rgba(15, 23, 42, 0.06);
}

.create-post-form > label,
.tag-section > label,
.submission-section > label {
  margin-top: 8px;
  color: #334155;
  font-weight: 600;
}

.create-post-form input,
.create-post-form select,
.create-post-form textarea {
  width: 100%;
  padding: 11px 13px;
  border: 1px solid #cbd5e1;
  border-radius: 6px;
  color: #1e293b;
  font: inherit;
}

.create-post-form textarea {
  resize: vertical;
}

.create-post-form input:focus,
.create-post-form select:focus,
.create-post-form textarea:focus {
  border-color: #4a90e2;
  outline: 2px solid rgba(74, 144, 226, 0.15);
}

.metadata-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 16px;
  margin: 6px 0 8px;
  padding: 18px;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  background: #f8fafc;
}

.metadata-item {
  min-width: 0;
}

.metadata-item label,
.metadata-item small {
  display: block;
}

.metadata-item label {
  margin-bottom: 6px;
  color: #334155;
  font-weight: 600;
}

.metadata-item small {
  margin-top: 4px;
  color: #94a3b8;
}

.editor-wrapper {
  overflow: hidden;
  border: 1px solid #cbd5e1;
  border-radius: 6px;
}

.post-editor {
  min-height: 360px;
}

.tag-section,
.submission-section {
  display: flex;
  flex-direction: column;
  gap: 10px;
  margin-top: 8px;
  padding-top: 18px;
  border-top: 1px solid #e2e8f0;
}

.tag-input-row {
  display: flex;
  gap: 8px;
}

.tag-input-row input {
  flex: 1;
}

.tag-list {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.tag-item {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 4px 8px 4px 10px;
  border-radius: 999px;
  background: #e0f2fe;
  color: #0369a1;
  font-size: 0.9rem;
}

.tag-item button {
  padding: 0;
  border: none;
  background: transparent;
  color: inherit;
  cursor: pointer;
  font-size: 1rem;
  line-height: 1;
}

.submission-section h2 {
  margin: 0;
  color: #1e293b;
  font-size: 1.15rem;
}

.agreement-row {
  display: flex;
  align-items: center;
  gap: 8px;
  color: #475569;
}

.agreement-row input {
  width: auto;
}

.submission-options {
  display: grid;
  grid-template-columns: 100px minmax(0, 1fr);
  align-items: start;
  gap: 10px;
}

.submission-options label {
  color: #334155;
  font-weight: 600;
}

.submission-options small {
  grid-column: 2;
  margin-top: 4px;
  color: #94a3b8;
  display: block;
  line-height: 1.4;
}

.error-message {
  margin: 4px 0 0;
  color: #dc2626;
}

.create-post-form > button {
  align-self: flex-start;
  margin-top: 10px;
  padding: 10px 20px;
  border: none;
  border-radius: 6px;
  background: #4a90e2;
  color: #ffffff;
  cursor: pointer;
  font: inherit;
}

.create-post-form > button:hover:not(:disabled),
.secondary-button:hover {
  background: #3a7bc8;
}

.create-post-form > button:disabled {
  cursor: not-allowed;
  opacity: 0.55;
}

.secondary-button {
  flex: 0 0 auto;
  padding: 10px 14px;
  border: none;
  border-radius: 6px;
  background: #64748b;
  color: #ffffff;
  cursor: pointer;
  font: inherit;
}

@media (max-width: 640px) {
  .create-post-page {
    padding: 76px 12px 40px;
  }

  .create-post-form {
    padding: 20px 14px;
  }

  .metadata-grid {
    grid-template-columns: 1fr;
  }

  .tag-input-row,
  .submission-options {
    display: flex;
    flex-direction: column;
    align-items: stretch;
  }
}
</style>
