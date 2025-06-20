var express = require('express');

module.exports = function(db) {
    var router = express.Router();

    /* GET /api/dogs */
    router.get('/dogs', async (req, res) => {
        try {
            const [rows] = await db.execute(`
                SELECT d.name as dog_name, d.size, u.username as owner_username
                FROM Dogs d
                JOIN Users u on d.owner_id = u.user_id
                `);
            res.json(rows);
        }catch(err){
            res.status(500).json({ error: 'Failed to fetch dogs' });
        }
    });

    /* GET /api/walkrequests/open */
    router.get('/walkrequests/open', async (req, res) => {
        try {
            const [rows] = await db.execute(`
                SELECT wr.request_id, d.name AS dog_name, wr.requested_time,
                    wr.duration_minutes, wr.location, u.username AS owner_username
                FROM WalkRequests wr
                JOIN Dogs d ON wr.dog_id = d.dog_id
                JOIN Users u ON wr.owner_id = u.user_id
                WHERE wr.status = 'open'
                `);
            res.json(rows);
        }catch(err){
            res.status(500).json({ error: 'Failed to fetch walk requests' });
        }
    });

    /* GET /api/walkers/summary */
    router.get('/walkers/summary', async (req, res) => {
        try {
            const [rows] = await db.execute(`
                SELECT wr.request_id, d.name AS dog_name, wr.requested_time,
                    wr.duration_minutes, wr.location, u.username AS owner_username
                FROM WalkRequests wr
                JOIN Dogs d ON wr.dog_id = d.dog_id
                JOIN Users u ON wr.owner_id = u.user_id
                WHERE wr.status = 'open'
                `);
            res.json(rows);
        }catch(err){
            res.status(500).json({ error: 'Failed to fetch walkers summary' });
        }
    });

    return router;
};
