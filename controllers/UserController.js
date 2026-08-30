const bcrypt = require("bcryptjs");
const User = require("../models/User");

// GET /api/users/profile
const getProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select("-password");

    if (!user) {
      return res.status(404).json({
        message: "User not found",
      });
    }

    res.status(200).json(user);
  } catch (error) {
    console.log("GET PROFILE ERROR:", error);
    res.status(500).json({
      message: error.message,
    });
  }
};

// PUT /api/users/profile
const updateProfile = async (req, res) => {
  try {
    const { name, email } = req.body;

    const user = await User.findById(req.user._id);

    if (!user) {
      return res.status(404).json({
        message: "User not found",
      });
    }

    if (name) user.name = name;
    if (email) user.email = email;

    await user.save();

    const updatedUser = await User.findById(user._id).select("-password");

    res.status(200).json({
      message: "Profile updated successfully",
      user: updatedUser,
    });
  } catch (error) {
    console.log("UPDATE PROFILE ERROR:", error);
    res.status(500).json({
      message: error.message,
    });
  }
};

// PUT /api/users/change-password
const changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({
        message: "Current and new password are required",
      });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({
        message: "New password must be at least 6 characters",
      });
    }

    const user = await User.findById(req.user._id);

    if (!user) {
      return res.status(404).json({
        message: "User not found",
      });
    }

    const isMatch = await bcrypt.compare(currentPassword, user.password);

    if (!isMatch) {
      return res.status(400).json({
        message: "Current password is incorrect",
      });
    }

    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(newPassword, salt);

    await user.save();

    res.status(200).json({
      message: "Password changed successfully",
    });
  } catch (error) {
    console.log("CHANGE PASSWORD ERROR:", error);
    res.status(500).json({
      message: error.message,
    });
  }
};

// PUT /api/users/notifications
const updateNotificationSettings = async (req, res) => {
  try {
    const { emailNotifications } = req.body;

    const user = await User.findById(req.user._id);

    if (!user) {
      return res.status(404).json({
        message: "User not found",
      });
    }

    user.emailNotifications = Boolean(emailNotifications);

    await user.save();

    res.status(200).json({
      message: "Notification settings updated",
      emailNotifications: user.emailNotifications,
    });
  } catch (error) {
    console.log("UPDATE NOTIFICATION SETTINGS ERROR:", error);
    res.status(500).json({
      message: error.message,
    });
  }
};

// POST /api/users/addresses
const addAddress = async (req, res) => {
  try {
    const { label, fullName, mobile, address, city, state, pincode, isDefault } =
      req.body;

    if (!fullName || !mobile || !address || !city || !state || !pincode) {
      return res.status(400).json({
        message: "All address fields are required",
      });
    }

    const user = await User.findById(req.user._id);

    if (!user) {
      return res.status(404).json({
        message: "User not found",
      });
    }

    // If this is set as default, unset default on all others
    if (isDefault) {
      user.addresses.forEach((addr) => {
        addr.isDefault = false;
      });
    }

    // First address added is automatically the default
    const shouldBeDefault = isDefault || user.addresses.length === 0;

    user.addresses.push({
      label: label || "Home",
      fullName,
      mobile,
      address,
      city,
      state,
      pincode,
      isDefault: shouldBeDefault,
    });

    await user.save();

    res.status(201).json({
      message: "Address added successfully",
      addresses: user.addresses,
    });
  } catch (error) {
    console.log("ADD ADDRESS ERROR:", error);
    res.status(500).json({
      message: error.message,
    });
  }
};

// PUT /api/users/addresses/:addressId
const updateAddress = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);

    if (!user) {
      return res.status(404).json({
        message: "User not found",
      });
    }

    const addr = user.addresses.id(req.params.addressId);

    if (!addr) {
      return res.status(404).json({
        message: "Address not found",
      });
    }

    const { label, fullName, mobile, address, city, state, pincode, isDefault } =
      req.body;

    if (label !== undefined) addr.label = label;
    if (fullName !== undefined) addr.fullName = fullName;
    if (mobile !== undefined) addr.mobile = mobile;
    if (address !== undefined) addr.address = address;
    if (city !== undefined) addr.city = city;
    if (state !== undefined) addr.state = state;
    if (pincode !== undefined) addr.pincode = pincode;

    if (isDefault) {
      user.addresses.forEach((a) => {
        a.isDefault = false;
      });
      addr.isDefault = true;
    }

    await user.save();

    res.status(200).json({
      message: "Address updated successfully",
      addresses: user.addresses,
    });
  } catch (error) {
    console.log("UPDATE ADDRESS ERROR:", error);
    res.status(500).json({
      message: error.message,
    });
  }
};

// DELETE /api/users/addresses/:addressId
const deleteAddress = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);

    if (!user) {
      return res.status(404).json({
        message: "User not found",
      });
    }

    const addr = user.addresses.id(req.params.addressId);

    if (!addr) {
      return res.status(404).json({
        message: "Address not found",
      });
    }

    const wasDefault = addr.isDefault;

    addr.deleteOne();

    // If the deleted address was default, make the first remaining one default
    if (wasDefault && user.addresses.length > 0) {
      user.addresses[0].isDefault = true;
    }

    await user.save();

    res.status(200).json({
      message: "Address deleted successfully",
      addresses: user.addresses,
    });
  } catch (error) {
    console.log("DELETE ADDRESS ERROR:", error);
    res.status(500).json({
      message: error.message,
    });
  }
};

// GET /api/users (admin only)
const getAllUsers = async (req, res) => {
  try {
    const users = await User.find().select("-password").sort({ createdAt: -1 });
    res.status(200).json(users);
  } catch (error) {
    console.log("GET ALL USERS ERROR:", error);
    res.status(500).json({
      message: error.message,
    });
  }
};

// PUT /api/users/:id/role (admin only)
const updateUserRole = async (req, res) => {
  try {
    const { role } = req.body;

    if (!["user", "admin"].includes(role)) {
      return res.status(400).json({
        message: "Role must be 'user' or 'admin'",
      });
    }

    // Prevent an admin from demoting their own account
    // (avoids accidentally locking themselves out of the admin panel)
    if (req.params.id === req.user._id.toString() && role !== "admin") {
      return res.status(400).json({
        message: "You cannot remove your own admin access",
      });
    }

    const user = await User.findByIdAndUpdate(
      req.params.id,
      { role },
      { new: true }
    ).select("-password");

    if (!user) {
      return res.status(404).json({
        message: "User not found",
      });
    }

    res.status(200).json({
      message: "User role updated successfully",
      user,
    });
  } catch (error) {
    console.log("UPDATE USER ROLE ERROR:", error);
    res.status(500).json({
      message: error.message,
    });
  }
};

module.exports = {
  getProfile,
  updateProfile,
  changePassword,
  updateNotificationSettings,
  addAddress,
  updateAddress,
  deleteAddress,
  getAllUsers,
  updateUserRole,
};