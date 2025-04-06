import isTokenExpire from "../utils/isTokenExpire.js";
import refreshAccessToken from "../utils/refreshAccessToken.js";
import setTokenCookies from "../utils/setTokenCookies.js";

const accessTokenAutoRefresh = async (req, res, next) => {
  try {
    const accessToken = req.cookies.accessToken;

    if (accessToken || !isTokenExpire(accessToken)) {
      req.headers["authorization"] = `Bearer ${accessToken}`;
    }

    if (!accessToken || isTokenExpire(accessToken)) {
      const refreshToken = req.cookies.refreshToken;

      if (!refreshToken) {
        throw new Error("Refresh token is missing");
      }

      const result = await refreshAccessToken(req, res);

      if (!result?.newAccessToken) {
        return res.status(401).json({ message: "Token refresh failed" });
      }

      setTokenCookies(
        res,
        result.newAccessToken,
        result.newRefreshToken,
        result.newAccessTokenExp,
        result.newRefreshTokenExp
      );

      req.headers["authorization"] = `Bearer ${result.newAccessToken}`;
    }
    next();
  } catch (error) {
    console.error("Error adding access token to header:", error.message);

    res.status(401).json({
      error: "Unauthorized",
      message: "Access token is missing or invalid",
    });
  }
};


export default accessTokenAutoRefresh;
