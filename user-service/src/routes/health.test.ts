import { healthRouter } from './health';
import express from 'express';
import request from 'supertest';

const app = express();
app.use('/health', healthRouter);

describe('health', () => {
  it('returns ok', async () => {
    const res = await request(app).get('/health');
    expect(res.status).toBe(200);
    expect(res.body.service).toBe('user-service');
  });
});
