// models/SystemSetting.js
import mongoose from "mongoose";

const SystemSettingSchema = new mongoose.Schema(
  {
    key: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    value: {
      type: mongoose.Schema.Types.Mixed,
      required: true,
    },
  },
  { timestamps: true }
);

const SystemSetting = mongoose.model("SystemSetting", SystemSettingSchema);
export default SystemSetting;
