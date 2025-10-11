import SystemSetting from "../models/SystemSetting.js";

const XP_KEY = "defaultXpForNextLevel";

// ✅ Get current XP setting
export const getXpSetting = async (req, res) => {
  try {
    const setting = await SystemSetting.findOne({ key: XP_KEY });
    const xpValue = setting ? Number(setting.value) : 100; // default fallback
    return res.status(200).json({
      success: true,
      key: XP_KEY,
      value: xpValue,
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: "Failed to get XP setting",
      error: err.message,
    });
  }
};

// ✅ Set / update XP setting (admin only)
export const setXpSetting = async (req, res) => {
  try {
    const { value } = req.body;

    if (!value || isNaN(value) || value <= 0) {
      return res.status(400).json({
        success: false,
        message: "Value must be a positive number",
      });
    }

    const setting = await SystemSetting.findOneAndUpdate(
      { key: XP_KEY },
      { value },
      { new: true, upsert: true }
    );

    return res.status(200).json({
      success: true,
      message: "XP setting updated successfully",
      setting,
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: "Failed to update XP setting",
      error: err.message,
    });
  }
};
