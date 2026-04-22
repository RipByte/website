// Blog data
const blogs = [
  // {
  //   id: "macro-pad-x1-development",
  //   title: "MacroPad-X1",
  //   date: "2026-04-20",
  //   excerpt:
  //     "Understanding zero-day exploits and how to protect against them.",
  //   url: "/blogs/zero-day-vulnerabilities/"
  // }
];

// DOM elements
const searchInput = document.getElementById("searchInput");
const blogList = document.getElementById("blogList");
const searchInfo = document.getElementById("searchInfo");

// Initialize
document.addEventListener("DOMContentLoaded", () => {
  displayBlogs(blogs);
  setupSearch();
});

function displayBlogs(blogsToDisplay) {
  blogList.innerHTML = "";

  if (blogsToDisplay.length === 0) {
    blogList.innerHTML =
      '<div class="no-results">No blogs found. Try a different search term.</div>';
    searchInfo.textContent = "No results";
    return;
  }

  blogsToDisplay.forEach((blog) => {
    const blogItem = document.createElement("a");
    blogItem.href = blog.url;
    blogItem.className = "blog-item";
    blogItem.innerHTML = `
      <h3>${blog.title}</h3>
      <div class="blog-date">${blog.date}</div>
      <div class="blog-excerpt">${blog.excerpt}</div>
    `;
    blogList.appendChild(blogItem);
  });

  searchInfo.textContent = `Showing ${blogsToDisplay.length} of ${blogs.length} blogs`;
}

function setupSearch() {
  searchInput.addEventListener("input", (e) => {
    const searchTerm = e.target.value.toLowerCase().trim();

    if (searchTerm === "") {
      displayBlogs(blogs);
      return;
    }

    const filteredBlogs = blogs.filter((blog) =>
      blog.title.toLowerCase().includes(searchTerm)
    );

    displayBlogs(filteredBlogs);
  });
}
