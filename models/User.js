const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true, lowercase: true },
    password: { type: String, required: true },
    role: { type: String, enum: ['superadmin', 'admin', 'user', 'manager', 'executive'], default: 'user' },
    panel: { type: String, required: function () { return this.role !== 'superadmin'; } }, // e.g., Poornam-event, Travel 
    canEdit: { type: Boolean, default: false },
    canDelete: { type: Boolean, default: false },
    canView: { type: Boolean, default: true },
    canAdd: { type: Boolean, default: false },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
  },
  { timestamps: true }
);


userSchema.pre('save', async function () {
  if (this.role === 'superadmin') {
    this.canEdit = true;
    this.canDelete = true;
    this.canView = true;
    this.canAdd = true;
  } else if (this.role === 'admin') {
    this.canEdit = true;
    this.canDelete = true;
    this.canView = true;
    this.canAdd = true;

  } else {
    this.canEdit = this.canEdit ?? false;
    this.canDelete = this.canDelete ?? false;
    this.canView = this.canView ?? true;
    this.canAdd = this.canAdd ?? false;
  }

  if (this.isModified('password')) {
    this.password = await bcrypt.hash(this.password, 12);
  }

});

userSchema.methods.comparePassword = function (enteredPassword) {
  return bcrypt.compare(enteredPassword, this.password);
};

module.exports = userSchema;