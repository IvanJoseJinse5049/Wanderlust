const User = require("../models/user");

module.exports.renderSignupForm = (req, res) => {
  res.render("users/signup");
};

module.exports.signup = async (req, res, next) => {
  try {
    const { username, email, password } = req.body;
    const user = new User({ username, email });
    const registeredUser = await User.register(user, password);

    req.login(registeredUser, (err) => {
      if (err) return next(err);
      req.flash("success", "Welcome to Wanderlust!");
      res.redirect("/listings");
    });
  } catch (error) {
    req.flash("error", `Something went wrong while creating your account: ${error.message}`);
    res.redirect("/signup");
  }
};

module.exports.renderLoginForm = (req, res) => {
  const returnTo = req.query.returnTo || req.session.returnTo || "/listings";
  res.render("users/login", { returnTo });
};

module.exports.login = (req, res) => {
  const redirectUrl = req.body.returnTo || req.session.returnTo || "/listings";
  delete req.session.returnTo;
  req.flash("success", "Welcome back!");
  res.redirect(redirectUrl);
};

module.exports.logout = (req, res) => {
  req.logout((err) => {
    if (err) {
      req.flash("error", `Error logging out: ${err.message}`);
      return res.redirect("/listings");
    }
    req.flash("success", "Goodbye!");
    res.redirect("/listings");
  });
};
