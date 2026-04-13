import bcrypt from "bcrypt";

export async function register(req, res, db) {
  try {
    const { name, email, password } = req.body;

    // HASH PASSWORD
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    const query =
      "INSERT INTO users (name, email, password) VALUES ($1, $2, $3) RETURNING *";
    const values = [name, email, hashedPassword];
    const result = await db.query(query, values);

    //FLASH MASSAGE
    req.session.flash = {
      type: "success",
      message: "Akun anda berhasil dibuat!",
    };

    res.redirect("/login");
  } catch (error) {
    req.session.flash = {
      type: "danger",
      message: "Terjadi kesalahan!",
    };

    console.error("Error creating user:", error);
    res.send("Server error");
  }
}

export async function login(req, res, db) {
  try {
    const { email, password } = req.body;

    const query = "SELECT * FROM users WHERE email = $1";
    const result = await db.query(query, [email]);

    if (result.rows.length === 0) {
      req.flash("error", "Invalid email or password!");
      return res.redirect("/login");
    }

    const user = result.rows[0];
    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid) {
      req.flash("error", "Invalid email or password!");
      return res.redirect("/login");
    }

    // SIMPAN SESSION USER
    req.session.user = {
      id: user.id,
      name: user.name,
      email: user.email,
    };

    req.flash("success", "Akun berhasil masuk!");

    console.log("User login:", result.rows[0]);
    res.redirect("/");
  } catch (error) {
    req.flash("error", "Terjadi kesalahan saat login!");
    console.error("Error during login:", error);
    res.send("Server error");
  }
}

export async function logout(req, res) {
  req.flash("success", "Akun berhasil keluar!");

  req.session.destroy((err) => {
    if (err) {
      console.error("Error destroying session:", err);
      return res.send("Error logging out");
    }

    res.redirect("/login");
  });
}
