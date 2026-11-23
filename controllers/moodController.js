// controllers/moodController.js
const moods = require("../utils/moods.json");

exports.getMoods = async (req, res) => {
  try {
    res.status(200).json({
      message: "Moods fetched successfully",
      count: moods.length,
      data: moods,
    });
  } catch (err) {
    console.error("Get Moods Error:", err);
    res.status(500).json({ message: err.message });
  }
};
