import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IGroupMember extends Document {
  groupId: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;
  role: 'admin' | 'member';
  status: 'active' | 'inactive';
  rotationPosition: number; // 0, 1, 2, 3...
  color: string; // for calendar dot e.g. '#2563EB', '#16A34A', '#EC4899', '#F97316'
  joinedAt: Date;
  leftAt?: Date;
}

const GroupMemberSchema = new Schema<IGroupMember>(
  {
    groupId: { type: Schema.Types.ObjectId, ref: 'ChaiGroup', required: true, index: true },
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    role: { type: String, enum: ['admin', 'member'], default: 'member' },
    status: { type: String, enum: ['active', 'inactive'], default: 'active' },
    rotationPosition: { type: Number, required: true, default: 0 },
    color: { type: String, default: '#3B82F6' },
    joinedAt: { type: Date, default: Date.now },
    leftAt: { type: Date },
  },
  { timestamps: true }
);

GroupMemberSchema.index({ groupId: 1, userId: 1 }, { unique: true });

export const GroupMember: Model<IGroupMember> =
  mongoose.models.GroupMember || mongoose.model<IGroupMember>('GroupMember', GroupMemberSchema);
