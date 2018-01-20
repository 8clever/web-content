let express = require('express');
let router = express.Router();

module.exports = function(ctx) {
	router.post("/category/add", addCategory());
	router.post("/category/rm", rmCategory());
	return router;

	function addCategory () {
		return Promise.expressify(async function(req, res) {
			await ctx.api.category.add(req.token, req.body);
			res.goBack();
		})
	}

	function rmCategory () {
		return Promise.expressify(async function(req, res) {
			await ctx.api.category.rm(req.token, req.body._idcategory);
			res.goBack();
		})
	}
};