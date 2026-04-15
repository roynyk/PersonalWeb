import fs from "fs";

// Fungsi bantuan untuk menghitung durasi
function getDuration(start, end) {
  const startDate = new Date(start);
  const endDate = new Date(end);

  let months =
    (endDate.getFullYear() - startDate.getFullYear()) * 12 +
    (endDate.getMonth() - startDate.getMonth());
  if (months <= 0) return "0 bulan";
  return months + " Bulan";
}

const techMap = {
  node: 1,
  react: 2,
  javascript: 3,
  bootstrap: 4,
};

export async function getProjects(req, res, db) {
  try {
    const { tech } = req.query;

    // MENGHITUNG DULU, Apakah database kosongan?
    const checkTotalQuery = "SELECT COUNT(*) FROM projects";
    const checkTotalResult = await db.query(checkTotalQuery);
    const hasAnyProject = parseInt(checkTotalResult.rows[0].count) > 0;

    let query = "SELECT * FROM projects ORDER BY created_at DESC";
    let queryParams = [];

    // JIKA ADA FILTER DARI URL:
    if (tech && techMap[tech]) {
      const techId = techMap[tech];
      query = `
        SELECT projects.* 
        FROM projects
        JOIN project_technologies ON projects.id = project_technologies.project_id
        WHERE project_technologies.technology_id = $1
        ORDER BY projects.created_at DESC
      `;
      queryParams = [techId];
    }

    const result = await db.query(query, queryParams);
    const projects = result.rows;

    for (let i = 0; i < projects.length; i++) {
      const project = projects[i];

      project.duration = getDuration(project.start_date, project.end_date);
      if (project.description && project.description.length > 60) {
        project.description = project.description.substring(0, 60) + "...";
      }

      // Ambil List Teknologinya
      const techQuery = `
                SELECT technologies.name 
                FROM project_technologies 
                JOIN technologies ON project_technologies.technology_id = technologies.id 
                WHERE project_technologies.project_id = $1
            `;
      const techResult = await db.query(techQuery, [project.id]);
      const techNames = techResult.rows.map((row) => row.name.toLowerCase());

      project.hasNode = techNames.includes("node js");
      project.hasReact = techNames.includes("react js");
      project.hasJavaScript = techNames.includes("javascript");
      project.hasBootstrap = techNames.includes("bootstrap");
    }

    // Mengirim 3 data penting ke Handlebars
    res.render("my-project", {
      projects: projects,
      hasAnyProject: hasAnyProject,
      filterTech: tech,
      isNode: tech === "node",
      isReact: tech === "react",
      isJs: tech === "javascript",
      isBootstrap: tech === "bootstrap"
    });

  } catch (error) {
    console.error("Gagal mengambil data projects dari database:", error);
    req.flash("error", "Terjadi kesalahan saat mengambil database");
    res.redirect("/");
  }
}


export async function getProjectById(req, res, db) {
  try {
    const { id } = req.params;
    const query = "SELECT * FROM projects WHERE id = $1";
    const result = await db.query(query, [id]);

    if (result.rows.length === 0) {
      return res.send("Project not found");
    }

    const project = result.rows[0];

    project.startDate = project.start_date.toISOString().split("T")[0];
    project.endDate = project.end_date.toISOString().split("T")[0];
    project.duration = getDuration(project.start_date, project.end_date);

    //Ambil List Teknologi
    const techQuery = `
            SELECT technologies.name 
            FROM project_technologies 
            JOIN technologies ON project_technologies.technology_id = technologies.id 
            WHERE project_technologies.project_id = $1
        `;
    const techResult = await db.query(techQuery, [id]);
    const techNames = techResult.rows.map((row) => row.name.toLowerCase());

    project.hasNode = techNames.includes("node js");
    project.hasReact = techNames.includes("react js");
    project.hasJavaScript = techNames.includes("javascript");
    project.hasBootstrap = techNames.includes("bootstrap");

    res.render("detail", { title: "Detail Project", project: project });
  } catch (error) {
    console.error("Gagal mengambil data project dari database:", error);
    res.send("Terjadi kesalahan pada server");
  }
}

export async function createProject(req, res, db) {
  try {
    const { projectName, startDate, endDate, description } = req.body;
    let { technologies } = req.body;

    const user_id = req.session.user.id; // Ambil user_id dari session

    const image = req.file ? req.file.filename : null;

    if (
      !projectName ||
      !startDate ||
      !endDate ||
      !description ||
      !technologies ||
      !image
    ) {
      req.flash("error", "Gagal: Semua kolom form wajib diisi!");
      return res.redirect("/my-project");
    }

    const projectQuery = `
            INSERT INTO projects (user_id, name, start_date, end_date, description, image) 
            VALUES ($1, $2, $3, $4, $5, $6) 
            RETURNING id
        `;
    const projectResult = await db.query(projectQuery, [
      user_id,
      projectName,
      startDate,
      endDate,
      description,
      image,
    ]);
    const newProjectId = projectResult.rows[0].id;

    req.flash("success", "Project berhasil ditambahkan");

    // teknologi agar bisa lebih dari 1
    if (technologies) {
      // walaupun cuma 1, tetap diubah jadi array biar bisa di-looping
      if (typeof technologies === "string") {
        technologies = [technologies];
      }

      // Masukkan relasi datanya ke tabel project_technologies
      for (let i = 0; i < technologies.length; i++) {
        const techName = technologies[i]; // Ambil nama teknologinya ('node', 'react', dll)
        const techId = techMap[techName]; // Ubah namanya jadi angka/ID

        if (techId) {
          const relationQuery =
            "INSERT INTO project_technologies (project_id, technology_id) VALUES ($1, $2)";
          await db.query(relationQuery, [newProjectId, techId]);
        }
      }
    }

    res.redirect("/my-project");
  } catch (error) {
    req.flash("error", "Gagal menambahkan project");
    console.error("Gagal menambahkan project ke database:", error);
    res.redirect("/my-project");
  }
}

