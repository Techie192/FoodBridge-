const jwt = require("jsonwebtoken");

module.exports = (req, res, next) => {
  try {
    // 1️⃣ Get token from header
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({
        message: "Authorization token missing ❌"
      });
    }

    // 2️⃣ Extract token
    const token = authHeader.split(" ")[1];

    // 3️⃣ Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // 4️⃣ Attach user info to request
    req.user = {
      id: decoded.id,
      role: decoded.role
    };

    // 5️⃣ Continue
    next();

  } catch (error) {
    return res.status(401).json({
      message: "Invalid or expired token ❌"
    });
  }
};
