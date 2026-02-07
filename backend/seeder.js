require("dotenv").config();
const mongoose = require("mongoose");
const bcrypt = require('bcrypt');

const User = require("./models/User");
const Hostel = require("./models/hostel");
const Room = require("./models/Room");

const MONGO_URI = process.env.MONGO_URI;

// High-quality, royalty-free building/exterior images
const hostelImages = [
  "https://images.unsplash.com/photo-1555854817-5b2260d50c47?q=80&w=1000&auto=format&fit=crop", // Modern Hostel
  "https://images.unsplash.com/photo-1596272875729-ed2ff7d6d9c5?q=80&w=1000&auto=format&fit=crop", // Building Facade
  "https://images.unsplash.com/photo-1520277739336-7bf67edfa768?q=80&w=1000&auto=format&fit=crop", // Urban Building
  "https://images.unsplash.com/photo-1620332372374-f108c53d2e03?q=80&w=1000&auto=format&fit=crop"  // Minimalist Exterior
];

// High-quality, royalty-free interior room images
const roomImages = [
  "https://images.unsplash.com/photo-1595526114035-0d45ed16cfbf?q=80&w=1000&auto=format&fit=crop", // Clean Bed
  "https://images.unsplash.com/photo-1615874959474-d609969a20ed?q=80&w=1000&auto=format&fit=crop", // Modern Interior
  "https://images.unsplash.com/photo-1505691938895-1758d7eaa511?q=80&w=1000&auto=format&fit=crop", // Cozy Bedroom
  "https://images.unsplash.com/photo-1560185893-a55cbc0c57e7?q=80&w=1000&auto=format&fit=crop"  // Bunk Bed/Dorm Style
];

mongoose.connect(MONGO_URI)
  .then(() => console.log("MongoDB connected"))
  .catch(err => console.error("Connection Error:", err));

async function seed() {
  try {
    // 1️⃣ Clear old data
    await Promise.all([
      User.deleteMany({}),
      Hostel.deleteMany({}),
      Room.deleteMany({})
    ]);
    console.log("Old data cleared");

    // 2️⃣ Create 10 ADMIN users
    const adminData = Array.from({ length: 10 }, (_, i) => ({
      name: `Admin ${i + 1}`,
      email: `admin${i + 1}@example.com`,
      passwordHash: bcrypt.hashSync(`adminpass${i + 1}`, 10),
      role: "ADMIN",
      approvalStatus: "APPROVED"
    }));

    const admins = await User.insertMany(adminData);
    console.log(`${admins.length} Admins created`);

    // 3️⃣ Create Hostels and link to Admins
    const hostels = [];
    for (const admin of admins) {
      const hostel = await Hostel.create({
        name: `Hostel ${admin.name}`,
        address: `${Math.floor(Math.random() * 999)} Maple Street, City Center`,
        adminId: admin._id,
        images: [
          { url: hostelImages[Math.floor(Math.random() * hostelImages.length)] },
          { url: hostelImages[Math.floor(Math.random() * hostelImages.length)] }
        ],
        isActive: true
      });

      // Update admin reference
      admin.managedHostelId = hostel._id;
      admin.hostelname = hostel.name;
      await admin.save();
      hostels.push(hostel);
    }
    console.log(`${hostels.length} Hostels created and linked`);

    // 4️⃣ Create 5 rooms per hostel (Optimized with Promise.all)
    const roomPromises = [];
    hostels.forEach((hostel) => {
      for (let k = 1; k <= 5; k++) {
        roomPromises.push(Room.create({
          roomNumber: `${hostel.name.split(' ').pop()}-${100 + k}`, // Structured room numbers
          hostelId: hostel._id,
          price: Math.floor(Math.random() * 5000) + 2000,
          maxCapacity: Math.floor(Math.random() * 4) + 1,
          type: ["Standard", "Deluxe", "Premium"][Math.floor(Math.random() * 3)],
          description: `Spacious ${k} room with high-speed Wi-Fi and amenities.`,
          images: [
            { url: roomImages[Math.floor(Math.random() * roomImages.length)] }
          ]
        }));
      }
    });

    await Promise.all(roomPromises);
    console.log(`${roomPromises.length} Rooms created successfully!`);

    console.log("Database seeded successfully!");
    process.exit(0);

  } catch (err) {
    console.error("Seeding error:", err);
    process.exit(1);
  }
}

seed();