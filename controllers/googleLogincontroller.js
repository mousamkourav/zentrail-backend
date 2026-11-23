exports.googleLogin = async (req, res) => {
  try {
    const { email, name, picture } = req.body; // yeh Google se aata hai

    const { User } = getPanelDb(req.params.panel);
    let user = await User.findOne({ email });

    if (!user) {
      // agar user first time Google se login kar raha hai
      user = await User.create({
        fullName: name,
        email,
        profileImage: picture,
        isGoogleAuth: true,
      });
    }

    // token generate karo
    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, {
      expiresIn: "7d",
    });

    res.status(200).json({
      message: "Login successful",
      token,
      user,
    });
  } catch (err) {
    res.status(500).json({ message: "Google login failed" });
  }
};
