

const Hostel = require('../models/hostel');
const getUserFromToken = require('../utils/getuserFromToken');
const{verifyToken} = require('../utils/jwtauth');
const User = require('../models/User');
const Room = require('../models/Room');



exports.getHostels = async (req, res) => {
  try {
    const hostels = await Hostel.find().populate('adminId', 'name email');
    res.status(200).json(hostels);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

exports.getNearbyHostels = async (req, res) => {
  try {
    const { lat, lng } = req.query;

    // 1️⃣ Validate inputs
    if (!lat || !lng) {
      return res.status(400).json({
        success: false,
        message: "Latitude and longitude are required",
      });
    }

    const latitude = parseFloat(lat);
    const longitude = parseFloat(lng);

    if (isNaN(latitude) || isNaN(longitude)) {
      return res.status(400).json({
        success: false,
        message: "Invalid latitude or longitude",
      });
    }

    // 2️⃣ GeoNear aggregation
    const nearbyHostels = await Hostel.aggregate([
      {
        $geoNear: {
          near: {
            type: "Point",
            coordinates: [longitude, latitude],
          },
          distanceField: "distance", // returned in meters
          maxDistance: 5000, // 5km
          spherical: true,
          query: { isActive: true },
        },
      },
      {
        $limit: 10,
      },
      {
        $project: {
          name: 1,
          address: 1,
          images: { $slice: ["$images", 1] },
          location: 1, // Include the location field with coordinates
          distance: { $divide: ["$distance", 1000] }, // meters → km
        },
      },
    ]);

    res.status(200).json({
      success: true,
      count: nearbyHostels.length,
      data: nearbyHostels,
    });

  } catch (error) {
    console.error("Geo search error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch nearby hostels",
    });
  }
};

// Controller: Get all hostels (for students)
exports.getAllHostelsForStudent = async (req, res) => {
  try {
    // 1. Fetching all documents without field restrictions (.select)
    // We still populate adminId to get the owner's basic contact info
    const hostels = await Hostel.find({isActive: true})
      .populate('adminId', 'name email phoneNumber') 
      .lean(); // Returns plain JSON for better performance
    
    // 2. Check if the collection is empty
    if (!hostels || hostels.length === 0) {
        return res.status(200).json({ 
          success: true, 
          message: 'No hostels found in the database', 
          data: [] 
        });
      }
    // 3. Return the full dataset
    res.status(200).json({
      success: true,
      count: hostels.length,
      data: hostels
    });

  } catch (err) {
    console.error('Fetch All Hostels Error:', err);
    res.status(500).json({ 
      success: false, 
      message: 'Internal Server Error', 
      error: err.message 
    });
  }
};

exports.addHostelImages = async (req, res) => {
  try {
    const user = getUserFromToken(req.headers.authorization?.split(' ')[1]);
    const userdetails = await User.findOne({ email: user.email });

    if(userdetails.approvalStatus !== 'APPROVED'){
      return res.status(403).json({ message: "Only approved admins can add hostel images" });
    }
    const hostelId = userdetails.managedHostelId;

    const hostel = await Hostel.findById(hostelId);
    if (!hostel) {
      return res.status(404).json({ message: 'Hostel not found' });
    }
    const imageFiles = req.files; // Array of uploaded files
    if (!imageFiles || imageFiles.length === 0) {
      return res.status(400).json({ message: 'No images uploaded' });
    }
    // Map uploaded files to the required format
    const imageEntries = imageFiles.map(file => ({
      url: file.path, // Assuming 'path' contains the Cloudinary URL
      uploadedAt: new Date()
    }));
    // Append new images to existing images array
    hostel.images.push(...imageEntries);
    await hostel.save();
    res.status(200).json({ message: 'Images added successfully', images: hostel.images });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

exports.getHostelDetails = async (req, res)=> {
try{
 const token = verifyToken(req.headers.authorization?.split(" ")[1]);
    const useremail = token.email;

    const adminDetail =await User.findOne({email : useremail});
 const hostelDetail = await Hostel.findOne({adminId : adminDetail._id});
  if(!hostelDetail){
    res.status(400).json({message:"no hostel found for admin"});

  }
   res.status(200).json({
      success: true,
      data: hostelDetail
    });

}  catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
}

exports.updateHostelDetails = async (req, res) => {
  try {
    // 1. Verify token and get user email
    const token = verifyToken(req.headers.authorization?.split(" ")[1]);
    if (!token) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }
    const userEmail = token.email;

    // 2. Get admin details
    const adminDetail = await User.findOne({ email: userEmail });
    if (!adminDetail) {
      return res.status(404).json({ success: false, message: "Admin not found" });
    }

    // 3. Get hostel managed by this admin
    const hostelDetail = await Hostel.findOne({ adminId: adminDetail._id });
    if (!hostelDetail) {
      return res.status(404).json({ success: false, message: "Hostel not found" });
    }

    // 4. Update hostel details
    const { name, address, isActive,location } = req.body;

    if (name)
      {
         hostelDetail.name = name;
         adminDetail.hostelname=name;
      }
    if (address) hostelDetail.address = address;
    if (typeof isActive === "boolean") hostelDetail.isActive = isActive;
   if (
  location &&
  location.type === "Point" &&
  Array.isArray(location.coordinates) &&
  location.coordinates.length === 2
) {
  hostelDetail.location = {
    type: "Point",
    coordinates: [
      Number(location.coordinates[0]), // lng
      Number(location.coordinates[1]), // lat
    ],
  };
}
    // 5. Save changes
    const updatedHostel = await hostelDetail.save();
  await adminDetail.save();
    res.status(200).json({
      success: true,
      message: "Hostel details updated successfully",
      data: updatedHostel,
    });

  } catch (error) {
    console.error("Error updating hostel:", error);
    res.status(500).json({ success: false, message: "Server error", error: error.message });
  }
};



exports.deleteHostelImage = async (req, res) => {
  try {
    const token = verifyToken(req.headers.authorization?.split(" ")[1]);
    if (!token) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }

    const userEmail = token.email;
    const adminDetail = await User.findOne({ email: userEmail });
    if (!adminDetail) {
      return res.status(404).json({ success: false, message: "Admin not found" });
    }

    const { imageId } = req.params;
    const hostel = await Hostel.findOne({ adminId: adminDetail._id });
    if (!hostel) {
      return res.status(404).json({ success: false, message: "Hostel not found" });
    }

    const imageIndex = hostel.images.findIndex((img) => img._id.toString() === imageId);
    if (imageIndex === -1) {
      return res.status(404).json({ success: false, message: "Image not found" });
    }

    // Remove image from array
    hostel.images.splice(imageIndex, 1);

    // Save hostel
    await hostel.save();

    res.status(200).json({ success: true, message: "Image deleted successfully" });
  } catch (error) {
    console.error("Error deleting image:", error);
    res.status(500).json({ success: false, message: "Server error", error: error.message });
  }
};

