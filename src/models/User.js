const mongoose = require("mongoose");
const bcrypt = require("bcrypt");

const UserSchema = new mongoose.Schema({
    username: {
        type: String,
        required: true,
        unique: true,
        trim: true,
        lowercase: true
    },
    password: {
        type: String,
        required: true
    },
    role: {
        type: String,
        enum: ["admin", "sales", "customer"],
        default: "sales"
    },
    email: {
        type: String,
        trim: true,
        lowercase: true,
        sparse: true, // Allows null/unique combination
        unique: true
    },
    phone: {
        type: String,
        trim: true,
        sparse: true,
        unique: true
    }
}, {
    timestamps: true // Adds createdAt and updatedAt fields
});

// Hash password before saving
UserSchema.pre("save", async function (next) {
    if (!this.isModified("password")) return next();

    try {
        const salt = await bcrypt.genSalt(10);
        this.password = await bcrypt.hash(this.password, salt);
        next();
    } catch (error) {
        next(error);
    }
});

// Compare password method
UserSchema.methods.comparePassword = function (candidatePassword) {
    return bcrypt.compare(candidatePassword, this.password);
};

// Remove password from JSON response
UserSchema.methods.toJSON = function () {
    const user = this.toObject();
    delete user.password;
    return user;
};

// Export the model (prevent overwrite error)
module.exports = mongoose.models.User || mongoose.model("User", UserSchema);