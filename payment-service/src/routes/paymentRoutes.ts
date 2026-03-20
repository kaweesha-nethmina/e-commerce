import { Router } from 'express';
import { getPayments, getPaymentById, getPaymentByOrder, processManualPayment, createPayment } from '../controllers/paymentController';

const router = Router();

router.get('/', getPayments);
router.post('/', createPayment);
router.get('/:id', getPaymentById);
router.get('/order/:orderId', getPaymentByOrder);
router.post('/process', processManualPayment);

export default router;
