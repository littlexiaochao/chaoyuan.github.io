// ===== 导航栏点击切换显示 =====
const navLinks = document.querySelectorAll('nav a');
const contentSections = document.querySelectorAll('.content-section');
const homeSection = document.getElementById('home');
const aboutSection = document.getElementById('about');
const exhibitionSection = document.getElementById('exhibition');

// 初始显示 Home + About
homeSection.style.display = 'block';
aboutSection.style.display = 'block';
if (exhibitionSection) exhibitionSection.style.display = 'block';

contentSections.forEach(sec => {
  if (sec.id !== 'about' && sec.id !== 'exhibition') { // ✅ 关键修改
    sec.style.display = 'none';
  }
});

// 点击导航栏切换显示
navLinks.forEach(link => {
  link.addEventListener('click', e => {
    e.preventDefault();
    navLinks.forEach(l => l.classList.remove('active'));
    e.target.classList.add('active');

    const targetId = e.target.getAttribute('href').substring(1);

    if (targetId === 'home') {
      homeSection.style.display = 'block';
      aboutSection.style.display = 'block';
      if (exhibitionSection) exhibitionSection.style.display = 'block';
    
      contentSections.forEach(sec => {
        if (sec.id !== 'about' && sec.id !== 'exhibition') {
          sec.style.display = 'none';
        }
      });
    
      window.scrollTo({ top: 0, behavior: 'smooth' });
    
      // ✅ ⭐⭐ 关键修复 ⭐⭐
      const videos = document.querySelectorAll('#exhibition video');
      videos.forEach(video => {
        video.pause();
        video.currentTime = 0;
        video.load();
      });
    }
    else {
      homeSection.style.display = 'none';
      aboutSection.style.display = 'none';
      if (exhibitionSection) exhibitionSection.style.display = 'none';
      contentSections.forEach(sec => (sec.style.display = 'none'));
      const targetSection = document.getElementById(targetId);
      if (targetSection) targetSection.style.display = 'block';
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  });
});

// ===== Scroll Down 点击 → 平滑滚动到 About =====
document.querySelector('.scroll-down').addEventListener('click', () => {
  aboutSection.scrollIntoView({ behavior: 'smooth' });
});

// ===== 弹出模态框 =====
const modal = document.getElementById('projectModal');
const modalTitle = document.getElementById('modalTitle');
const modalMedia = document.getElementById('modalMedia');
const closeBtn = document.querySelector('.close');

closeBtn.onclick = () => (modal.style.display = 'none');
window.onclick = e => {
  if (e.target === modal) modal.style.display = 'none';
};

// ===== 从 Markdown 加载项目 =====
async function loadProjects(sectionId, data) {
  const container = document.getElementById(sectionId + "-grid");

  for (let proj of data) {
    const item = document.createElement("div");
    item.classList.add("project-item");
    item.dataset.markdown = proj.markdown;
    item.dataset.youtube = proj.youtube || ""; // ⭐新增

    // 先设置 Loading
    item.innerHTML = `
      <img src="${proj.thumb}" alt="" />
      <div class="overlay"><span class="project-title">Loading...</span></div>
    `;
    container.appendChild(item);

    // Fetch Markdown 获取首行作为标题
    try {
      const response = await fetch(proj.markdown);
      const markdownText = await response.text();
      const lines = markdownText.split(/\r?\n/);
      const firstLine = lines.find(l => l.trim() !== '');
      const title = firstLine ? firstLine.replace(/^#\s*/, '') : '';

      // 更新首图标题
      item.querySelector('.project-title').textContent = title;
    } catch (error) {
      console.error("Markdown 加载失败:", error);
      item.querySelector('.project-title').textContent = "Failed";
    }
  }

  // 点击弹框显示完整 Markdown
  container.querySelectorAll(".project-item").forEach(item => {
    item.addEventListener("click", async () => {
      const mdPath = item.dataset.markdown;
      modalTitle.textContent = "";
      modalMedia.innerHTML = "<p>Loading...</p>";
      modal.style.display = "block";
  
      try {
        let markdownText = await fetch(mdPath).then(res => res.text());
  
        // 获取第一行标题
        const lines = markdownText.split(/\r?\n/);
        const firstLineIndex = lines.findIndex(l => l.trim() !== '');
        const firstLine = firstLineIndex >= 0 ? lines[firstLineIndex].replace(/^#\s*/, '') : '';
  
        // 设置弹框标题
        modalTitle.textContent = firstLine;
  
        markdownText = lines.join("\n");
  
        // 修正图片/视频路径
        const mdFolder = mdPath.substring(0, mdPath.lastIndexOf("/") + 1);
        markdownText = markdownText.replace(/!\[([^\]]*)\]\(([^)]+)\)/g, (match, alt, src) => {
          if (!src.startsWith('http') && !src.startsWith('/')) {
            src = mdFolder + src;
          }
          return `![${alt}](${src})`;
        });
        // markdownText = markdownText.replace(/<video\s+src="([^"]+)"/g, (match, src) => {
        //   if (!src.startsWith('http') && !src.startsWith('/')) {
        //     src = mdFolder + src;
        //   }
        //   return `<video src="${src}"`;
        // });
        const youtubeId = item.dataset.youtube;
        if (youtubeId) {
          markdownText = markdownText.replace(/<video[\s\S]*?<\/video>/g, `
            <div class="md-video">
              <iframe src="https://www.youtube.com/embed/${youtubeId}"
                      frameborder="0"
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                      allowfullscreen>
              </iframe>
            </div>
          `);
        }

  
        // 渲染 Markdown
        modalTitle.textContent = "";
        modalMedia.innerHTML = marked.parse(markdownText);

        // 找到所有图片
        const imgs = modalMedia.querySelectorAll('img');
        if (imgs.length > 0) {
          const firstImg = imgs[0];
          const parent = firstImg.parentElement;
          // 移动到 p 外面
          modalMedia.insertBefore(firstImg, modalMedia.firstChild);
          // 删除原 <p>，如果里面只剩下这张图片
          if (parent.tagName.toLowerCase() === 'p' && parent.innerHTML.trim() === '') {
            parent.remove();
          }
          // 给图片加类
          firstImg.classList.add('full-width');
        }
  
      } catch (error) {
        modalMedia.innerHTML = "<p>⚠️ Failed to load markdown content.</p>";
        console.error("Markdown 加载失败:", error);
      }
    });
  });
}



async function loadPublications(mdPath) {
  const container = document.getElementById("publication-list");

  try {
    const mdText = await fetch(mdPath).then(res => res.text());

    // 按一级标题拆分（保留标题）
    const blocks = mdText
      .split(/\n(?=# )/)
      .map(b => b.trim())
      .filter(b => b.startsWith("#"));

    for (let block of blocks) {
      const html = marked.parse(block);

      // 用 DOM 再解析一遍结构
      const temp = document.createElement("div");
      temp.innerHTML = html;

      const title = temp.querySelector("h1")?.innerText || "";

      const paragraphs = temp.querySelectorAll("p");

      const authors = paragraphs[0]?.innerHTML || "";
      const venue = paragraphs[1]?.innerHTML || "";
      const links = paragraphs[2]?.innerHTML || "";
      const abstract = paragraphs[3]?.innerHTML || "";

      const item = document.createElement("div");
      item.className = "publication-item";
      item.innerHTML = `
        <h3>${title}</h3>
        <div class="publication-authors">${authors}</div>
        <div class="publication-venue">${venue}</div>
        <div class="publication-links">${links}</div>
        <div class="publication-abstract">${abstract}</div>
      `;

      item.querySelectorAll("a").forEach(a => {
        a.setAttribute("target", "_blank");
        a.setAttribute("rel", "noopener noreferrer");
      });

      container.appendChild(item);

    }

  } catch (err) {
    console.error("Publication Markdown 加载失败:", err);
    container.innerHTML = "<p>⚠️ Failed to load publications.</p>";
  }
}


function loadVideo(el, videoId) {

  // ✅ 如果已经加载过，就不重复加载
  if (el.classList.contains('loaded')) return;

  // ✅ 停止其他视频（关键优化）
  document.querySelectorAll('.video-item.loaded').forEach(item => {
    item.innerHTML = item.dataset.original;
    item.classList.remove('loaded');
  });

  // ✅ 保存原始内容（用于恢复）
  el.dataset.original = el.innerHTML;

  // ✅ 创建 iframe
  const iframe = document.createElement("iframe");
  iframe.src = `https://www.youtube.com/embed/${videoId}?autoplay=1`;
  iframe.frameBorder = "0";
  iframe.allow = "accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture";
  iframe.allowFullscreen = true;
  iframe.style.width = "100%";
  iframe.style.height = "100%";

  // ✅ 替换内容
  el.innerHTML = "";
  el.appendChild(iframe);

  el.classList.add('loaded');
}






// ===== Markdown 数据配置 =====
const projectData = [
  { thumb: "assets/project/2026_Perfattice/1.jpg", markdown: "assets/project/2026_Perfattice/intro.md" },
  { thumb: "assets/project/2025_freeshell/1.jpg", markdown: "assets/project/2025_freeshell/intro.md" },
  { thumb: "assets/project/2025_interflex/1.jpg", markdown: "assets/project/2025_interflex/intro.md" },
];

// const contentData = [
//   { thumb: "assets/content/folding/1.jpg", markdown: "assets/content/folding/intro.md" },
//   { thumb: "assets/content/modular/1.jpg", markdown: "assets/content/modular/intro.md" }
// ];

const publicationData = "assets/publication/publications.md"

// ===== 加载项目 =====
loadProjects('projects', projectData);
// loadProjects('design', contentData);
loadPublications(publicationData);
