// ambil data project dari localstorage
let projects = JSON.parse(localStorage.getItem("projects")) || [];

// function render project nya
function renderProjects(data = projects) {
  const container = document.getElementById("project-list");
  container.innerHTML = "";

  data.map((project) => {
    container.innerHTML += `
      <div class="col-md-4">
        <div class="card shadow-sm h-100">
          <img src="${project.image}" class="card-img-top" />

          <div class="card-body d-flex flex-column">
            <h5 class="card-title">${project.name}</h5>
            <small class="text-muted mb-2">
              durasi: ${getDuration(project.startDate, project.endDate)}
            </small>

            <p class="card-text">
              ${truncateText(project.description, 60)}
            </p>

            <div class="mb-3">
              ${renderTechIcons(project.technologies)}
            </div>

            <a href="/detail/${project.id}" 
               style="font-size: 14px; text-decoration: none; margin-bottom: 10px;">
               detail project
            </a>

            <div class="mt-auto d-flex gap-2 mt-2">
              <button class="btn btn-dark w-50">edit</button>
              <button class="btn btn-outline-dark w-50" onclick="deleteProject(${project.id})">delete</button>
            </div>
          </div>
        </div>
      </div>
    `;
  });
}

function truncateText(text, maxLength) {
  if (text.length <= maxLength) return text;

  return text.substring(0, maxLength) + "...";
}

// function filter projects berdasarkan teknologi
function filterProjects(tech) {

  const filterButtonsContainer = document.getElementById("filter-buttons");
  if (filterButtonsContainer) {
    const buttons = filterButtonsContainer.querySelectorAll("button");

    buttons.forEach((btn) => {
      btn.classList.remove("my-btn");
      btn.classList.add("my-btn-outline");
    });


    const activeButton = document.getElementById(`btn-${tech}`);
    if (activeButton) {
      activeButton.classList.remove("my-btn-outline");
      activeButton.classList.add("my-btn");
    }
  }

  if (tech === "all") {
    renderProjects(projects);
  } else {
    const filteredProjects = projects.filter((project) => {
      return project.technologies?.includes(tech);
    });

    renderProjects(filteredProjects);
  }
}

// function delete all projects
function deleteAllProjects() {
  const confirmDelete = confirm("Yakin mau hapus semua project?");

  if (confirmDelete) {
    projects = [];
    localStorage.removeItem("projects");
    renderProjects();
  }
}

// function delete per project
function deleteProject(id) {
  projects = projects.filter((project) => project.id !== id);
  localStorage.setItem("projects", JSON.stringify(projects));
  renderProjects();
}

// hitung durasi
function getDuration(start, end) {
  const startDate = new Date(start);
  const endDate = new Date(end);

  let months =
    (endDate.getFullYear() - startDate.getFullYear()) * 12 +
    (endDate.getMonth() - startDate.getMonth());

  if (months <= 0) return "0 bulan";
  return months + " bulan";
}

// icon tech
function renderTechIcons(techs) {
  let icons = "";

  techs.forEach((tech) => {
    if (tech === "node") {
      icons += `<i class="fab fa-node-js me-2"></i>`;
    }
    if (tech === "react") {
      icons += `<i class="fab fa-react me-2"></i>`;
    }
    if (tech === "javascript") {
      icons += `<i class="fab fa-js me-2"></i>`;
    }
    if (tech === "bootstrap") {
      icons += `<i class="fab fa-bootstrap me-2"></i>`;
    }
  });

  return icons;
}

// handle submit form
const form = document.querySelector("form");

form.addEventListener("submit", function (event) {
  event.preventDefault();

  const formData = new FormData(form);

  const name = formData.get("projectName");
  const startDate = formData.get("startDate");
  const endDate = formData.get("endDate");
  const description = formData.get("description");
  const technologies = formData.getAll("technologies");

  const imageFile = formData.get("image");

  // bagian render gambar
  const reader = new FileReader();

  reader.onload = function () {
    const image = reader.result;

    const newProject = {
      id: Date.now(),
      name,
      startDate,
      endDate,
      description,
      technologies,
      image,
    };

    projects.push(newProject);

    localStorage.setItem("projects", JSON.stringify(projects));

    renderProjects();
    form.reset();
  };

  if (imageFile && imageFile.size > 0) {
    reader.readAsDataURL(imageFile);
  } else {
    const newProject = {
      id: Date.now(),
      name,
      startDate,
      endDate,
      description,
      technologies,
      image: "",
    };

    projects.push(newProject);
    localStorage.setItem("projects", JSON.stringify(projects));
    renderProjects();
    form.reset();
  }
});

// initial render
renderProjects();
