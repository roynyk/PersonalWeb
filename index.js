import express from "express";
import { engine } from "express-handlebars";
import { db } from "./src/config/database.js";
import flash from "express-flash";
import {
  getProjects,
  getProjectById,
  getEditProject,
  createProject,
  updateProject,
  deleteProject,
} from "./src/controllers/projectController.js";
import session from "express-session";
import { register, login, logout } from "./src/controllers/authController.js";
import { isAuthenticated } from "./middleware/auth.js";

const app = express();
const port = 3000;

// ini tuh supaya backend (express) bisa baca data dari frontend
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// SETUP SESSION
app.use(
  session({
    secret: "my-secret-key", // Secret key untuk encrypt session ID
    resave: false, // Don't save session if unmodified
    saveUninitialized: false, // Don't create session until something stored
    cookie: {
      maxAge: 1000 * 60 * 60 * 24, // Session expires in 1 hour
      httpOnly: true, // Cookie hanya bisa diakses oleh server
    },
  }),
);

// SETUP FLASH MESSAGE
app.use(flash());

// ===== MIDDLEWARE - Make session available in all templates =====
app.use((req, res, next) => {
  res.locals.user = req.session.user || null; // Current user
  res.locals.success = req.flash("success"); // Success messages
  res.locals.error = req.flash("error"); // Error messages
  next();
});

// SETUP EXPRESS-HANDLEBARS
app.engine(
  "hbs",
  engine({
    extname: ".hbs",
    defaultLayout: "main",
    layoutsDir: "./src/views/layouts",
    partialsDir: "./src/views/partials",
  }),
);

// SETUP VIEW ENGINE
app.set("view engine", "hbs");
app.set("views", "./src/views");

// setup hbs biasa
// hbs.registerPartials("./src/views/partials");

// middleware untuk mengakses file statis
app.use("/assets", express.static("./src/assets"));

// const projects = [
//   {
//     id: 1,
//     name: "Project 1",
//     startDate: "2022-01-01",
//     endDate: "2022-02-01",
//     duration: "1 Bulan",
//     description: "Description 1",
//     hasNode: true,         // <-- Ganti technologies jadi seperti ini
//     hasReact: true,
//     hasJavaScript: false,
//     hasBootstrap: false,
//   },
//   {
//     id: 2,
//     name: "Project 2",
//     startDate: "2022-01-01",
//     endDate: "2022-04-01",
//     duration: "3 Bulan",
//     description: "Description 2",
//     hasNode: true,
//     hasReact: false,
//     hasJavaScript: true,
//     hasBootstrap: false,
//   },
// ];

// Data Storage Sementara
let projects = [];
let projectId = 1;

function getDuration(start, end) {
  const startDate = new Date(start);
  const endDate = new Date(end);

  let months =
    (endDate.getFullYear() - startDate.getFullYear()) * 12 +
    (endDate.getMonth() - startDate.getMonth());

  if (months <= 0) return "0 bulan";
  return months + " bulan";
}

// function getProjects() {
//   return new Promise((resolve, reject) => {
//     setTimeout(() => {
//       resolve(projects);
//     }, 2000);
//   });
// }

app.get("/", (req, res) => {
  res.render("home", {
    title: "Home",
    user: req.session.user, // Kirim data user dari session ke view
  });
});

app.get("/contact", (req, res) => {
  res.render("contact", {
    title: "Contact",
  });
});

app.get("/my-project", (req, res) => getProjects(req, res, db));
app.get("/my-project/:id", (req, res) => getProjectById(req, res, db));
app.post("/my-project", isAuthenticated, (req, res) =>
  createProject(req, res, db),
);
app.get("/my-project/edit/:id", isAuthenticated, (req, res) =>
  getEditProject(req, res, db),
);
app.post("/my-project/edit/:id", isAuthenticated, (req, res) =>
  updateProject(req, res, db),
);
app.post("/my-project/delete/:id", isAuthenticated, (req, res) =>
  deleteProject(req, res, db),
);
app.post("/register", (req, res) => register(req, res, db));
app.post("/login", (req, res) => login(req, res, db));
// AUTH
app.get("/login", (req, res) => {
  const flash = req.session.flash;
  delete req.session.flash; // Hapus flash setelah ditampilkan
  res.render("login", {
    title: "Login Page",
    flash,
  });
});

