const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const getPanelDb = require("../config/dbManager");
const sendOtpEmail = require("../utils/mailer");
const { uploadToCloudinary, deleteFromCloudinary } = require("../middleware/multer.js");
const User = require("../config/usersDb.js");


const JWT_SECRET = process.env.JWT_SECRET;

exports.signup = async (req, res) => {
  try {
    const panel = req.params.panel;
    const { User } = getPanelDb(panel);

    const { fullName, email, mobile, password, confirmPassword, agreedToTerms, googleId, profilePic } = req.body;


    let user = null;

    if (googleId) {

      user = await User.findOne({ googleId });

      if (!user) {

        user = await User.findOne({ email });
        if (user) {

          user.googleId = googleId;
          if (profilePic) user.profilePic = profilePic;
          await user.save();
        }
      }
    } else {

      const existingEmailUser = await User.findOne({ email });
      if (existingEmailUser) {
        return res.status(400).json({ message: "Email already registered" });
      }

      const existingMobileUser = await User.findOne({ mobile });
      if (existingMobileUser) {
        return res.status(400).json({ message: "Mobile number already registered" });
      }

      if (!password || !confirmPassword) {
        return res.status(400).json({ message: "Password is required" });
      }
      if (password !== confirmPassword) {
        return res.status(400).json({ message: "Passwords do not match" });
      }

      const hashedPassword = await bcrypt.hash(password, 10);


      user = await User.create({
        fullName,
        email,
        mobile,
        password: hashedPassword,
        agreedToTerms,
      });
    }


    if (!user) {
      user = await User.create({
        fullName,
        email,
        mobile,
        googleId,
        profilePic,
        agreedToTerms: true,
      });
    }

    const token = jwt.sign({ id: user._id, panel }, JWT_SECRET, { expiresIn: "7d" });

    res.status(201).json({
      message: googleId ? "Google signup/login successful" : "Signup successful (Logged in)",
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
    res.status(500).json({ message: "Failed to signup" });
  }
};


// exports.userList = async (req, res) => {
//   try {
//     const panel = req.params.panel||req.user.panel;     
//     const roles = req.query.role;      
//     const filter = {};
//     if (roles) {
//       const roleArray = roles.split(',').map(r => r.trim());
//       filter.role = { $in: roleArray }; 
//     }
//     if (panel) filter.panel = panel;     

//     const users = await User.find(filter, '-password').sort({ createdAt: -1 });
//     res.status(200).json({
//       success: true,
//       count: users.length,
//       data: users,
//     });
//   } catch (error) {
//     console.error('Error fetching users:', error);
//     res.status(500).json({
//       success: false,
//       message: 'Server error while fetching users',
//     });
//   }
// };


exports.userList = async (req, res) => {
  try {
    const panel = req.params.panel || req.user.panel;
    const { role, id } = req.user;
    // const roles = req.query.role; 
    const filter = {};

    if (role === "admin") {
      // filter.role = roles
      //   ? { $in: roles.split(",").map(r => r.trim()) }
      //   : { $in: ["manager", "executive"] };
          filter.role = "manager";
      filter.createdBy = id;
    } 
    else if (role === "manager") {
      filter.role = "executive";
      filter.createdBy = id;
    } 
    else {
      return res.status(403).json({
        success: false,
        message: "You don't have permission to view users",
      });
    }

    if (panel) filter.panel = panel;
    const users = await User.find(filter, "-password").sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: users.length,
      data: users,
      // appliedFilter: filter, 
    });
  } catch (error) {
    console.error("Error fetching users:", error);
    res.status(500).json({
      success: false,
      message: "Server error while fetching users",
    });
  }
};




