import mongoose from "mongoose";

export async function connectDB(uri) {
  mongoose.set("strictQuery", true);
  await mongoose.connect(uri, {
    serverSelectionTimeoutMS: 5000,
  });
  console.log("[db] connected to MongoDB");

  mongoose.connection.on("error", (err) => {
    console.error("[db] connection error:", err.message);
  });
}
