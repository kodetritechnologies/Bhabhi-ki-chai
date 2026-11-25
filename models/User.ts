import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IUser extends Document {
  name: string;
  email: string;
  passwordHash?: string;
  avatar: string;
  timezone: string;
  notificationPreferences: {
    inApp: boolean;
    browserPush: boolean;
    dutyReminders: boolean;
  };
  createdAt: Date;
  updatedAt: Date;
}

const UserSchema = new Schema<IUser>(
  {
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true, index: true },
    passwordHash: { type: String },
    avatar: { type: String, default: '' },
    timezone: { type: String, default: 'Asia/Kolkata' },
    notificationPreferences: {
      inApp: { type: Boolean, default: true },
      browserPush: { type: Boolean, default: true },
      dutyReminders: { type: Boolean, default: true },
    },
  },
  { timestamps: true }
);

export const User: Model<IUser> =
  mongoose.models.User || mongoose.model<IUser>('User', UserSchema);
