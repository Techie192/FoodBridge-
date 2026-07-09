const xss = require('xss-clean');
const hpp = require('hpp');

// 🛡️ Custom IP Blocking Middleware
const blockedIPs = [
  // Add malicious IPs here
  // '192.168.1.100',
];

const ipBlocker = (req, res, next) => {
  const clientIP = req.ip || req.connection.remoteAddress;
  
  // If IP is blocked, return 403 Forbidden
  if (blockedIPs.includes(clientIP)) {
    console.warn(`🚨 Blocked request from malicious IP: ${clientIP}`);
    return res.status(403).json({
      success: false,
      message: 'Access denied: Your IP has been blocked by the firewall.',
    });
  }

  // Basic Payload Filter for common SQLi/XSS keywords in URL (just an example of custom firewalling)
  const suspiciousKeywords = ['<SCRIPT>', 'DROP TABLE', 'UNION SELECT'];
  
  let requestUrl = req.originalUrl || req.url;
  try {
    requestUrl = decodeURIComponent(requestUrl);
  } catch (e) {
    // ignore malformed URI errors
  }
  
  for (const keyword of suspiciousKeywords) {
    if (requestUrl.toUpperCase().includes(keyword)) {
      console.warn(`🚨 Blocked suspicious payload from IP: ${clientIP}`);
      return res.status(403).json({
        success: false,
        message: 'Access denied: Suspicious payload detected by firewall.',
      });
    }
  }

  next();
};

module.exports = {
  ipBlocker,
  xss,
  hpp
};
