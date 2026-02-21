const mongoose = require("mongoose");

const connectDB = async () => {
  try {
    await mongoose.connect("mongodb://103.251.19.39/32/raj_tiles_database"); // your DB name
    console.log("MongoDB Connected ✅");
  } catch (error) {
    console.error("DB Connection Failed ❌", error.message);
    process.exit(1);
  }
};

module.exports = connectDB;
