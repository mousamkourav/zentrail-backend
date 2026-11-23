const dotenv = require("dotenv");

dotenv.config({
  path: `.env.${process.env.NODE_ENV || "development"}`,
});

const connectDB = require("./config/db");
const app = require("./app");

const PORT = process.env.PORT || 8080;

const startServer = async () => {
  try {
    await connectDB();

    app.listen(PORT, "0.0.0.0", () => {
      console.log(`Server running on port ${PORT}`);
    });
  } catch (err) {
    console.error("Server startup failed:", err.message);
    process.exit(1);
  }
};

startServer();
