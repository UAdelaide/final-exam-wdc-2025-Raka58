var express = require('express');

module.exports = function(db) {
    var router = express.Router();

    /* GET /api/dogs */
    router.get('/dogs', async (req, res) => {
        try {
            // for each dog, returns:
            // dog_name, size and owner_username
            const [rows] = await db.execute(`
                SELECT d.name AS dog_name, d.size, u.username AS owner_username
                FROM Dogs d
                JOIN Users u ON d.owner_id = u.user_id
                `);
            res.json(rows);
        }catch(err){
            res.status(500).json({ error: 'Failed to fetch dogs' });
        }
    });

    /* GET /api/walkrequests/open */
    router.get('/walkrequests/open', async (req, res) => {
        try {
            // for each open walkrequest, returns:
            // request_id, dog_name, requested_time, duration_minutes, location and owner_username
            const [rows] = await db.execute(`
                SELECT wr.request_id, d.name AS dog_name, wr.requested_time,
                    wr.duration_minutes, wr.location, u.username AS owner_username
                FROM WalkRequests wr
                JOIN Dogs d ON wr.dog_id = d.dog_id
                JOIN Users u ON d.owner_id = u.user_id
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
            // for each walker, returns:
            // walker_username, total_ratings, average_rating and completed_walks

            // note: using LEFT JOIN so that walkers with no matching walkapplications, walkrequests
            // or walkratings are not excluded from the data (instead the COUNTs will return 0)
            const [rows] = await db.execute(`
                SELECT u.username AS walker_username, COUNT(wrt.rating_id) AS total_ratings,
                AVG(wrt.rating) AS average_rating, COUNT(wrq.request_id) AS completed_walks
                FROM Users u
                LEFT JOIN WalkApplications wa ON u.user_id = wa.walker_id AND wa.status = 'accepted'
                LEFT JOIN WalkRequests wrq ON wa.request_id = wrq.request_id AND wrq.status = 'completed'
                LEFT JOIN WalkRatings wrt ON u.user_id = wrt.walker_id
                WHERE u.role = 'walker'
                GROUP BY u.user_id
                `);
            res.json(rows);
        }catch(err){
            res.status(500).json({ error: 'Failed to fetch walkers summary' });
        }
    });

    return router;
};
