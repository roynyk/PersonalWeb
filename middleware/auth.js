export function isAuthenticated(req, res, next) {
  if (!req.session.user) {
    req.flash("error", "Anda harus login terlebih dahulu!");
    return res.redirect("/login");
  }
  next();
}
