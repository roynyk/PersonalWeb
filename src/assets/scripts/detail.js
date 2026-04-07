// Ambil id dari elemen HTML tersembunyi yang disalurkan oleh Express
const projectIdElement = document.getElementById("hidden-id");
const projectId = projectIdElement ? projectIdElement.textContent : null;

// ambil data dari localStorage
let projects = JSON.parse(localStorage.getItem("projects")) || [];

// cari project berdasarkan id
const project = projects.find((item) => item.id == projectId);

// function durasi
function getDuration(start, end) {
  const startDate = new Date(start);
  const endDate = new Date(end);

  let months =
    (endDate.getFullYear() - startDate.getFullYear()) * 12 +
    (endDate.getMonth() - startDate.getMonth());

  if (months <= 0) return "0 bulan";
  return months + " bulan";
}

// render icon teknologi
function renderTechIcons(techs) {
  let icons = "";

  techs.forEach((tech) => {
    if (tech === "node") {
      icons += `
        <div class="tech-item">
            <i class="fab fa-node-js"></i>
            <span>Node JS</span>
        </div>`;
    }
    if (tech === "react") {
      icons += `
        <div class="tech-item">
            <i class="fab fa-react"></i>
            <span>React JS</span>
        </div>`;
    }
    if (tech === "javascript") {
      icons += `
        <div class="tech-item">
            <i class="fab fa-js"></i>
            <span>JavaScript</span>
        </div>`;
    }
    if (tech === "bootstrap") {
      icons += `
        <div class="tech-item">
            <i class="fab fa-bootstrap"></i>
            <span>Bootstrap</span>
        </div>`;
    }
  });

  return icons;
}

// kalau project ketemu
if (project) {
  document.getElementById("project-title").innerText = project.name;

  document.getElementById("project-image").src = project.image;

  document.getElementById("project-date").innerHTML += `
    ${project.startDate} - ${project.endDate}
  `;

  document.getElementById("project-duration").innerHTML += `
    ${getDuration(project.startDate, project.endDate)}
  `;

  document.getElementById("project-tech").innerHTML = renderTechIcons(
    project.technologies,
  );

  document.getElementById("project-description").innerText =
    project.description;
} else {
  document.body.innerHTML =
    "<h1 class='text-center mt-5'>Project tidak ditemukan</h1>";
}
