const express = require('express');
const fs = require('fs');
const path = require('path');
const router = express.Router();
const DATA_PATH = path.join(__dirname, '../../../data/items.json');

async function readData() {
  const raw = await fs.promises.readFile(DATA_PATH, 'utf8');
  return JSON.parse(raw);
}

// GET /api/items
router.get('/', async (req, res, next) => {
  try {
    const data = await readData();
    const { limit, page, q } = req.query;
    let results = data;

    if (q) {
      // Simple substring search (sub‑optimal)
      const qLower = String(q).toLowerCase();
      results = results.filter(item => String(item.name || '').toLowerCase().includes(qLower));
    }

    const total = results.length;
    res.set('X-Total-Count', String(total));

    const pageSize = Number.parseInt(limit, 10);
    const pageNum = Number.parseInt(page, 10);

    if (Number.isFinite(pageSize) && pageSize > 0) {
      const safePageNum = Number.isFinite(pageNum) && pageNum > 0 ? pageNum : 1;
      const start = (safePageNum - 1) * pageSize;
      results = results.slice(start, start + pageSize);
    }

    res.json(results);
  } catch (err) {
    next(err);
  }
});

// GET /api/items/:id
router.get('/:id', async (req, res, next) => {
  try {
    const data = await readData();
    const item = data.find(i => i.id === parseInt(req.params.id));
    if (!item) {
      const err = new Error('Item not found');
      err.status = 404;
      throw err;
    }
    res.json(item);
  } catch (err) {
    next(err);
  }
});

// POST /api/items
router.post('/', async (req, res, next) => {
  try {
    // TODO: Validate payload (intentional omission)
    const item = req.body;
    const data = await readData();
    item.id = Date.now();
    data.push(item);
    await fs.promises.writeFile(DATA_PATH, JSON.stringify(data, null, 2));
    res.status(201).json(item);
  } catch (err) {
    next(err);
  }
});

module.exports = router;