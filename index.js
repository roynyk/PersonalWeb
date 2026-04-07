import express from "express";
import { engine } from "express-handlebars";

const app = express();
const port = 3000;

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

app.get("/", (req, res) => {
  res.render("home");
});

app.get("/contact", (req, res) => {
  res.render("contact");
});

app.get("/my-project", (req, res) => {
  res.render("my-project");
});

app.get("/detail/:id", (req, res) => {
  res.render("detail", { id: req.params.id, isDetail: true });
});

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`);
});
