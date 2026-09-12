# Personal website

## 更新论文列表

论文只需要维护 `assets/publication/publications.md`。

每篇论文使用下面的格式，之间用 `---` 分隔：

```markdown
# 论文标题

作者列表，自己的名字用 **加粗**

*期刊或会议, 年份*
[Link](https://example.com)
```

修改完成后，在项目目录运行：

```bash
node build-publications.js
```

脚本会自动更新 `index.html` 中的静态论文列表，并刷新 `sitemap.xml` 的日期。

## 部署

```bash
git add .
git commit -m "Update publications"
git push
```