exports.updateUser = async (req, res) => {
  try {
    const panel = req.params.panel;

    const { User } = getPanelDb(panel);

    const userId = req.user.id;
    const updates = req.body;

    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ message: "User not found" });


    const allowedFields = ['fullName', 'email', 'mobile', 'profilePic', 'bio', 'travelStyle'];
    const updateData = {};

    for (let field of allowedFields) {
      if (updates[field] !== undefined) {
        updateData[field] = updates[field];
      }
    }
    const file = req.files?.profilePic?.[0];

    if (file) {
      if (user.profilePic && user.profilePic.includes('res.cloudinary.com')) {
        const segments = user.profilePic.split('/');
        const publicIdWithExtension = segments[segments.length - 1];
        const publicId = publicIdWithExtension.split('.')[0];
        const folder = 'userprofilePics';

        await deleteFromCloudinary(`${folder}/${publicId}`);
      }
      const cloudinaryResponse = await uploadToCloudinary(file.buffer, 'userprofilePics');
      updateData.profilePic = cloudinaryResponse.secure_url;
    }


    let updatedFieldsCount = Object.keys(updateData).length;




    if (updates.password || updates.confirmPassword || updates.oldPassword) {
      if (!updates.oldPassword || !updates.password || !updates.confirmPassword) {
        return res.status(400).json({ message: "Old, new, and confirm password are required for password change" });
      }

      const user = await User.findById(userId).select('+password');
      console.log(user, "User fetched for password change")
      const isMatch = await bcrypt.compare(updates.oldPassword, user.password);
      if (!isMatch) {
        return res.status(400).json({ message: "Old password is incorrect" });
      }

      if (updates.password !== updates.confirmPassword) {
        return res.status(400).json({ message: "New passwords do not match" });

      }

      updateData.password = await bcrypt.hash(updates.password, 10);
      updatedFieldsCount++
    }

    const updatedUser = await User.findByIdAndUpdate(userId, updateData, {
      new: true,
      runValidators: true,
    });
    console.log(updatedUser, "Updated User", userId, updateData,)

    res.status(200).json({
      message: "User updated successfully",
      user: {
        id: updatedUser._id,
        fullName: updatedUser.fullName,
        email: updatedUser.email,
        mobile: updatedUser.mobile,
        profilePic: updatedUser.profilePic,
        bio: updatedUser.bio,
        travelStyle: updatedUser.travelStyle,


        googleId: updatedUser.googleId,
      }
    });
  } catch (err) {
    console.error(err);
    console.log(err.message, "Error message")
    res.status(500).json({ message: "Failed to update user", error: err.message });
  }
};



exports.getProfileCompletion = async (req, res) => {
  try {
    const panel = req.params.panel;
    const { User } = getPanelDb(panel);
    const userId = req.user.id;

    const user = await User.findById(userId).lean();

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const fieldsToCheck = ['fullName', 'email', 'mobile', 'profilePic', 'bio', 'travelStyle'];
    let filledFields = 0;

    for (let field of fieldsToCheck) {
      if (
        user[field] !== undefined &&
        user[field] !== null &&
        (typeof user[field] === 'string' ? user[field].trim() !== '' : Array.isArray(user[field]) ? user[field].length > 0 : true)
      ) {
        filledFields++;
      }
    }

    const completionPercentage = Math.round((filledFields / fieldsToCheck.length) * 100);

    res.status(200).json({
      message: "Profile completion calculated",
      completionPercentage,
      totalFields: fieldsToCheck.length,
      filledFields,
      emptyFields: fieldsToCheck.length - filledFields
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to calculate profile completion", error: err.message });
  }
};



exports.getUserProfile = async (req, res) => {
  try {
    const panel = req.params.panel;
    const { User } = getPanelDb(panel);
    const userId = req.user.id;

    const user = await User.findById(userId).lean();
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    delete user.password;

    res.status(200).json({
      message: "User profile fetched successfully",
      user
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to fetch user profile", error: err.message });
  }
};






exports.forgotPasswordWithOTP = async (req, res) => {
  try {
    const panel = req.params.panel;
    const { User } = getPanelDb(panel);
    const email = req.body.email?.toLowerCase().trim();
    // console.log("Panel:", panel);
    // console.log("Email:", req.body.email);


    if (!email) return res.status(400).json({ message: "Email is required" });

    const user = await User.findOne({ email }).exec();
    console.log("Found user:", user);
    if (!user) return res.status(404).json({ message: "User not found" });

    const otp = Math.floor(100000 + Math.random() * 900000).toString();

    user.otpCode = otp;
    user.otpExpiry = Date.now() + 10 * 60 * 1000; // 10 min
    await user.save();

    await sendOtpEmail(email, otp);

    res.status(200).json({ message: "OTP sent to your email" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to send OTP" });
  }
};

exports.verifyOtpAndResetPassword = async (req, res) => {
  try {
    const panel = req.params.panel;
    const { User } = getPanelDb(panel);
    console.log("Panel:", panel);
    console.log("Email:", req.body.email);

    const { email, otp, password, confirmPassword } = req.body;

    if (!email || !otp || !password || !confirmPassword) {
      return res.status(400).json({ message: "All fields are required" });
    }

    if (password !== confirmPassword) {
      return res.status(400).json({ message: "Passwords do not match" });
    }

    const user = await User.findOne({ email });
    if (!user || !user.otpCode || !user.otpExpiry) {
      return res.status(400).json({ message: "OTP not found or expired" });
    }

    if (user.otpCode !== otp || user.otpExpiry < Date.now()) {
      return res.status(400).json({ message: "Invalid or expired OTP" });
    }

    user.password = await bcrypt.hash(password, 10);
    user.otpCode = undefined;
    user.otpExpiry = undefined;
    await user.save();

    res.status(200).json({ message: "Password reset successful" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to reset password" });
  }
};
