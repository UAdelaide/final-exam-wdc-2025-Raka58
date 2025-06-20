var express = require('express');

module.exports = function(db) {
    var router = express.Router();

    /* GET /api/dogs */
    router.get('/dogs', async (req, res) => {
        try {

        }catch(err){
            res.status(500).json({ error: 'Failed to ' });
        }
    });

    return router;
};

// /* GET home page. */
// router.get('/', function(req, res, next) {
//   res.render('index', { title: 'Express' });
// });
