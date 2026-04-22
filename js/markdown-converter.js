// Simple Markdown to HTML Converter for Blog Posts
// This utility converts basic markdown syntax to HTML with cybersecurity styling

class MarkdownConverter {
  static convert(markdown) {
    let html = markdown;

    // Headers
    html = html.replace(/^### (.*?)$/gm, "<h3>$1</h3>");
    html = html.replace(/^## (.*?)$/gm, "<h2>$1</h2>");
    html = html.replace(/^# (.*?)$/gm, "<h1>$1</h1>");

    // Bold
    html = html.replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>");
    html = html.replace(/__(.+?)__/g, "<strong>$1</strong>");

    // Italic
    html = html.replace(/\*(.*?)\*/g, "<em>$1</em>");
    html = html.replace(/_(.+?)_/g, "<em>$1</em>");

    // Code blocks
    html = html.replace(/```(.*?)```/gs, "<pre><code>$1</code></pre>");

    // Inline code
    html = html.replace(/`(.+?)`/g, "<code>$1</code>");

    // Images - converted to styled img tags
    html = html.replace(/!\[(.*?)\]\((.*?)\)/g, '<img src="$2" alt="$1" />');

    // Links
    html = html.replace(/\[(.*?)\]\((.*?)\)/g, '<a href="$2">$1</a>');

    // Unordered lists
    html = html.replace(/^[\*\-] (.*?)$/gm, "<li>$1</li>");
    html = html.replace(/(<li>.*?<\/li>)/s, "<ul>$1</ul>");

    // Ordered lists
    html = html.replace(/^\d+\. (.*?)$/gm, "<li>$1</li>");

    // Paragraphs
    const lines = html.split("\n");
    let inBlock = false;
    let result = [];

    for (let line of lines) {
      if (line.trim() === "") {
        if (!inBlock && result.length > 0) {
          // Join accumulated lines into a paragraph
          const lastItem = result[result.length - 1];
          if (
            lastItem &&
            !lastItem.match(/^<[h|p|ul|ol|li|pre|blockquote]/)
          ) {
            result[result.length - 1] = `<p>${lastItem}</p>`;
          }
        }
        inBlock = false;
      } else if (
        !line.match(/^<[h|p|ul|ol|li|pre|blockquote|img]/) &&
        !inBlock
      ) {
        inBlock = true;
        result.push(line);
      } else {
        if (inBlock && !line.match(/^<[h|p|ul|ol|li|pre|blockquote|img]/)) {
          result[result.length - 1] += "\n" + line;
        } else {
          result.push(line);
        }
        inBlock = !line.match(/^<[h|p|ul|ol|li|pre|blockquote|img]/);
      }
    }

    html = result.join("\n");

    // Fix list formatting
    html = html.replace(/<ul>\n<li>/g, "<ul>\n<li>");
    html = html.replace(/<\/li>\n<\/ul>/g, "</li>\n</ul>");

    return html;
  }

  static convertFile(markdown) {
    return this.convert(markdown);
  }
}

// Export for use in blog posts
if (typeof module !== "undefined" && module.exports) {
  module.exports = MarkdownConverter;
}

// Example usage:
/*
const markdown = `
# Blog Title

This is a paragraph with **bold** and *italic* text.

## Section 1

- List item 1
- List item 2
- List item 3

\`\`\`
code block example
\`\`\`

![Image Alt](path/to/image.jpg)

[Link Text](https://example.com)
`;

const html = MarkdownConverter.convert(markdown);
console.log(html);
*/
