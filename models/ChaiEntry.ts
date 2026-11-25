import mongoose, { Schema, Document, Model } from 'mongoose';

export type PaymentStatus = 'not_recorded' | 'pending' | 'paid';
export type DutyCompletionStatus = 'pending' | 'completed';

export interface IChaiEntry extends Document {
  groupId: mongoose.Types.ObjectId;
  dutyAssignmentId: mongoose.Types.ObjectId;
  dutyDate: string; // YYYY-MM-DD
  amount: number; // In Rupees
  currency: string;
  paidByUserId: mongoose.Types.ObjectId;
  paymentStatus: PaymentStatus;
  dutyCompletionStatus: DutyCompletionStatus;
  note?: string;
  receiptUrl?: string;
  createdBy: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const ChaiEntrySchema = new Schema<IChaiEntry>(
  {
    groupId: { type: Schema.Types.ObjectId, ref: 'ChaiGroup', required: true, index: true },
    dutyAssignmentId: {
      type: Schema.Types.ObjectId,
      ref: 'DutyAssignment',
      required: true,
      unique: true,
    },
    dutyDate: { type: String, required: true },
    amount: { type: Number, required: true, default: 0 },
    currency: { type: String, default: 'INR' },
    paidByUserId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    paymentStatus: {
      type: String,
      enum: ['not_recorded', 'pending', 'paid'],
      default: 'pending',
    },
    dutyCompletionStatus: {
      type: String,
      enum: ['pending', 'completed'],
      default: 'pending',
    },
    note: { type: String, default: '' },
    receiptUrl: { type: String, default: '' },
    createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  },
  { timestamps: true }
);

export const ChaiEntry: Model<IChaiEntry> =
  mongoose.models.ChaiEntry || mongoose.model<IChaiEntry>('ChaiEntry', ChaiEntrySchema);
