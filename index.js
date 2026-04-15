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
import upload from "./middleware/multer.js";
import { handleUploadError } from "./middleware/uploadErrorHandler.js";

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
app.use("/uploads", express.static("./src/assets/uploads"));


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
app.post("/my-project", isAuthenticated, handleUploadError(upload.single("image")), (req, res) =>
  createProject(req, res, db),
);
app.get("/my-project/edit/:id", isAuthenticated, (req, res) =>
  getEditProject(req, res, db),
);
app.post("/my-project/edit/:id", isAuthenticated, handleUploadError(upload.single("image")), (req, res) =>
  updateProject(req, res, db),
);
app.post("/my-project/delete/:id", isAuthenticated, (req, res) =>
  deleteProject(req, res, db),
);
app.post("/register", (req, res) => register(req, res, db));
app.post("/login", (req, res) => login(req, res, db));
// AUTH
app.get("/login", (req, res) => {
  res.render("login", {
    title: "Login Page",
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


app.listen(port, () => {
  console.log(`Example app listening on port ${port}`);
});
