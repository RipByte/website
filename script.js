const card = document.querySelector('.profile-card');
const blogSection = document.querySelector('.blog-section');
const terminalHead = document.querySelector('.terminal-head');
const terminalCloseBtn = document.querySelector('#terminalCloseBtn');
const spawnTerminalBtn = document.querySelector('#spawnTerminalBtn');
const blogList = document.querySelector('#blogList');
const terminalStatus = document.querySelector('#terminalStatus');
const blogSearchInput = document.querySelector('#blogSearchInput');
const blogSearchBtn = document.querySelector('#blogSearchBtn');
let allBlogs = [];

function isMobileView() {
  return window.matchMedia('(max-width: 900px)').matches;
}

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function placeTerminalRightOfCard() {
  if (!blogSection || !card || isMobileView()) {
    return;
  }

  const cardRect = card.getBoundingClientRect();
  const terminalRect = blogSection.getBoundingClientRect();
  const gutter = 18;

  let nextLeft = cardRect.right + gutter;
  let nextTop = Math.max(68, cardRect.top - 10);

  if (nextLeft + terminalRect.width > window.innerWidth - 8) {
    nextLeft = Math.max(8, window.innerWidth - terminalRect.width - 8);
  }

  if (nextTop + terminalRect.height > window.innerHeight - 8) {
    nextTop = Math.max(68, window.innerHeight - terminalRect.height - 8);
  }

  blogSection.style.left = `${nextLeft}px`;
  blogSection.style.top = `${nextTop}px`;
}

function openTerminal() {
  if (!blogSection || isMobileView()) {
    return;
  }

  blogSection.classList.remove('terminal-hidden');

  requestAnimationFrame(() => {
    placeTerminalRightOfCard();
  });
}

function closeTerminal() {
  if (!blogSection) {
    return;
  }

  blogSection.classList.add('terminal-hidden');
}

if (terminalCloseBtn) {
  terminalCloseBtn.addEventListener('mousedown', (event) => {
    event.stopPropagation();
  });

  terminalCloseBtn.addEventListener('click', (event) => {
    event.stopPropagation();
    closeTerminal();
  });
}

if (spawnTerminalBtn) {
  spawnTerminalBtn.addEventListener('click', () => {
    openTerminal();
  });
}

if (blogSection && terminalHead) {
  let dragging = false;
  let offsetX = 0;
  let offsetY = 0;

  terminalHead.addEventListener('mousedown', (event) => {
    if (isMobileView()) {
      return;
    }

    const rect = blogSection.getBoundingClientRect();
    dragging = true;
    offsetX = event.clientX - rect.left;
    offsetY = event.clientY - rect.top;
    blogSection.style.left = `${rect.left}px`;
    blogSection.style.top = `${rect.top}px`;
  });

  document.addEventListener('mousemove', (event) => {
    if (!dragging || !blogSection) {
      return;
    }

    const rect = blogSection.getBoundingClientRect();
    const nextLeft = clamp(event.clientX - offsetX, 8, window.innerWidth - rect.width - 8);
    const nextTop = clamp(event.clientY - offsetY, 68, window.innerHeight - rect.height - 8);
    blogSection.style.left = `${nextLeft}px`;
    blogSection.style.top = `${nextTop}px`;
  });

  document.addEventListener('mouseup', () => {
    dragging = false;
  });
}

window.addEventListener('resize', () => {
  if (!isMobileView() && blogSection && !blogSection.classList.contains('terminal-hidden')) {
    placeTerminalRightOfCard();
  }
});

function createBlogListItem(post, index) {
  const item = document.createElement('button');
  item.className = 'blog-post';
  item.type = 'button';

  const row = document.createElement('div');
  row.className = 'blog-row';
  row.textContent = `${String(index + 1).padStart(2, '0')} | ${post.file}`;

  const title = document.createElement('div');
  title.className = 'blog-title';
  title.textContent = post.title || post.file;

  const meta = document.createElement('div');
  meta.className = 'blog-meta';
  const dateText = post.date ? `Updated: ${post.date}` : 'Updated: unknown';
  meta.textContent = `${dateText}  -  click to open`;

  item.append(row, title, meta);
  item.addEventListener('click', () => {
    window.location.href = `./blogs/${post.file}`;
  });

  return item;
}

