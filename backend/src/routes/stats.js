const express = require('express');
const fs = require('fs');
const path = require('path');
const router = express.Router();
const DATA_PATH = path.join(__dirname, '../../../data/items.json');

let cachedStats = null;
let cachedSignature = null;
let inFlight = null;
let inFlightSignature = null;
let computeId = 0;

function signatureFromStat(stat) {
  // mtime + size is a cheap, effective change detector for our file-backed store.
  return `${stat.mtimeMs}:${stat.size}`;
}

async function computeStats() {
  const raw = await fs.promises.readFile(DATA_PATH, 'utf8');
  const items = JSON.parse(raw);

  // Intentional heavy CPU calculation
  const total = items.length;
  const averagePrice =
    total === 0 ? 0 : items.reduce((acc, cur) => acc + cur.price, 0) / total;

  return { total, averagePrice };
}

async function getCachedStats() {
  const stat = await fs.promises.stat(DATA_PATH);
  const signature = signatureFromStat(stat);

  if (cachedStats && cachedSignature === signature) {
    return cachedStats;
  }

  if (inFlight && inFlightSignature === signature) {
    return inFlight;
  }

  // If the file changed while a previous compute is in-flight, start a new compute
  // for the latest signature and ensure stale results don't overwrite the cache.
  computeId += 1;
  const thisComputeId = computeId;

  inFlightSignature = signature;
  inFlight = (async () => {
    const stats = await computeStats();

    if (thisComputeId === computeId) {
      cachedStats = stats;
      cachedSignature = signature;
    }

    return stats;
  })().finally(() => {
    if (thisComputeId === computeId) {
      inFlight = null;
      inFlightSignature = null;
    }
  });

  return inFlight;
}

// GET /api/stats
router.get('/', async (req, res, next) => {
  try {
    const stats = await getCachedStats();
    res.json(stats);
  } catch (err) {
    next(err);
  }
});

module.exports = router;