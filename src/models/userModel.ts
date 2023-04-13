import { Schema, model } from 'mongoose';
import AppError from '../utilities/AppError';
import { User } from '../types/model/user';
import validator from 'validator';
import bcrypt from 'bcrypt';
import CryptoJS from 'crypto-js';
const userSchema = new Schema<User>({
	name: {
		type: String,
		required: [true, 'Please tell as your name!'],
	},
	email: {
		type: String,
		required: [true, 'Please provide your email'],
		unique: true,
		lowercase: true,
		validate: [validator.isEmail, 'Please provide a valid email'],
	},
	photo: String,
	role: {
		type: String,
		enum: ['user', 'guide', 'lead-guide', 'admin'],
		default: 'user',
	},
	password: {
		type: String,
		required: [true, 'Please provide a password'],
		minlength: 8,
		select: false,
	},
	passwordConfirm: {
		type: String,
		required: [true, 'Please confirm your password'],
		validate: {
			validator: function(this: User, value: string): boolean {
				return value === this.password;
			},
			message: 'Passwords do not match',
		},
	},
	passwordChangedAt: Date,
	passwordResetToken: String,
	passwordResetExpires: Date,
	active: {
		type: Boolean,
		default: true,
		select: false,
	},
});



userSchema.pre('save', async function (this: User, next) {
	// Only run this function if password was actually modified
	if (!this.isModified('password')) return next();

	// Hash the password with cost of 12
	this.password = await bcrypt.hash(this.password || '', 12);

	// Delete passwordConfirm field
	delete this.passwordConfirm;
	next();
});

userSchema.pre('save', function (next) {
	if (!this.isModified('password') || this.isNew) return next();

	this.passwordChangedAt = new Date(Date.now() - 1000);
	next();
});

userSchema.pre(/^find/, function (next) {
	// this points to the current query
	this.find({ active: { $ne: false } });
	next();
});

userSchema.methods.correctPassword = async function (candidatePassword: string, userPassword: string) {
	return await bcrypt.compare(candidatePassword, userPassword);
};

userSchema.methods.changedPasswordAfter = function (JWTTimestamp: number) {
	if (this.passwordChangedAt) {
		const changedTimestamp = parseInt(this.passwordChangedAt.getTime() / 1000 + '', 10);

		return JWTTimestamp < changedTimestamp;
	}

	// False means NOT changed
	return false;
};

userSchema.methods.createPasswordResetToken = function () {
	const resetToken = CryptoJS.lib.WordArray.random(32).toString(CryptoJS.enc.Hex);
    
	this.passwordResetToken = CryptoJS.SHA256(resetToken).toString(CryptoJS.enc.Utf8);

	this.passwordResetExpires = new Date(Date.now() + 10 * 60 * 1000);

	return resetToken;
};

const User = model('User', userSchema);

export default User;