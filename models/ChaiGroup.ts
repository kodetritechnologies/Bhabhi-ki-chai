import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IChaiGroup extends Document {
  name: string;
  description?: string;
  createdBy: mongoose.Types.ObjectId;
  timezone: string;
  workingDays: number[]; // 0=Sun, 1=Mon, ..., 6=Sat
  chaiTime: string; // e.g. "10:00 AM"
  holidays: string[]; // ['2026-11-29', '2026-12-25'] YYYY-MM-DD
  reminderSettings: {
    previousEvening: boolean;
    morningOfDuty: boolean;
    beforeChaiTime: boolean;
  };
  rotationPolicy: 'move_to_end' | 'retain_turn';
  status: 'active' | 'archived';
  currency: string;
  bannerImage?: string;
  inviteCode: string;
  createdAt: Date;
  updatedAt: Date;
}

const ChaiGroupSchema = new Schema<IChaiGroup>(
  {
    name: { type: String, required: true },
    description: { type: String, default: '' },
    createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    timezone: { type: String, default: 'Asia/Kolkata' },
    workingDays: { type: [Number], default: [1, 2, 3, 4, 5, 6] }, // Mon to Sat
    chaiTime: { type: String, default: '10:00 AM' },
    holidays: { type: [String], default: [] },
    reminderSettings: {
      previousEvening: { type: Boolean, default: true },
      morningOfDuty: { type: Boolean, default: true },
      beforeChaiTime: { type: Boolean, default: true },
    },
    rotationPolicy: { type: String, default: 'move_to_end' },
    status: { type: String, enum: ['active', 'archived'], default: 'active' },
    currency: { type: String, default: 'INR' },
    bannerImage: { type: String, default: '' },
    inviteCode: { type: String, unique: true, index: true },
  },
  { timestamps: true }
);

export const ChaiGroup: Model<IChaiGroup> =
  mongoose.models.ChaiGroup || mongoose.model<IChaiGroup>('ChaiGroup', ChaiGroupSchema);