async function renderBlogPosts(posts, delayMs) {
  blogList.innerHTML = '';

  for (let index = 0; index < posts.length; index += 1) {
    const item = createBlogListItem(posts[index], index);
    blogList.appendChild(item);
    if (delayMs > 0) {
      await new Promise((resolve) => setTimeout(resolve, delayMs));
    }
  }
}

function wildcardToRegex(pattern) {
  const escaped = pattern.replace(/[.+^${}()|[\]\\]/g, '\\$&');
  const wildcarded = escaped.replace(/\*/g, '.*').replace(/\?/g, '.');
  return new RegExp(`^${wildcarded}$`, 'i');
}

async function runBlogSearch(rawInput) {
  if (!blogList || !terminalStatus) {
    return;
  }

  if (!allBlogs.length) {
    terminalStatus.textContent = 'No blogs loaded yet.';
    return;
  }

  const input = (rawInput || '').trim();
  let query = input;

  if (input.toLowerCase().startsWith('search ')) {
    query = input.slice(7).trim();
  }

  if (!query) {
    terminalStatus.textContent = `Showing all ${allBlogs.length} blog file(s).`;
    await renderBlogPosts(allBlogs, 0);
    return;
  }

  const hasWildcard = query.includes('*') || query.includes('?');
  const effectivePattern = hasWildcard ? query : `*${query}*`;
  const matcher = wildcardToRegex(effectivePattern);

  const filtered = allBlogs.filter((post) => {
    const text = `${post.file || ''} ${post.title || ''}`;
    return matcher.test(text);
  });

  terminalStatus.textContent = `search ${query} -> ${filtered.length} match(es)`;
  await renderBlogPosts(filtered, 0);
}

if (blogSearchBtn) {
  blogSearchBtn.addEventListener('click', () => {
    runBlogSearch(blogSearchInput ? blogSearchInput.value : '');
  });
}

if (blogSearchInput) {
  blogSearchInput.addEventListener('keydown', (event) => {
    if (event.key === 'Enter') {
      runBlogSearch(blogSearchInput.value);
    }
  });
}

if (card) {
  card.addEventListener('mouseenter', () => {
    card.style.transform = 'perspective(900px) rotateX(0deg) rotateY(0deg) scale(1.04)';
  });

  card.addEventListener('mousemove', (e) => {
    const rect = card.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const midX = rect.width / 2;
    const midY = rect.height / 2;

    const rotateX = ((y - midY) / midY) * 10;
    const rotateY = ((x - midX) / midX) * -10;
    const hoverScale = 1.05;

    card.style.transform = `perspective(900px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale(${hoverScale})`;

    const localX = (x / rect.width) * 100;
    const localY = (y / rect.height) * 100;

    card.style.setProperty('--gx', `${100 - localX}%`);
    card.style.setProperty('--gy', `${100 - localY}%`);
  });

  card.addEventListener('mouseleave', () => {
    card.style.transform = 'perspective(900px) rotateX(0deg) rotateY(0deg) scale(1)';
    card.style.setProperty('--gx', '50%');
    card.style.setProperty('--gy', '50%');
  });
}

async function loadBlogs() {
  if (!blogList || !terminalStatus) {
    return;
  }

  const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

  try {
    terminalStatus.textContent = 'Scanning for blogs.....';
    blogList.innerHTML = '';
    await sleep(650);

    const response = await fetch('./blogs/index.json', { cache: 'no-store' });
    if (!response.ok) {
      throw new Error('Unable to fetch blogs/index.json');
    }

    const payload = await response.json();
    const posts = Array.isArray(payload.posts) ? payload.posts : [];
    allBlogs = posts;

    if (!posts.length) {
      terminalStatus.textContent = 'No blog posts found in ./blogs';
      return;
    }

    terminalStatus.textContent = `Found ${posts.length} amount of blog file(s). Preparing output...`;
    await sleep(500);

    terminalStatus.textContent = 'Streaming recent posts:';
    await renderBlogPosts(posts, 170);

    terminalStatus.textContent = `Done. ${posts.length} amount of blog file(s) ready.`;
  } catch (error) {
    allBlogs = [];
    terminalStatus.textContent = 'Blog index missing. Create ./blogs/index.json to list posts.';
  }
}

loadBlogs();

requestAnimationFrame(() => {
  placeTerminalRightOfCard();
});
