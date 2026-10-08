const adminMiddleware = (req, res, next) => {
  try {
    if (!req.user) {
      return res.status(401).json({ status: "failed", message: "Unauthorized access" });
    }

    if (req.user.is_admin !== true) {
      return res.status(403).json({ status: "failed", message: "Access forbidden" });
    }

    next();
  } catch (error) {
    return res.status(500).json({ status: "failed", message: "Internal Server Error" });
  }
};

export default adminMiddleware;