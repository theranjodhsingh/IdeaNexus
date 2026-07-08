/**
 * Drops the stale `id_1` unique index from the users collection.
 *
 * This index was created by a previous schema that had an explicit `id` field.
 * The current User model uses Mongoose's default `_id`, so every document has
 * `id: null` — which violates the stale unique constraint after the first insert.
 *
 * Run once:  node scripts/dropStaleIndex.js
 */

require('dotenv').config();

const dns = require('dns');
dns.setServers(['8.8.8.8', '1.1.1.1']);

const mongoose = require('mongoose');

const MONGO_URI = process.env.MONGO_URI;

if (!MONGO_URI) {
  console.error('MONGO_URI is not set in .env');
  process.exit(1);
}

(async () => {
  try {
    await mongoose.connect(MONGO_URI);
    console.log('Connected to MongoDB');

    const db = mongoose.connection.db;
    const collection = db.collection('users');

    // List current indexes
    const indexes = await collection.indexes();
    console.log('\nCurrent indexes on "users" collection:');
    indexes.forEach((idx) => {
      console.log(`  - ${idx.name}: ${JSON.stringify(idx.key)}${idx.unique ? ' (unique)' : ''}`);
    });

    // Check for stale indexes from previous schema versions
    const staleIndexNames = ['id_1', 'clerkId_1'];
    let droppedAny = false;

    for (const name of staleIndexNames) {
      const staleIndex = indexes.find((idx) => idx.name === name);
      if (staleIndex) {
        console.log(`\n⚠️  Found stale "${name}" index — dropping it...`);
        await collection.dropIndex(name);
        console.log(`✅ Successfully dropped "${name}" index.`);
        droppedAny = true;
      }
    }

    if (!droppedAny) {
      console.log('\n✅ No stale indexes found — nothing to do.');
    }

    // Also clean up any users that may have been partially created
    // (optional: list all users so you can verify)
    const count = await collection.countDocuments();
    console.log(`\nTotal users in collection: ${count}`);
  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await mongoose.disconnect();
    console.log('\nDisconnected from MongoDB');
  }
})();
