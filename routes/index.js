var express = require('express');
var router = express.Router();

/* GET home page. */
router.get('/', function(req, res, next) {
  res.render('index', { title: 'Express' });
});

router.get('/add_project', function(req, res, next) {
  res.render( 'add_project', { title: 'Add project' });
});

module.exports = router;
