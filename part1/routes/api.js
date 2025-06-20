var express = require('express');

module.exports = function(db) {
    var router = express.Router();

    /* GET /api/dogs */
    router.get('/dogs', async (req, res) => {
        try {
            const [dogs] = await db.execute('SELECT * FROM Dogs');
            res.json(dogs);
        }catch(err){
            res.status(500).json({ error: 'Failed to fetch dogs' });
        }
    });

    /* GET /api/walkrequests/open */
    router.get('/walkrequests/open', async (req, res) => {
        try {

        }catch(err){
            res.status(500).json({ error: 'Failed to fetch walk requests' });
        }
    });

    /* GET /api/walkers/summary */
    router.get('/walkers/summary', async (req, res) => {
        try {

        }catch(err){
            res.status(500).json({ error: 'Failed to fetch walkers summary' });
        }
    });

    return router;
};

// /* GET home page. */
// router.get('/', function(req, res, next) {
//   res.render('index', { title: 'Express' });
// });
