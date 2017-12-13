var express = require('express');
var router = express.Router();

/* GET home page. */
router.get('/', function(req, res, next) {
  res.render('index', { title: 'Web Content' });
});

router.get('/add_project', function(req, res, next) {
  res.render( 'add_project', { title: 'Create Project' });
});

module.exports = router;
