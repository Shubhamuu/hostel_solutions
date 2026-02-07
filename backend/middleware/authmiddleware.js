const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { ACCESS_SECRET } = require('../constants/getenv');

//const REFRESH_SECRET = require('../constants/getenv').REFRESH_SECRET;

exports.protect = async (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer '))
    return res.status(401).json({ message: 'Unauthorized: No token' });

  const token = authHeader.split(' ')[1];

  try {
    const decoded = jwt.verify(token, ACCESS_SECRET);
    const user = await User.findById(decoded.id).select('-password');
    //console.log('Decoded user:', decoded);
    if (!user) return res.status(401).json({ message: 'Unauthorized: User not found' });

    req.user = user;

    next();
  } catch (err) {
    console.log('Error in protect middleware:', err);
    return res.status(401).json({ message: 'Unauthorized: Invalid token' });
  }
};
exports.isUser = (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer '))
    return res.status(401).json({ message: 'Unauthorized: No token' });
  
  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, ACCESS_SECRET);
    req.user = decoded;
   
  } catch (err) {
    return res.status(401).json({ message: 'Unauthorized: Invalid token or expired token' });
  }
  
  if (req.user.role === 'STUDENT') {
    return next();
  }
 
    return res.status(403).json({ message: 'Forbidden: Students only' });
  
  
}

exports.isAdmin = (req, res, next) => {
const authHeader = req.headers.authorization;
//console.log("authheader",authHeader);
  if (!authHeader || !authHeader.startsWith('Bearer '))
    return res.status(401).json({ message: 'Unauthorized: No token' });

  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, ACCESS_SECRET);
    req.user = decoded;
  } catch (err) {
   //console.log('Error in isAdmin middleware:', err);
    return res.status(401).json({ message: 'Unauthorized: Invalid token' });
  }

  if (req.user.role === 'ADMIN') {
    return next();
  }
  return res.status(403).json({ message: 'Forbidden: Admins only' });
}
exports.isSuperAdmin = (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer '))
    return res.status(401).json({ message: 'Unauthorized: No token' });

  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, ACCESS_SECRET);
   // console.log("decoded superadmin",decoded);
    req.user = decoded;
  }
    catch (err) { 
    return res.status(401).json({ message: 'Unauthorized: Invalid token' });
  }

  if (req.user.role === 'SUPERADMIN') {
    return next();
  }
  return res.status(403).json({ message: 'Forbidden: Super Admins only' });
}