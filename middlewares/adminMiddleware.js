import jwt from "jsonwebtoken";

const adminMiddleware = (req, res, next) => {
  try {
    const token = req.cookies.accessToken;

    if (!token) {
      return res.status(401).json({ status: "failed", message: "Unauthorized access" });
    }

    jwt.verify(token, process.env.JWT_ACCESS_TOKEN_SECRET_KEY, (err, decoded) => {
      if (err) {
        return res.status(401).json({ status: "failed", message: "Invalid token" });
      }

      if (!decoded.roles || decoded.roles !== true) {
        return res.status(403).json({ status: "failed", message: "Access forbidden" });
      }

      req.user = decoded; 
      next();
    });
  } catch (error) {
    return res.status(500).json({ status: "failed", message: "Internal Server Error" });
  }
};

export default adminMiddleware;
