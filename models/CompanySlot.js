import mongoose from 'mongoose';

const companySlotSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true
  },
  totalSlots: {
    type: Number,
    default: 1,
    min: 1,
    max: 10
  },
  usedSlots: {
    type: Number,
    default: 0
  },
  // Unlock costs for each additional slot
  nextSlotCost: {
    type: Number,
    default: 5000 // coins
  },
  slotsUnlocked: {
    type: Array,
    default: [1] // Slot 1 is default
  },
  totalCoinsSpentOnSlots: {
    type: Number,
    default: 0
  }
}, {
  timestamps: true
});

// Method to check if can unlock new slot
companySlotSchema.methods.canUnlockSlot = function(userCoins) {
  if (this.totalSlots >= 10) return false;
  return userCoins >= this.nextSlotCost;
};

// Method to unlock new slot
companySlotSchema.methods.unlockSlot = function() {
  if (this.totalSlots >= 10) {
    throw new Error('Maximum slots reached');
  }
  
  const cost = this.nextSlotCost;
  this.totalSlots += 1;
  this.slotsUnlocked.push(this.totalSlots);
  this.totalCoinsSpentOnSlots += cost;
  
  // Increase cost for next slot exponentially
  this.nextSlotCost = Math.floor(cost * 1.5);
  
  return { cost, newTotal: this.totalSlots };
};

// Method to get available slots
companySlotSchema.methods.getAvailableSlots = function() {
  return this.totalSlots - this.usedSlots;
};

export default mongoose.model('CompanySlot', companySlotSchema);
