import mongoose, { Document, Schema } from 'mongoose';

export interface IPayment extends Document {
  order_id: string;
  user_id: string;
  amount: number;
  status: 'pending' | 'completed' | 'failed' | 'refunded';
  transaction_id: string;
  created_at: Date;
  updated_at: Date;
}

const paymentSchema: Schema = new mongoose.Schema({
  order_id: { type: String, required: true },
  user_id: { type: String, required: true },
  amount: { type: Number, required: true },
  status: { type: String, enum: ['pending', 'completed', 'failed', 'refunded'], default: 'pending' },
  transaction_id: { type: String, required: true },
}, { timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' } });

export default mongoose.model<IPayment>('Payment', paymentSchema);
