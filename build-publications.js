#!/usr/bin/env node
/**
 * 根据 assets/publication/publications.md 生成 index.html 中的静态论文列表。
 *
 * 用法：
 *   node build-publications.js
 *
 * 只需维护 publications.md，然后运行本脚本即可。
 */

const fs = require("fs");
const path = require("path");

const root = __dirname;
const mdPath = path.join(root, "assets", "publication", "publications.md");
const htmlPath = path.join(root, "index.html");
const sitemapPath = path.join(root, "sitemap.xml");

const START_MARKER = "<!-- PUBLICATIONS:START -->";
const END_MARKER = "<!-- PUBLICATIONS:END -->";

function escapeHtml(text) {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

// 支持 **加粗**、*斜体* 和 [文字](链接)
function renderInline(markdown) {
  let html = escapeHtml(markdown);

  html = html.replace(
    /\[([^\]]+)\]\(([^)]+)\)/g,
    '<a href="$2" target="_blank" rel="noopener noreferrer">$1</a>'
  );
  html = html.replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>");
  html = html.replace(/\*([^*]+)\*/g, "<em>$1</em>");

  return html;
}

function parsePublications(markdown) {
  return markdown
    .split(/\n(?=# )/)
    .map(block => block.trim())
    .filter(block => block.startsWith("#"))
    .map(block => {
      const lines = block
        .split(/\r?\n/)
        .map(line => line.trim())
        .filter(line => line && !/^-{3,}$/.test(line));

      const title = lines.shift().replace(/^#\s*/, "");
      const isLink = line => /^\[[^\]]+\]\([^)]+\)/.test(line);
      const isVenue = line => /^\*(?!\*).+\*$/.test(line);

      const authors = lines.find(line => !isLink(line) && !isVenue(line)) || "";
      const venue = lines.find(isVenue) || "";
      const links = lines.filter(isLink);

      return { title, authors, venue, links };
    });
}

function renderPublications(publications) {
  return publications
    .map(publication => {
      const links = publication.links.map(renderInline).join(" ");

      return [
        '      <div class="publication-item">',
        `        <h3>${renderInline(publication.title)}</h3>`,
        `        <div class="publication-authors">${renderInline(publication.authors)}</div>`,
        `        <div class="publication-venue">${renderInline(publication.venue)}</div>`,
        `        <div class="publication-links">${links}</div>`,
        "      </div>"
      ].join("\n");
    })
    .join("\n");
}

function updateHtml(publicationsHtml) {
  const html = fs.readFileSync(htmlPath, "utf8");
  const startIndex = html.indexOf(START_MARKER);
  const endIndex = html.indexOf(END_MARKER);

  if (startIndex === -1 || endIndex === -1 || endIndex < startIndex) {
    throw new Error(
      `index.html 中缺少 ${START_MARKER} / ${END_MARKER} 标记，无法生成论文列表。`
    );
  }

  const before = html.slice(0, startIndex + START_MARKER.length);
  const after = html.slice(endIndex);
  const updated = `${before}\n${publicationsHtml}\n      ${after}`;

  if (updated !== html) {
    fs.writeFileSync(htmlPath, updated, "utf8");
    return true;
  }
  return false;
}

function updateSitemap() {
  if (!fs.existsSync(sitemapPath)) return false;

  const today = new Date().toISOString().slice(0, 10);
  const sitemap = fs.readFileSync(sitemapPath, "utf8");
  const updated = sitemap.replace(
    /<lastmod>[^<]*<\/lastmod>/,
    `<lastmod>${today}</lastmod>`
  );

  if (updated !== sitemap) {
    fs.writeFileSync(sitemapPath, updated, "utf8");
    return true;
  }
  return false;
}

const markdown = fs.readFileSync(mdPath, "utf8");
const publications = parsePublications(markdown);
const publicationsHtml = renderPublications(publications);

const htmlChanged = updateHtml(publicationsHtml);
const sitemapChanged = updateSitemap();

console.log(`已解析 ${publications.length} 篇论文。`);
console.log(htmlChanged ? "index.html 已更新。" : "index.html 无需更新。");
console.log(sitemapChanged ? "sitemap.xml 日期已更新。" : "sitemap.xml 无需更新。");
