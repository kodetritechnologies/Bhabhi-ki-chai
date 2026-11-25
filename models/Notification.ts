import mongoose, { Schema, Document, Model } from 'mongoose';

export interface INotification extends Document {
  userId: mongoose.Types.ObjectId;
  groupId?: mongoose.Types.ObjectId;
  type: 'turn_today' | 'turn_tomorrow' | 'reminder_time' | 'payment_recorded' | 'member_joined' | 'duty_swapped';
  title: string;
  message: string;
  read: boolean;
  timeAgoText?: string;
  createdAt: Date;
  updatedAt: Date;
}

const NotificationSchema = new Schema<INotification>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    groupId: { type: Schema.Types.ObjectId, ref: 'ChaiGroup', index: true },
    type: { type: String, required: true },
    title: { type: String, required: true },
    message: { type: String, required: true },
    read: { type: Boolean, default: false },
    timeAgoText: { type: String, default: 'just now' },
  },
  { timestamps: true }
);

export const Notification: Model<INotification> =
  mongoose.models.Notification || mongoose.model<INotification>('Notification', NotificationSchema);
