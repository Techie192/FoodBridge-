// ✅ Role check middleware
module.exports = (...roles) => {
  const allowedRoles = Array.isArray(roles[0]) ? roles[0] : roles;
  return (req, res, next) => {
    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({ message: "Access denied 🚫" });
    }
    next();
  };
};
