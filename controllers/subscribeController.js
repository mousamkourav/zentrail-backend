// const sendWelcomeEmail = require("../utils/sendWelcomeEmail");
// const getPanelDb = require("../config/dbManager");


// const subscribe = async (req, res) => {
//   const { email } = req.body;
//   const panel = req.params.panel;

//   if (!email) return res.status(400).json({ message: "Email is required." });
//   if (!panel) return res.status(400).json({ message: "Panel is required." });

//   try {
//     const dbModels = getPanelDb(panel);
//     const Subscriber = dbModels.Subscriber; 

//     const exists = await Subscriber.findOne({ email });
//     if (exists) {
//       return res.status(409).json({ message: "Already subscribed." });
//     }

//     const subscriber = new Subscriber({ email });
//     await subscriber.save();

//     await sendWelcomeEmail(email, panel);

//     res.status(201).json({ message: `Subscribed to ${panel} successfully.` });
//   } catch (err) {
//     console.error(err);
//     res.status(500).json({ message: "Server error." });
//   }
// };

// module.exports = { subscribe };

const sendWelcomeEmail = require("../utils/sendWelcomeEmail");
const getPanelDb = require("../config/dbManager");

const subscribe = async (req, res) => {
  const { email } = req.body;
  const panel = req.params.panel;

  if (!email) return res.status(400).json({ message: "Email is required." });
  if (!panel) return res.status(400).json({ message: "Panel is required." });

  try {
    const dbModels = getPanelDb(panel);
    const Subscriber = dbModels.Subscriber;

    const exists = await Subscriber.findOne({ email });
    if (exists) {
      return res.status(409).json({ message: "Already subscribed." });
    }

    const subscriber = new Subscriber({ email });
    await subscriber.save();

    await sendWelcomeEmail(email, panel);

    res.status(201).json({ message: `Subscribed to ${panel} successfully.` });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error." });
  }
};

module.exports = { subscribe };
