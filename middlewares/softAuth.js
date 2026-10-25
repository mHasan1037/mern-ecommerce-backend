import passport from "passport";

const softAuth = (req, res, next) => {
  const accessToken = req.cookies?.accessToken;
  if (accessToken) {
    req.headers["authorization"] = `Bearer ${accessToken}`;
  }

  passport.authenticate("jwt", { session: false }, (err, user) => {
    req.user = user || null;
    next();
  })(req, res, next);
};

export default softAuth;