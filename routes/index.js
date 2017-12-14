let express = require('express');
let router = express.Router();

module.exports = function(ctx) {
	router.get('/', Promise.expressify(async function(req, res) {
		let data = { title: "Web Content" };
		data.projects = await ctx.api.project.getProjects("TOKEN", {});
		res.render('index', data);
	}));

	router.get('/add_project', function(req, res, next) {
		res.render( 'add_project', { title: 'Create Project' });
	});

	router.post("/add_project", Promise.expressify(async function(req, res) {
		await ctx.api.project.addProject("TOKEN", req.body);
		res.redirect("/");
	}));

    return router;
};
