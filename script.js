// ===== 导航栏点击切换显示 =====
const navLinks = document.querySelectorAll('nav a');
const contentSections = document.querySelectorAll('.content-section');
const homeSection = document.getElementById('home');
const aboutSection = document.getElementById('about');
const worksSection = document.getElementById('works');
const publicationSection = document.getElementById('publication');

const navBySection = {
  home: document.querySelector('nav a[href="#home"]'),
  works: document.querySelector('nav a[href="#works"]'),
  publication: document.querySelector('nav a[href="#publication"]')
};

function setActiveNav(sectionId) {
  navLinks.forEach(link => link.classList.remove('active'));
  const activeLink = navBySection[sectionId];
  if (activeLink) activeLink.classList.add('active');
}

// 初始显示 Home + About + Works
homeSection.style.display = 'block';
aboutSection.style.display = 'block';
if (worksSection) worksSection.style.display = 'block';

contentSections.forEach(sec => {
  if (sec.id !== 'about' && sec.id !== 'works') {
    sec.style.display = 'none';
  }
});

// 点击导航栏切换显示
navLinks.forEach(link => {
  link.addEventListener('click', e => {
    e.preventDefault();

    const targetId = e.target.getAttribute('href').substring(1);
    setActiveNav(targetId);

    if (targetId === 'home') {
      homeSection.style.display = 'block';
      contentSections.forEach(sec => {
        sec.style.display = (sec.id === 'about' || sec.id === 'works') ? 'block' : 'none';
      });
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } else {
      homeSection.style.display = 'none';
      contentSections.forEach(sec => (sec.style.display = 'none'));
      const targetSection = document.getElementById(targetId);
      if (targetSection) targetSection.style.display = 'block';
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  });
});

// ===== 滚动时同步导航下划线 =====
function updateActiveNavOnScroll() {
  const visibleSections = [
    { id: 'home', element: homeSection },
    { id: 'about', element: aboutSection },
    { id: 'works', element: worksSection },
    { id: 'publication', element: publicationSection }
  ].filter(section => section.element && section.element.style.display !== 'none');

  if (visibleSections.length === 0) return;

  const probe = window.scrollY + window.innerHeight * 0.35;
  let currentId = visibleSections[0].id;

  visibleSections.forEach(section => {
    if (section.element.offsetTop <= probe) {
      currentId = section.id;
    }
  });

  // About 属于主页内容，滚动到 About 时仍高亮 Home
  if (currentId === 'about') currentId = 'home';
  setActiveNav(currentId);
}

window.addEventListener('scroll', updateActiveNavOnScroll, { passive: true });
window.addEventListener('resize', updateActiveNavOnScroll);
updateActiveNavOnScroll();

// ===== Scroll Down 点击 → 平滑滚动到 About =====
document.querySelector('.scroll-down').addEventListener('click', () => {
  aboutSection.scrollIntoView({ behavior: 'smooth' });
});

// ===== 弹出详情层 =====
const modal = document.getElementById('projectModal');
const modalTitle = document.getElementById('modalTitle');
const modalMedia = document.getElementById('modalMedia');
const closeBtn = document.querySelector('.close');

closeBtn.onclick = () => (modal.style.display = 'none');
window.onclick = e => {
  if (e.target === modal) modal.style.display = 'none';
};

async function openWorkDetail(card) {
  const mdPath = card.dataset.markdown;
  if (!mdPath) return;

  modalTitle.textContent = '';
  modalMedia.innerHTML = '<p>Loading...</p>';
  modal.style.display = 'block';

  try {
    let markdownText = await fetch(mdPath).then(res => res.text());

    // 修正 Markdown 中的相对图片路径
    const mdFolder = mdPath.substring(0, mdPath.lastIndexOf('/') + 1);
    markdownText = markdownText.replace(/!\[([^\]]*)\]\(([^)]+)\)/g, (match, alt, src) => {
      if (!src.startsWith('http') && !src.startsWith('/')) {
        src = mdFolder + src;
      }
      return `![${alt}](${src})`;
    });

    modalMedia.innerHTML = marked.parse(markdownText);

    // 第一张图通栏显示
    const imgs = modalMedia.querySelectorAll('img');
    if (imgs.length > 0) {
      const firstImg = imgs[0];
      const parent = firstImg.parentElement;
      modalMedia.insertBefore(firstImg, modalMedia.firstChild);
      if (parent.tagName.toLowerCase() === 'p' && parent.innerHTML.trim() === '') {
        parent.remove();
      }
      firstImg.classList.add('full-width');
    }
  } catch (error) {
    modalMedia.innerHTML = '<p>⚠️ Failed to load markdown content.</p>';
    console.error('Markdown 加载失败:', error);
  }
}

// ===== 作品卡片内嵌播放 B 站视频 =====
function playWorkVideo(card) {
  const bvid = card.dataset.bilibili;
  if (!bvid) return;

  const media = card.querySelector('.work-media');
  if (!media || media.classList.contains('playing')) return;

  media.dataset.original = media.innerHTML;
  media.innerHTML = `
    <iframe src="https://player.bilibili.com/player.html?bvid=${bvid}&autoplay=1"
            frameborder="0"
            allowfullscreen></iframe>
    <button class="work-close" type="button" aria-label="关闭视频">×</button>
  `;
  media.classList.add('playing');

  media.querySelector('.work-close').addEventListener('click', e => {
    e.stopPropagation();
    media.innerHTML = media.dataset.original;
    media.classList.remove('playing');
  });
}

// ===== 绑定作品卡片交互 =====
document.querySelectorAll('.work-card').forEach(card => {
  const playBtn = card.querySelector('.work-play');
  if (playBtn) {
    playBtn.addEventListener('click', e => {
      e.stopPropagation();
      playWorkVideo(card);
    });
  }

  if (card.dataset.markdown) {
    card.classList.add('has-detail');
    card.addEventListener('click', () => {
      const media = card.querySelector('.work-media');
      if (media && media.classList.contains('playing')) return;
      openWorkDetail(card);
    });
  }
});
