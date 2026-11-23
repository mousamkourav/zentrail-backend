
const moods = require("./moods.json");

const getMoodData = (title) => {
  const mood = moods.find((m) => m.title === title);
  if (!mood) return null;
  return {
    title: mood.title,
    description: mood.description,
    image: mood.image,
  };
};

module.exports = getMoodData;
