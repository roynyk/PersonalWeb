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

export async function getProjects(req, res, db) {
  try {
    // Tambahkan ORDER BY agar project terbaru ada di paling atas
    const query = "SELECT * FROM projects ORDER BY created_at ASC";
    const result = await db.query(query);

    const flash = req.session.flash;
    delete req.session.flash;
    // Array data mentah dari database
    const projects = result.rows;

    for (let i = 0; i < projects.length; i++) {
      const project = projects[i];

      project.duration = getDuration(project.start_date, project.end_date);

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

    res.render("my-project", { projects: projects, flash: flash });
  } catch (error) {
    console.error("Gagal mengambil data projects dari database:", error);
    res.status(500).send("Terjadi kesalahan pada server");
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

    if (
      !projectName ||
      !startDate ||
      !endDate ||
      !description ||
      !technologies
    ) {
      req.session.flash = {
        type: "error",
        message: "Gagal: Semua kolom form wajib diisi!",
      };
      return res.redirect("/my-project");
    }

    const projectQuery = `
            INSERT INTO projects (user_id, name, start_date, end_date, description) 
            VALUES ($1, $2, $3, $4, $5) 
            RETURNING id
        `;
    const projectResult = await db.query(projectQuery, [
      user_id,
      projectName,
      startDate,
      endDate,
      description,
    ]);
    const newProjectId = projectResult.rows[0].id;

    req.session.flash = {
      type: "success",
      message: "Project berhasil ditambahkan",
    };

    // teknologi agar bisa lebih dari 1
    if (technologies) {
      // walaupun cuma 1, tetap diubah jadi array biar bisa di-looping
      if (typeof technologies === "string") {
        technologies = [technologies];
      }

      const techMap = {
        node: 1,
        react: 2,
        javascript: 3,
        bootstrap: 4,
      };

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
    req.session.flash = {
      type: "error",
      message: "Gagal menambahkan project",
    };
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

    const flash = req.session.flash;
    delete req.session.flash;
    res.render("edit-project", {
      title: "Edit Project",
      project: project,
      flash: flash,
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

    if (
      !projectName ||
      !startDate ||
      !endDate ||
      !description ||
      !technologies
    ) {
      req.session.flash = {
        type: "error",
        message: "Ubah project gagal: Kolom tidak boleh dikosongkan!",
      };
      return res.redirect(`/my-project/edit/${id}`);
    }

    const updateQuery = `
            UPDATE projects 
            SET name = $1, start_date = $2, end_date = $3, description = $4 
            WHERE id = $5 AND user_id = $6
        `;
    const values = [projectName, startDate, endDate, description, id, user_id];
    const result = await db.query(updateQuery, values);

    if (result.rowCount === 0) {
      req.flash(
        "error",
        "Kamu tidak memiliki izin untuk mengedit project ini!",
      );
      return res.redirect(`/my-project`);
    }

    //Hapus semua teknologi lama yang nempel di tabel project_technologies
    const deleteTechQuery =
      "DELETE FROM project_technologies WHERE project_id = $1";
    await db.query(deleteTechQuery, [id]);

    //Masukkan teknologi yang baru dicentang user (Mirip seperti createProject)
    if (technologies) {
      if (typeof technologies === "string") {
        technologies = [technologies];
      }

      const techMap = {
        node: 1,
        react: 2,
        javascript: 3,
        bootstrap: 4,
      };

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

    req.session.flash = {
      type: "success",
      message: "Project berhasil diupdate",
    };
    res.redirect("/my-project");
  } catch (error) {
    req.session.flash = {
      type: "error",
      message: "Gagal mengupdate project",
    };
    console.error("Gagal mengupdate project:", error);
    res.redirect("/my-project");
  }
}

export async function deleteProject(req, res, db) {
  try {
    const { id } = req.params;

    const query = "DELETE FROM projects WHERE id = $1";
    await db.query(query, [id]);

    req.session.flash = {
      type: "success",
      message: "Project berhasil dihapus",
    };
    res.redirect("/my-project");
  } catch (error) {
    req.session.flash = {
      type: "error",
      message: "Gagal menghapus project",
    };
    console.error("Gagal menghapus project:", error);
    res.redirect("/my-project");
  }
}
