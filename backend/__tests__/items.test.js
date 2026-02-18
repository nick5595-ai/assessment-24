const express = require('express');
const path = require('path');
const request = require('supertest');
const fs = require('fs');

const DATA_PATH = path.join(__dirname, '../../data/items.json');

function createTestApp() {
  const app = express();
  app.use(express.json());
  app.use('/api/items', require('../src/routes/items'));
  app.use((err, req, res, next) => {
    res.status(err.status || 500).json({ message: err.message });
  });
  return app;
}

describe('items routes', () => {
  let app;
  let readFileSpy;
  let writeFileSpy;

  const sampleItems = [
    { id: 1, name: 'Laptop Pro', category: 'Electronics', price: 2499 },
    { id: 2, name: 'Ergonomic Chair', category: 'Furniture', price: 799 },
    { id: 3, name: 'Standing Desk', category: 'Furniture', price: 1199 }
  ];

  beforeEach(() => {
    readFileSpy = jest.spyOn(fs.promises, 'readFile');
    writeFileSpy = jest.spyOn(fs.promises, 'writeFile');
    app = createTestApp();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  test('GET /api/items returns all items', async () => {
    readFileSpy.mockResolvedValueOnce(JSON.stringify(sampleItems));

    const res = await request(app).get('/api/items').expect(200);
    expect(res.headers['x-total-count']).toBe(String(sampleItems.length));
    expect(res.body).toEqual(sampleItems);
  });

  test('GET /api/items supports case-insensitive search via q', async () => {
    readFileSpy.mockResolvedValueOnce(JSON.stringify(sampleItems));

    const res = await request(app).get('/api/items').query({ q: 'laptop' }).expect(200);
    expect(res.headers['x-total-count']).toBe('1');
    expect(res.body).toEqual([sampleItems[0]]);
  });

  test('GET /api/items supports limit', async () => {
    readFileSpy.mockResolvedValueOnce(JSON.stringify(sampleItems));

    const res = await request(app).get('/api/items').query({ limit: '2' }).expect(200);
    expect(res.headers['x-total-count']).toBe(String(sampleItems.length));
    expect(res.body).toEqual(sampleItems.slice(0, 2));
  });

  test('GET /api/items supports pagination via page + limit', async () => {
    readFileSpy.mockResolvedValueOnce(JSON.stringify(sampleItems));

    const res = await request(app)
      .get('/api/items')
      .query({ limit: '2', page: '2' })
      .expect(200);

    expect(res.headers['x-total-count']).toBe(String(sampleItems.length));
    expect(res.body).toEqual(sampleItems.slice(2, 4));
  });

  test('GET /api/items/:id returns a single item when found', async () => {
    readFileSpy.mockResolvedValueOnce(JSON.stringify(sampleItems));

    const res = await request(app).get('/api/items/2').expect(200);
    expect(res.body).toEqual(sampleItems[1]);
  });

  test('GET /api/items/:id returns 404 when item is missing', async () => {
    readFileSpy.mockResolvedValueOnce(JSON.stringify(sampleItems));

    const res = await request(app).get('/api/items/999').expect(404);
    expect(res.body).toEqual({ message: 'Item not found' });
  });

  test('GET /api/items returns 500 when data read fails', async () => {
    readFileSpy.mockRejectedValueOnce(new Error('read failed'));

    const res = await request(app).get('/api/items').expect(500);
    expect(res.body).toEqual({ message: 'read failed' });
  });

  test('POST /api/items creates an item and persists it', async () => {
    jest.spyOn(Date, 'now').mockReturnValue(1234567890);
    readFileSpy.mockResolvedValueOnce(JSON.stringify(sampleItems));
    writeFileSpy.mockResolvedValueOnce();

    const payload = { name: 'New Item', category: 'Misc', price: 10 };
    const res = await request(app).post('/api/items').send(payload).expect(201);

    expect(res.body).toEqual({ ...payload, id: 1234567890 });
    expect(writeFileSpy).toHaveBeenCalledTimes(1);

    const [writePath, writeRaw] = writeFileSpy.mock.calls[0];
    expect(writePath).toBe(DATA_PATH);
    expect(JSON.parse(writeRaw)).toEqual([...sampleItems, { ...payload, id: 1234567890 }]);
  });

  test('POST /api/items returns 500 when write fails', async () => {
    jest.spyOn(Date, 'now').mockReturnValue(111);
    readFileSpy.mockResolvedValueOnce(JSON.stringify(sampleItems));
    writeFileSpy.mockRejectedValueOnce(new Error('write failed'));

    const payload = { name: 'New Item', category: 'Misc', price: 10 };
    const res = await request(app).post('/api/items').send(payload).expect(500);
    expect(res.body).toEqual({ message: 'write failed' });
  });
});