export async function getEditProject(req, res, db) {
  try {
    const { id } = req.params;

    const projectQuery = "SELECT * FROM projects WHERE id = $1";
    const projectResult = await db.query(projectQuery, [id]);

    if (projectResult.rows.length === 0) {
      return res.send("Project not found");
    }

    const project = projectResult.rows[0];

    project.startDate = project.start_date.toISOString().split("T")[0];
    project.endDate = project.end_date.toISOString().split("T")[0];

    // Ambil data teknologi apa saja yang dimiliki project ini dari tabel berelasi
    const techQuery = `
            SELECT technologies.name 
            FROM project_technologies 
            JOIN technologies ON project_technologies.technology_id = technologies.id 
            WHERE project_technologies.project_id = $1
        `;
    const techResult = await db.query(techQuery, [id]);

    // Membentuk array sederhana yang isinya cuma teks misal: ['node', 'react']
    const techNames = techResult.rows.map((row) => row.name.toLowerCase());

    // Menyuntikkan status centang secara logis
    project.hasNode = techNames.includes("node js");
    project.hasReact = techNames.includes("react js");
    project.hasJavaScript = techNames.includes("javascript");
    project.hasBootstrap = techNames.includes("bootstrap");

    res.render("edit-project", {
      title: "Edit Project",
      project: project,
    });
  } catch (error) {
    console.error("Gagal mengambil data untuk edit project:", error);
    res.send("Terjadi kesalahan pada server");
  }
}

export async function updateProject(req, res, db) {
  try {
    const { id } = req.params;
    const { projectName, startDate, endDate, description } = req.body;
    let { technologies } = req.body;
    const user_id = req.session.user.id; // Ambil user_id dari session
    const image = req.file ? req.file.filename : null;

    if (
      !projectName ||
      !startDate ||
      !endDate ||
      !description ||
      !technologies
    ) {
      req.flash("error", "Ubah project gagal: Kolom tidak boleh dikosongkan!");
      return res.redirect(`/my-project/edit/${id}`);
    }

    // Cek dulu project-nya ada atau tidak & milik user tersebut
    const checkQuery = "SELECT image FROM projects WHERE id = $1 AND user_id = $2";
    const checkResult = await db.query(checkQuery, [id, user_id]);

    if (checkResult.rows.length === 0) {
      req.flash(
        "error",
        "Kamu tidak memiliki izin untuk mengedit project ini!",
      );
      return res.redirect(`/my-project`);
    }

    // Jika ada file baru yang diunggah, hapus file lama
    if (req.file) {
      const oldImage = checkResult.rows[0].image;
      if (oldImage) {
        const oldImagePath = `src/assets/uploads/${oldImage}`;
        if (fs.existsSync(oldImagePath)) {
          fs.unlinkSync(oldImagePath);
          console.log(`File lama ${oldImage} berhasil dihapus karena ada update foto baru`);
        }
      }
    }

    const updateQuery = `
            UPDATE projects 
            SET name = $1, start_date = $2, end_date = $3, description = $4, image = COALESCE($5, image) 
            WHERE id = $6 AND user_id = $7
        `;
    const values = [projectName, startDate, endDate, description, image, id, user_id];
    await db.query(updateQuery, values);


    //Hapus semua teknologi lama yang nempel di tabel project_technologies
    const deleteTechQuery =
      "DELETE FROM project_technologies WHERE project_id = $1";
    await db.query(deleteTechQuery, [id]);

    //Masukkan teknologi yang baru dicentang user (Mirip seperti createProject)
    if (technologies) {
      if (typeof technologies === "string") {
        technologies = [technologies];
      }

      for (let i = 0; i < technologies.length; i++) {
        const techName = technologies[i];
        const techId = techMap[techName];

        if (techId) {
          const relationQuery =
            "INSERT INTO project_technologies (project_id, technology_id) VALUES ($1, $2)";
          await db.query(relationQuery, [id, techId]);
        }
      }
    }

    req.flash("success", "Project berhasil diupdate");
    res.redirect("/my-project");
  } catch (error) {
    req.flash("error", "Gagal mengupdate project");
    console.error("Gagal mengupdate project:", error);
    res.redirect("/my-project");
  }
}

export async function deleteProject(req, res, db) {
  try {
    const { id } = req.params;
    const userId = req.session.user.id;

    // Ambil data project (untuk ambil file name)
    const selectQuery = "SELECT * FROM projects WHERE id = $1 AND user_id = $2";
    const result = await db.query(selectQuery, [id, userId]);

    if (result.rows.length === 0) {
      req.flash(
        "error",
        "Kamu tidak memiliki izin untuk menghapus project ini!",
      );
      return res.redirect(`/my-project`);
    }

    const project = result.rows[0];

    // Delete file jika ada
    if (project.image) {
      const imagePath = `src/assets/uploads/${project.image}`;
      if (fs.existsSync(imagePath)) {
        fs.unlinkSync(imagePath);
        console.log(`File ${project.image} berhasil dihapus`);
      }
    }

    // hapus data dari database
    const query = "DELETE FROM projects WHERE id = $1 AND user_id = $2";
    await db.query(query, [id, userId]);

    req.flash("success", "Project berhasil dihapus");
    res.redirect("/my-project");
  } catch (error) {
    req.flash("error", "Gagal menghapus project");
    console.error("Gagal menghapus project:", error);
    res.redirect("/my-project");
  }
}
