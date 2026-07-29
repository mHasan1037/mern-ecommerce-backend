import passport from "passport";
import refreshAccessToken from "../utils/refreshAccessToken.js";
import isTokenExpire from "../utils/isTokenExpire.js";

const optionalAuth = async (req, res, next) => {
  try {
    const accessToken = req.cookies.accessToken;

    if (accessToken && !isTokenExpire(accessToken)) {
      req.headers["authorization"] = `Bearer ${accessToken}`;
      return authenticateSoft(req, res, next);
    }

    const refreshToken = req.cookies.refreshToken;

    if (!refreshToken) {
      req.isAuthenticated = false;
      req.user = null;
      return next();
    }

    const result = await refreshAccessToken(req.res);

    if (!result?.newAccessToken) {
      req.isAuthenticated = false;
      req.user = null;
      return next();
    }

    if (!res.headersSent) {
      setTokenCookies(
        res,
        result.newAccessToken,
        result.newRefreshToken,
        result.newAccessTokenExp,
        result.newRefreshTokenExp,
      );
    }
    req.headers["authorization"] = `Bearer ${result.newAccessToken}`;
    return authenticateSoft(req, res, next);
  } catch (error) {
    console.error("optionalAuth error:", error.message);
    // Any unexpected failure — proceed as guest rather than block chat entirely.
    req.isAuthenticated = false;
    req.user = null;
    return next();
  }
};

const authenticateSoft = (req, res, next) => {
  passport.authenticate("jwt", { session: false }, (err, user) => {
    if (err || !user) {
      req.isAuthenticated = false;
      req.user = null;
      return next();
    }

    req.isAuthenticated = true;
    req.user = user;
    return next();
  })(req, res, next);
};

export default optionalAuth;
