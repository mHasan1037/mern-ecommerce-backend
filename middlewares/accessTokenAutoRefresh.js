import isTokenExpire from "../utils/isTokenExpire.js";
import refreshAccessToken from "../utils/refreshAccessToken.js";
import setTokenCookies from "../utils/setTokenCookies.js";

const accessTokenAutoRefresh = async (req, res, next) => {
  try {
    const accessToken = req.cookies.accessToken;

    if (accessToken && !isTokenExpire(accessToken)) {
      req.headers["authorization"] = `Bearer ${accessToken}`;
      return next(); 
    }

  
    const refreshToken = req.cookies.refreshToken;

    if (!refreshToken) {
      console.warn("Refresh token is missing");
      return res.status(401).json({ message: "Refresh token is missing" });
    }

    const result = await refreshAccessToken(req, res);

    if (!result?.newAccessToken) {
      console.warn("⛔ Failed to refresh access token");
      return res.status(401).json({ message: "Token refresh failed" });
    }


    if (!res.headersSent) {
      setTokenCookies(
        res,
        result.newAccessToken,
        result.newRefreshToken,
        result.newAccessTokenExp,
        result.newRefreshTokenExp
      );
    }

    req.headers["authorization"] = `Bearer ${result.newAccessToken}`;
    return next(); 
  } catch (error) {
    console.error("Error adding access token to header:", error.message);

    if (!res.headersSent) {
      return res.status(401).json({
        error: "Unauthorized",
        message: "Access token is missing or invalid",
      });
    }
  }
};

export default accessTokenAutoRefresh;
