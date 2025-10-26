import mongoose from "mongoose";

const hiddenCategorySchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
    index: true
  },
  name: {
    type: String,
    required: true,
    trim: true,
    minlength: 1,
    maxlength: 50
  },
  description: {
    type: String,
    trim: true,
    maxlength: 200,
    default: ""
  },
  isActive: {
    type: Boolean,
    default: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
}, { timestamps: true });

// Compound index for efficient queries
hiddenCategorySchema.index({ user: 1, name: 1 }, { unique: true });
hiddenCategorySchema.index({ user: 1, isActive: 1 });

// Pre-save middleware to update updatedAt
hiddenCategorySchema.pre('save', function(next) {
  this.updatedAt = new Date();
  next();
});

export default mongoose.model("HiddenCategory", hiddenCategorySchema);
