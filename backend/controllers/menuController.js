const { TokenExpiredError, verify } = require("jsonwebtoken");
const Menu = require("../models/Menu");
const{verifyToken} = require('../utils/jwtauth');

exports.updateMenu = async (req, res) => {
  const token = req.headers.authorization?.split(' ')[1];
  const userData = verifyToken(token);



  const { weekStart, menu } = req.body;

  if (!weekStart || !Array.isArray(menu)) {
    return res.status(400).json({ message: "weekStart date and menu array are required" });
  }

  try {
    // Find existing weekly menu or create new one
    let weeklyMenu = await Menu.findOne({ weekStart });

    if (!weeklyMenu) {
      weeklyMenu = new Menu({ weekStart, menu });
    } else {
      // Replace the whole menu array with new one
      weeklyMenu.menu = menu;
      weeklyMenu.updatedAt = new Date();
    }

    await weeklyMenu.save();

    res.status(200).json({ message: "Weekly menu updated", menu: weeklyMenu });
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
};

exports.viewMenu = async (req, res) => {
  
    
    try {
       const allMenus = await Menu.find({}); // Get today's date in YYYY-MM-DD format
    
        if (!allMenus || allMenus.length === 0) {
            return res.status(404).json({ message: "No menus found" });
        }
       
      
    
        res.status(200).json(allMenus);
    } catch (err) {
        res.status(500).json({ message: "Server error", error: err.message });
    }
    }

exports.changeMenuByDay = async (req, res) => {
  const token = req.headers.authorization?.split(' ')[1];
  const userData = verifyToken(token);

  if (userData.role !== 'ADMIN') {
    return res.status(403).json({ message: 'Forbidden: You do not have permission to update the menu' });
  }

  const {weekStart, day, breakfast, lunch, dinner } = req.body;

  if (!weekStart|| !day || !breakfast || !lunch || !dinner) {
    return res.status(400).json({ message: "weekStart, day, breakfast, lunch, and dinner are required" });
  }

  try {
    const weeklyMenu = await Menu.findOne({ weekStart });

    if (!weeklyMenu) {
      return res.status(404).json({ message: "Weekly menu not found. Please create it first." });
    }

    const dayIndex = weeklyMenu.menu.findIndex((item) => item.day === day);

    if (dayIndex !== -1) {
      // Day exists, update that day's meals
      weeklyMenu.menu[dayIndex].breakfast = breakfast;
      weeklyMenu.menu[dayIndex].lunch = lunch;
      weeklyMenu.menu[dayIndex].dinner = dinner;
    } else {
      // Day does not exist, add new day entry
      weeklyMenu.menu.push({ day, breakfast, lunch, dinner });
    }

    weeklyMenu.updatedAt = new Date();
    await weeklyMenu.save();

    res.status(200).json({ message: `${day}'s menu updated`, menu: weeklyMenu.menu });
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
};