app.get("/register", (req, res) => {
  res.render("register", {
    title: "register page",
  });
});

app.get("/logout", (req, res) => {
  logout(req, res);
});

// app.get("/my-project", (req, res) => {
//   try {
//     res.render("my-project", {
//       title: "My Project",
//       projects: projects,
//     });
//   } catch (error) {
//     console.log(error);
//     res.status(500).send("Internal Server Error");
//   }
// });

app.get("/my-project/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const projectId = parseInt(id);
    const project = projects.find((p) => p.id == projectId);

    if (!project) {
      return res.status(404).send("Project not found");
    }
    res.render("detail", {
      title: "Detail Project",
      project: project,
    });
  } catch (error) {
    console.log(error);
    res.status(500).send("Internal Server Error");
  }
});

app.get("/my-project/edit/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const projectId = parseInt(id);
    const project = projects.find((p) => p.id == projectId);

    if (!project) {
      return res.status(404).send("Project not found");
    }
    res.render("edit-project", {
      title: "Edit Project",
      project: project,
    });
  } catch (error) {
    console.log(error);
    res.status(500).send("Internal Server Error");
  }
});

app.post("/my-project/edit/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const projectId = parseInt(id);

    const { projectName, startDate, endDate, description, technologies } =
      req.body;

    const projectIndex = projects.findIndex((p) => p.id === projectId);
    if (projectIndex === -1) {
      return res.status(404).send("Project not found");
    }

    // Update data project
    projects[projectIndex] = {
      ...projects[projectIndex],
      name: projectName,
      startDate: startDate,
      endDate: endDate,
      duration: getDuration(startDate, endDate),
      description: description,
      hasNode: (technologies || []).includes("node"),
      hasReact: (technologies || []).includes("react"),
      hasJavaScript: (technologies || []).includes("javascript"),
      hasBootstrap: (technologies || []).includes("bootstrap"),
    };

    res.redirect("/my-project");
  } catch (error) {
    console.log(error);
    res.status(500).send("Internal Server Error");
  }
});

app.post("/my-project", async (req, res) => {
  try {
    const { projectName, startDate, endDate, description, technologies } =
      req.body;

    //validation
    if (
      !projectName ||
      !startDate ||
      !endDate ||
      !description ||
      !technologies
    ) {
      return res.status(400).send("Semua field harus diisi");
    }

    const newProject = {
      id: projectId++,
      name: projectName,
      startDate: startDate,
      endDate: endDate,
      duration: getDuration(startDate, endDate),
      description: description,
      hasNode: (technologies || []).includes("node"),
      hasReact: (technologies || []).includes("react"),
      hasJavaScript: (technologies || []).includes("javascript"),
      hasBootstrap: (technologies || []).includes("bootstrap"),
    };

    await new Promise((resolve) => setTimeout(resolve, 1000));
    projects.push(newProject);

    console.log(projectName, startDate, endDate, description, technologies);
    res.redirect("/my-project");
  } catch (error) {
    console.error("Error : ", error);
    res.send("Error adding project");
  }
});

app.post("/my-project/delete/:id", (req, res) => {
  const { id } = req.params;
  const projectId = parseInt(id);

  // Mentor Anda benar! Karena array, kita bisa me-reassign array-nya pakai .filter
  projects = projects.filter((p) => p.id !== projectId);

  // Setelah sukses dihapus, kembalikan ke UI My Project
  res.redirect("/my-project");
});

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`);
});
