"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.processManualPayment = exports.getPaymentByOrder = exports.getPaymentById = exports.getPayments = void 0;
const paymentModel_1 = __importDefault(require("../models/paymentModel"));
const getPayments = async (req, res) => {
    try {
        const payments = await paymentModel_1.default.find().sort({ created_at: -1 });
        res.status(200).json(payments);
    }
    catch (error) {
        res.status(500).json({ error: error.message });
    }
};
exports.getPayments = getPayments;
const getPaymentById = async (req, res) => {
    try {
        const payment = await paymentModel_1.default.findById(req.params.id);
        if (!payment) {
            return res.status(404).json({ error: 'Payment not found' });
        }
        res.status(200).json(payment);
    }
    catch (error) {
        res.status(500).json({ error: error.message });
    }
};
exports.getPaymentById = getPaymentById;
const getPaymentByOrder = async (req, res) => {
    try {
        const payment = await paymentModel_1.default.findOne({ order_id: req.params.orderId });
        if (!payment) {
            return res.status(404).json({ error: 'Payment not found for order' });
        }
        res.status(200).json(payment);
    }
    catch (error) {
        res.status(500).json({ error: error.message });
    }
};
exports.getPaymentByOrder = getPaymentByOrder;
const processManualPayment = async (req, res) => {
    try {
        const { order_id, user_id, amount } = req.body;
        let payment = await paymentModel_1.default.findOne({ order_id });
        if (payment && payment.status === 'completed') {
            return res.status(400).json({ error: 'Payment already completed for this order' });
        }
        if (!payment) {
            payment = new paymentModel_1.default({
                order_id,
                user_id,
                amount,
                status: 'completed',
                transaction_id: 'txn_' + Math.random().toString(36).substr(2, 9)
            });
        }
        else {
            payment.status = 'completed';
            payment.transaction_id = 'txn_' + Math.random().toString(36).substr(2, 9);
        }
        await payment.save();
        res.status(201).json({ message: 'Payment manually processed', payment });
    }
    catch (error) {
        res.status(500).json({ error: error.message });
    }
};
exports.processManualPayment = processManualPayment;
