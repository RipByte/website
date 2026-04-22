# Blog System Documentation

## Overview

The cybersecurity blog system provides a complete blog management solution with:
- Individual blog post pages with full content
- Blog archive with search functionality
- Markdown to HTML conversion support
- Responsive design with pixel art aesthetic

## Directory Structure

\`\`\`
/blogs/                          # Main blog directory
  /zero-day-vulnerabilities/     # Individual blog post folder
    index.html                   # Full blog post page
  /advanced-persistent-threats/
    index.html
  ... (other blog posts)

/blog/                           # Old blog JSON files (deprecated, kept for reference)

/css/
  blog-post.css                  # Styling for individual blog posts
  blog-archive.css               # Styling for blog archive page

/js/
  blog-search.js                 # Search functionality for blog archive
  markdown-converter.js          # Markdown to HTML converter utility
  script.js                       # Main script with blog linking

blogs.html                        # Blog archive page with search
\`\`\``

## How to Add a New Blog Post

### Step 1: Create Blog Directory
Create a new folder under /blogs/ with a URL-friendly name:

\`\`\`
/blogs/my-new-blog-topic/
\`\`\`

### Step 2: Create index.html
Copy this template and modify it:

\`\`\`html
<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Your Blog Title</title>
    <link rel="stylesheet" href="../../css/blog-post.css" />
  </head>
  <body>
    <header>
      <a href="/blogs.html" class="back-link">&lt; Back to Blogs</a>
      <h1>Your Blog Title</h1>
      <div class="meta">Posted on YYYY-MM-DD</div>
    </header>

    <article class="blog-content">
      <p>Introduction paragraph...</p>

      <h2>Section 1</h2>
      <p>Content here...</p>
      
      <img src="path/to/image.jpg" alt="Description" />
      
      <h2>Section 2</h2>
      <ul>
        <li>List item 1</li>
        <li>List item 2</li>
      </ul>
    </article>

    <footer>
      <a href="/blogs.html" class="back-link">← Back to Blog Archive</a>
    </footer>
  </body>
</html>
\`\`\`

### Step 3: Update Blog Links
Add your blog entry to the \`blogLinks\` object in \`/js/script.js\`:

\`\`\`javascript
"Your Blog Title": "/blogs/my-new-blog-topic/",
\`\`\`

### Step 4: Update Blog Search Data
Add your blog to the \`blogs\` array in \`/js/blog-search.js\`:

\`\`\`javascript
{
  id: "my-new-blog-topic",
  title: "Your Blog Title",
  date: "2026-04-25",
  excerpt: "Brief description of your blog post",
  url: "/blogs/my-new-blog-topic/"
}
\`\`\`

## Using Markdown to HTML Converter

The \`markdown-converter.js\` utility can convert markdown syntax to HTML:

### Supported Markdown Syntax

| Markdown | HTML |
|----------|------|
| # Title | \`<h1>Title</h1>\` |
| ## Subtitle | \`<h2>Subtitle</h2>\` |
| \*\*bold\*\* | \`<strong>bold</strong>\` |
| \*italic\* | \`<em>italic</em>\` |
| \`code\` | \`<code>code</code>\` |
| \`\`\`code block\`\`\` | \`<pre><code>block</code></pre>\` |
| ![alt](url) | \`<img src="url" alt="alt" />\` |
| [link](url) | \`<a href="url">link</a>\` |
| - item | \`<li>item</li>\` |

### Example Usage

\`\`\`javascript
// Import the converter
const markdown = \`
# My Blog Post

This is **bold** and *italic* text.

## Section
- Point 1
- Point 2

![Screenshot](./image.jpg)
\`;

const html = MarkdownConverter.convert(markdown);
\`\`\`

## Image Handling

Images are automatically converted to styled HTML tags:
- All images are centered on the page
- Images have a green border matching the pixel art aesthetic
- Image alt text is preserved for accessibility
- Responsive sizing with max-width: 100%

### Adding Images

Place images in the same directory as the blog post HTML, then reference:

\`\`\`html
<img src="./screenshot.jpg" alt="Screenshot description" />
\`\`\`

## Styling

### Blog Post CSS Classes

- \`.blog-content\` - Main article container, centered with max-width
- \`.back-link\` - Navigation links with pixel art styling
- \`.meta\` - Date and metadata styling
- \`article.blog-content h2\` - Section headers
- \`article.blog-content p\` - Paragraphs with justified text
- \`article.blog-content li\` - List items with ">>" prefix
- \`article.blog-content img\` - Centered, responsive images

### Archive CSS Classes

- \`.blog-item\` - Individual blog card in archive
- \`.search-bar\` - Search input with pixel art styling
- \`.blog-list\` - Container for blog items
- \`.no-results\` - Message when no search results found

## Search Functionality

The blog archive page includes real-time search by title:
- Type in the search box to filter blogs
- Results update instantly as you type
- Shows count of matching blogs
- Case-insensitive matching
- Click any blog card to view full post

## Color Scheme

All blog pages use the cybersecurity pixel art theme:
- Background: #000000 (black)
- Text: #00ff00 (bright green)
- Borders: #00ff00 with glow effects
- Secondary text: #00aa00, #00cc00 (darker greens)
- Links: #00ff00 with hover effects

## Performance Tips

1. Keep image sizes reasonable (compress before uploading)
2. Use descriptive alt text for images
3. Break content into sections with headers
4. Use lists for better readability
5. Test links before publishing

## SEO and Meta Tags

For better search engine optimization, update:

\`\`\`html
<title>Blog Title - Cybersecurity Portfolio</title>
<meta name="description" content="Brief description of blog post" />
<meta name="keywords" content="cybersecurity, pentesting, etc" />
\`\`\`

## Troubleshooting

### Blog not appearing in archive
- Check that blog entry is added to \`blogs\` array in \`blog-search.js\`
- Verify the URL matches the directory name

### Images not showing
- Confirm image path is correct (use ./ for same directory)
- Verify image file exists
- Check browser console for 404 errors

### Search not working
- Ensure blog title matches between search data and actual content
- Clear browser cache and reload

---

For more information or updates, see the main website at \`/index.html\`
