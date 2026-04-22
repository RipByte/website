// Blog data for linking
const blogLinks = {
  "Getting Started with Pixel Art Web Design": "/blogs/zero-day-vulnerabilities/",
  "Zero-Day Vulnerabilities Explained": "/blogs/zero-day-vulnerabilities/",
  "Responsive Pixel Art Grids": "/blogs/advanced-persistent-threats/",
  "Advanced Persistent Threats (APT) Detection": "/blogs/advanced-persistent-threats/",
  "Color Theory in Pixel Art": "/blogs/cryptographic-algorithms/",
  "Cryptographic Algorithms: Past, Present, Future": "/blogs/cryptographic-algorithms/",
  "Animation in Pixel Art Websites": "/blogs/ransomware-response/",
  "Ransomware Response and Recovery": "/blogs/ransomware-response/",
  "Typography in Retro Design": "/blogs/osint-techniques/",
  "OSINT Techniques for Threat Intelligence": "/blogs/osint-techniques/",
  "CSS Grid vs Flexbox for Pixel Art Layouts": "/blogs/red-team-blue-team/",
  "Red Team vs Blue Team: Offensive Security Testing": "/blogs/red-team-blue-team/",
  "Performance Optimization for Pixel Art Websites": "/blogs/siem-implementation/",
  "SIEM Implementation and Log Analysis": "/blogs/siem-implementation/",
  "Building Your First Retro Game Website": "/blogs/cloud-security/",
  "Cloud Security: AWS, Azure, GCP Best Practices": "/blogs/cloud-security/",
  "Dark Mode and Pixel Art Harmony": "/blogs/supply-chain-security/",
  "Supply Chain Security and Software Integrity": "/blogs/supply-chain-security/"
};

// Load blog posts
async function loadBlogPosts() {
  const blogGrid = document.querySelector(".blog-grid");
  const blogFiles = [
    "first-post.json",
    "second-post.json",
    "third-post.json",
    "fourth-post.json",
    "fifth-post.json",
    "sixth-post.json",
    "seventh-post.json",
    "eighth-post.json",
    "ninth-post.json"
  ];

  for (const file of blogFiles) {
    try {
      const response = await fetch(`./blog/${file}`);
      const post = await response.json();
      const blogCard = createBlogCard(post);
      blogGrid.appendChild(blogCard);
    } catch (error) {
      console.error(`Error loading ${file}:`, error);
    }
  }
}

function createBlogCard(post) {
  const card = document.createElement("div");
  card.className = "blog-card";
  const blogUrl = blogLinks[post.title] || "/blogs.html";
  
  card.innerHTML = `
    <div class="blog-card-title">${post.title}</div>
    <div class="blog-card-date">${post.date}</div>
    <div class="blog-card-excerpt">${post.excerpt}</div>
  `;
  
  card.style.cursor = "pointer";
  card.addEventListener("click", () => {
    window.location.href = blogUrl;
  });
  
  return card;
}

// Load skills
async function loadSkills() {
  try {
    const response = await fetch("./json/skills.json");
    const skills = await response.json();
    const skillsContainer = document.querySelector(".skills-container");

    skills.forEach((skill) => {
      const skillItem = document.createElement("div");
      skillItem.className = "skill-item";
      skillItem.innerHTML = `
        <div class="skill-name">
          <span>${skill.name}</span>
          <span class="skill-level">${skill.level}%</span>
        </div>
        <div class="skill-bar-container">
          <div class="skill-bar" style="width: 0%;"></div>
        </div>
      `;
      skillsContainer.appendChild(skillItem);

      // Animate skill bar on view
      const observer = new IntersectionObserver((entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const skillBar = entry.target.querySelector(".skill-bar");
            skillBar.style.width = skill.level + "%";
            observer.unobserve(entry.target);
          }
        });
      });
      observer.observe(skillItem);
    });
  } catch (error) {
    console.error("Error loading skills:", error);
  }
}

// Initialize
document.addEventListener("DOMContentLoaded", () => {
  loadBlogPosts();
  loadSkills();
});
