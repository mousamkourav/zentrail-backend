const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const getPanelDb = require("../config/dbManager");

const JWT_SECRET = process.env.JWT_SECRET;

exports.login = async (req, res) => {
  try {
    const panel = req.params.panel;
    const { User } = getPanelDb(panel);

    const { email, password, googleId, profilePic } = req.body;

    let user = null;

    if (googleId) {
      user = await User.findOne({ googleId });
      if (!user && email) {
        user = await User.findOne({ email });
        if (user) {
          user.googleId = googleId;
          if (profilePic) user.profilePic = profilePic;
          await user.save();
        } else {
          return res.status(400).json({ message: "Google account not registered" });
        }
      }
    } else {
      user = await User.findOne({ email }).select("+password");
      if (!user) {
        return res.status(400).json({ message: "Invalid email or password" });
      }

      const isMatch = await bcrypt.compare(password, user.password);
      if (!isMatch) {
        return res.status(400).json({ message: "Invalid email or password" });
      }
    }

    // Generate JWT
    const token = jwt.sign({ id: user._id, panel }, JWT_SECRET, { expiresIn: "7d" });

    res.status(200).json({
      message: googleId ? "Google login successful" : "Login successful",
      token,
      user: {
        id: user._id,
        fullName: user.fullName,
        email: user.email,
        mobile: user.mobile,
        profilePic: user.profilePic,
        googleId: user.googleId,
      },
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to login" });
  }
};
