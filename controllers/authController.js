// const jwt = require('jsonwebtoken');
// const User = require('../config/usersDb');
// const getPanelDb = require('../config/dbManager');
// const allowedModels = getPanelDb.allowedModels;
// const signToken = (user) =>
//   jwt.sign(
//     {
//       id: user._id,
//       role: user.role,
//       panel: user.panel,
//     },
//     process.env.JWT_SECRET,
//     { expiresIn: '7d' }
//   );
// exports.register = async (req, res) => {
//   try {
//     const { name, email, password, role, panel } = req.body;
//     const user = await User.create({ name, email, password, role, panel });
//     const token = signToken(user);
//     res.status(201).json({ user, token });
//   } catch (err) {
//     res.status(500).json({ message: 'Registration failed', error: err.message });
//   }
// };

// exports.login = async (req, res) => {
//   try {
//     const { email, password } = req.body;

//     const user = await User.findOne({ email });
//     if (!user) return res.status(400).json({ message: "User not found" });
//     const isMatch = await user.comparePassword(password);
//     if (!isMatch) return res.status(400).json({ message: "Invalid password" });
//     const userPanel = user.panel;
//     const db = getPanelDb(userPanel);

//     const token = signToken(user);

//     res.status(200).json({
//       message: "Login successful",
//       panel: userPanel,  
//       allowedModels: allowedModels[userPanel] || [],
//       user: {
//         name: user.name,
//         email: user.email,
//         role: user.role,
//         canEdit: user.canEdit,
//         canDelete: user.canDelete,
//         canView: user.canView,
//         canAdd: user.canAdd,
//       },
//       token,

//     });
//   } catch (err) {
//     res.status(500).json({ message: "Login failed", error: err.message });
//   }
// };
// controllers/authController.js
const jwt = require('jsonwebtoken');
const getPanelDb = require('../config/dbManager');
const allowedModels = getPanelDb.allowedModels;
const getDbForUser = getPanelDb.getDbForUser;
const User = require('../config/usersDb');
const panelToDbName = getPanelDb.panelToDbName;

const signToken = (user) =>
  jwt.sign(
    {
      id: user._id,
      role: user.role,
      panel: user.panel,
    },
    process.env.JWT_SECRET,
    { expiresIn: '7d' }
  );

exports.register = async (req, res) => {
  try {
    const { name, email, password, role, panel, canEdit,
      canDelete,
      canAdd,
      canView,createdBy } = req.body;

    if (role === 'superadmin') {
      return res.status(403).json({ message: 'Use the create-superadmin endpoint' });
    }
    const user = await User.create({
      name, email, password, role, panel, canEdit,
      canDelete,
      canAdd,
      canView,
      createdBy: createdBy || null,
    });
    const token = signToken(user);
    res.status(201).json({ user, token });
  } catch (err) {
    res.status(500).json({ message: 'Registration failed', error: err.message });
  }
};

exports.updateUser = async (req, res) => {
  try {
    const { id } = req.params; // user id from URL
    const updateData = { ...req.body };

    // ❌ Superadmin ko normal update se change nahi karne dena (optional)
    if (updateData.role === 'superadmin') {
      return res.status(403).json({ message: 'Cannot change to superadmin via this route' });
    }

    if (updateData.password) {
      const bcrypt = require('bcryptjs');
      updateData.password = await bcrypt.hash(updateData.password, 12);
    }

    ['canEdit', 'canDelete', 'canView', 'canAdd'].forEach((key) => {
      if (updateData[key] === 'true') updateData[key] = true;
      if (updateData[key] === 'false') updateData[key] = false;
    });

    if (updateData.role === 'superadmin' || updateData.role === 'admin') {
     return res.status(403).json({ message: 'cant update admin or superadmin' });
    }

    // 🔹 Update the user
    const user = await User.findByIdAndUpdate(id, updateData, {
      new: true, // return updated doc
      runValidators: true, // validate schema
    });

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.status(200).json({
      success: true,
      message: 'User updated successfully',
      user,
    });
  } catch (err) {
    res.status(500).json({ message: 'User update failed', error: err.message });
  }
};

exports.getSingleUser = async (req, res) => {
  try {
    const { id } = req.params;
    // const { panel } = req.user; // if panel-based setup
    // const { User } = getPanelDb(panel);

    // if (!User) {
    //   return res.status(400).json({ message: "User model not found for this panel" });
    // }

    const user = await User.findById(id).select("-password"); // exclude password

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    res.status(200).json({
      success: true,
      message: "User fetched successfully!",
      data: user,
    });
  } catch (error) {
    console.error("Error fetching user:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message,
    });
  }
};



exports.createSuperadmin = async (req, res) => {

  try {
    const { name, email, password, secret } = req.body;


    if (!(req.user && req.user.role === 'superadmin')) {
      if (!process.env.SUPERADMIN_SECRET || secret !== process.env.SUPERADMIN_SECRET) {
        return res.status(403).json({ message: 'Not authorized to create superadmin' });
      }
    }


    const existing = await User.findOne({ email });
    if (existing) return res.status(400).json({ message: 'User exists' });

    const user = await User.create({ name, email, password, role: 'superadmin' });
    const token = signToken(user);
    res.status(201).json({ user, token });
  } catch (err) {
    res.status(500).json({ message: 'Failed to create superadmin', error: err.message });
  }
};

exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email });
    if (!user) return res.status(400).json({ message: "User not found" });
    const isMatch = await user.comparePassword(password);
    if (!isMatch) return res.status(400).json({ message: "Invalid password" });

    const token = signToken(user);


    let panels = Object.keys(panelToDbName);
    let userAllowedModels;
    if (user.role === 'superadmin') {

      const union = {};
      for (const p of panels) {
        union[p] = allowedModels[p] || [];
      }
      userAllowedModels = union;
    } else {
      userAllowedModels = { [user.panel]: allowedModels[user.panel] || [] };
      panels = [user.panel];
    }

    res.status(200).json({
      message: "Login successful",
      panel: user.panel || 'all',
      panels,
      allowedModels: userAllowedModels,

      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        canEdit: user.canEdit,
        canDelete: user.canDelete,
        canView: user.canView,
        canAdd: user.canAdd,
      },
      token,
    });
  } catch (err) {
    res.status(500).json({ message: "Login failed", error: err.message });
  }
};

exports.getPanelToken = async (req, res) => {
  try {
    const { panel } = req.body;
    const panelToDbName = getPanelDb.panelToDbName;

    if (!panel || !panelToDbName[panel]) {
      return res.status(400).json({ message: "Invalid or missing panel" });
    }


    const panelToken = jwt.sign(
      {
        id: req.user.id,
        role: req.user.role,
        panel,
      },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.status(200).json({
      message: `Token generated for panel: ${panel}`,
      token: panelToken,
      panel
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Failed to generate panel token', error: err.message });
  }
};
