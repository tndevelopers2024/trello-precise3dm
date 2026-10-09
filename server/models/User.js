import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import crypto from "crypto";

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    password: {
      type: String,
      minlength: 6,
      required: function () {
        return this.status === "active" || this.status === "approved";
      },
    },
    role: { type: String, enum: ["superadmin", "admin", "member"], default: "member" },
    status: {
      type: String,
      enum: ["pending", "approved", "rejected", "active", "invited"],
      default: "pending",
    },
    avatarColor: { type: String, default: "#0C66E4" },
    activationToken: { type: String },
    activationTokenExpires: { type: Date },
    resetPasswordToken: { type: String },
    resetPasswordTokenExpires: { type: Date },
    invitedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    approvedAt: { type: Date },
    approvedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    rejectedAt: { type: Date },
    rejectedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    rejectionReason: { type: String },
    isDeleted: { type: Boolean, default: false },
    deletedAt: { type: Date },
    deletedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  },
  { timestamps: true }
);

userSchema.pre("save", async function (next) {
  if (!this.isModified("password") || !this.password) return next();
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

userSchema.methods.matchPassword = async function (enteredPassword) {
  if (!this.password) return false;
  return bcrypt.compare(enteredPassword, this.password);
};

// Generate crypto activation token and set 24h expiration
userSchema.methods.generateActivationToken = function () {
  const rawToken = crypto.randomBytes(32).toString("hex");
  this.activationToken = crypto.createHash("sha256").update(rawToken).digest("hex");
  this.activationTokenExpires = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours
  return rawToken;
};

// Generate crypto reset token and set 1h expiration
userSchema.methods.generateResetPasswordToken = function () {
  const rawToken = crypto.randomBytes(32).toString("hex");
  this.resetPasswordToken = crypto.createHash("sha256").update(rawToken).digest("hex");
  this.resetPasswordTokenExpires = new Date(Date.now() + 60 * 60 * 1000); // 1 hour
  return rawToken;
};

userSchema.methods.toSafeObject = function () {
  return {
    _id: this._id,
    name: this.name,
    email: this.email,
    role: this.role,
    status: this.status || "pending",
    avatarColor: this.avatarColor,
    approvedAt: this.approvedAt,
    rejectedAt: this.rejectedAt,
    rejectionReason: this.rejectionReason,
    createdAt: this.createdAt,
  };
};

export default mongoose.model("User", userSchema);
