const express = require('express');
const router = express.Router();
const db = require('../models/db');

/* GET /api/dogs */
router.get('/dogs', async (req, res) => {
    try {
        const [rows] = await db.query(`
            SELECT d.name as dog_name, d.size, u.username as owner_username
            FROM Dogs d
            JOIN Users u on d.owner_id = u.user_id
            `);
        res.json(rows);
    }catch(err){
        res.status(500).json({ error: 'Failed to fetch dogs' });
    }
});

module.exports = router;
