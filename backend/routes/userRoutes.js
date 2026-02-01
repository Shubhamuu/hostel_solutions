const express = require("express");
const router = express.Router();
const userController = require("../controllers/userController");
//const { authenticateToken } = require("../utils/jwtauth");
const { isAdmin,isUser, isSuperAdmin } = require("../middleware/authmiddleware");
const upload = require("../middleware/upload");
// 🧑Get profile info of logged-in user
router.get("/me",isUser, userController.getMyProfile);
// 🧑 Get profile info (admin only)
router.get("/profile",isAdmin, userController.getme);
// Get student's room with roommates
router.get("/myroom", isUser, userController.getMyRoom);
// for reapplying verificationn
router.post("/reapply-verification",isAdmin, upload.array("verificationDocuments"), userController.reapplyverifyAdmin);
// Update profile (e.g. name, password)
router.put("/update",isUser, userController.updateProfile);

//  Delete user (optional, for admin or user)
router.delete("/delete",isAdmin, userController.deleteAccount);

// Get all users (admin only)
router.get("/",isAdmin, userController.getAllUsers);

// verify user email
router.post("/verify-user", userController.verifyuserEmail);

// Get admin managed hostel users
router.get("/Admins", isSuperAdmin, userController.viewAllAdmins);
router.post("/admin/approve", isSuperAdmin, userController.verifyAdmin);
router.post("/admin/reject", isSuperAdmin, userController.rejectAdmin);
router.delete("/admin/:adminId", isSuperAdmin, userController.deleteAdmin);
module.exports = router;
