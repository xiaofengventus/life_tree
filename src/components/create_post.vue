<template>
  <div class="create-post-container">
    <h1>创建新帖子</h1>
  </div>
  <div class="create-post-form">
    <form action="">
      <label for="title">标题</label>
      <input type="text" id="title" name="title" required />
      <label for="content">内容</label>
      <textarea id="content" name="content" rows="10" required></textarea>
      <button type="submit">创建帖子</button>
    </form>
  </div>
</template>
