import mongoose, { Schema, Document, Model } from 'mongoose';

export type DutyStatus = 'upcoming' | 'pending' | 'completed' | 'skipped' | 'reassigned';
export type DutySource = 'automatic' | 'manual' | 'swap';

export interface IDutyAssignment extends Document {
  groupId: mongoose.Types.ObjectId;
  dutyDate: string; // YYYY-MM-DD
  assignedUserId: mongoose.Types.ObjectId;
  status: DutyStatus;
  rotationSequence: number;
  source: DutySource;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

const DutyAssignmentSchema = new Schema<IDutyAssignment>(
  {
    groupId: { type: Schema.Types.ObjectId, ref: 'ChaiGroup', required: true, index: true },
    dutyDate: { type: String, required: true }, // Format YYYY-MM-DD
    assignedUserId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    status: {
      type: String,
      enum: ['upcoming', 'pending', 'completed', 'skipped', 'reassigned'],
      default: 'upcoming',
    },
    rotationSequence: { type: Number, required: true },
    source: {
      type: String,
      enum: ['automatic', 'manual', 'swap'],
      default: 'automatic',
    },
    notes: { type: String, default: '' },
  },
  { timestamps: true }
);

// Crucial requirement: No duplicate assignments for same group & date
DutyAssignmentSchema.index({ groupId: 1, dutyDate: 1 }, { unique: true });

export const DutyAssignment: Model<IDutyAssignment> =
  mongoose.models.DutyAssignment ||
  mongoose.model<IDutyAssignment>('DutyAssignment', DutyAssignmentSchema);
