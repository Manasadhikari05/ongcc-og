const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

// Reuse existing compiled model if it exists
if (mongoose.models && mongoose.models.User) {
  module.exports = mongoose.models.User;
} else {
  const mongoUserSchema = new mongoose.Schema({
    email: { type: String, required: true, unique: true, index: true },
    password: { type: String, required: true },
    name: { type: String, required: true },
    role: { type: String, enum: ['hr_manager', 'admin', 'viewer'], default: 'hr_manager' },
    department: { type: String, default: 'Human Resources' },
    employeeId: { type: String, required: true, unique: true },
    isActive: { type: Boolean, default: true },
    lastLogin: Date
  }, { timestamps: true });

  // Instance method: comparePassword
  mongoUserSchema.methods.comparePassword = async function(candidatePassword) {
    return bcrypt.compare(candidatePassword, this.password);
  };

  // Instance method: toJSON without password
  mongoUserSchema.methods.toJSON = function() {
    const obj = this.toObject();
    delete obj.password;
    obj.id = obj._id?.toString();
    delete obj._id;
    delete obj.__v;
    return obj;
  };

  // Static helpers to mirror SQL model API used in authHelpers
  mongoUserSchema.statics.findByEmail = function(email) {
    return this.findOne({ email }).exec();
  };

  mongoUserSchema.statics.findById = function(id) {
    return this.findOne({ _id: id }).exec();
  };

  // Pre-save: hash password when modified
  mongoUserSchema.pre('save', async function(next) {
    if (!this.isModified('password')) return next();
    try {
      const salt = await bcrypt.genSalt(10);
      this.password = await bcrypt.hash(this.password, salt);
      next();
    } catch (err) {
      next(err);
    }
  });

  // Pre-update: handle findOneAndUpdate password hashing
  mongoUserSchema.pre('findOneAndUpdate', async function(next) {
    const update = this.getUpdate() || {};
    if (update.password) {
      try {
        const salt = await bcrypt.genSalt(10);
        update.password = await bcrypt.hash(update.password, salt);
        this.setUpdate(update);
      } catch (err) {
        return next(err);
      }
    }
    next();
  });

  const MongoUser = mongoose.model('User', mongoUserSchema);
  module.exports = MongoUser;
}


