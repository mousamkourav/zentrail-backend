// const jwt = require('jsonwebtoken');

// exports.protect = (req, res, next) => {
//   try {
//     const token = req.headers.authorization?.split(' ')[1];
//     if (!token) return res.status(401).json({ message: 'No token provided' });

//     const decoded = jwt.verify(token, process.env.JWT_SECRET);
//     req.user = decoded; 
//     next();
//   } catch (err) {
//     res.status(401).json({ message: 'Invalid or expired token' });
//   }
// };


const jwt = require('jsonwebtoken');

exports.protect = (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) return res.status(401).json({ message: 'No token provided' });

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    return next();
  } catch (err) {
    return res.status(401).json({ message: 'Invalid or expired token' });
  }
};


exports.protectOptional = (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader) return next();
    const token = authHeader.split(' ')[1];
    if (!token) return next();
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    return next();
  } catch (err) {
  
    return next();
  }
};

exports.requireSuperadmin = (req, res, next) => {
  if (!req.user || req.user.role !== 'superadmin') {
    return res.status(403).json({ message: 'Superadmin only' });
  }
  next();
};
