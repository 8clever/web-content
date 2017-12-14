let express = require('express');
let _ = require("lodash");
let router = express.Router();

module.exports = function(ctx) {
	router.get('/', getProjectList(), Promise.expressify(async function(req, res) {
		let data = { title: "Web Content" };
		res.render('index', data);
	}));

	router.get('/add_project', getProjectList(), function(req, res, next) {
		res.render( 'add_project', { title: 'Create Project' });
	});

	router.post("/add_project", Promise.expressify(async function(req, res) {
		await ctx.api.project.addProject("TOKEN", req.body);
		res.redirect("/");
	}));

	router.get("/project/:_id", getProject(), getContent(), Promise.expressify(async function(req, res) {
		let data = { title: res.locals.project.name };
		res.render("edit_project", data);
	}));

	router.get("/project/:_id/:_idcontent", getProject(), getContent(), Promise.expressify(async function(req, res) {
		let data = { title: res.locals.contentCtx.name };
		res.render("edit_project", data);
	}));

	router.post("/edit_content", saveContent());
	router.post("/edit_content/:_id", saveContent());
	router.get("/rm_content/:_id/:_idcontent", getProject(), getContent(), removeContent());
	router.get("/rm_project/:_id", getProject(), removeProject());

    return router;

    function removeContent () {
    	return Promise.expressify(async function(req, res) {
			await ctx.api.project.rmContent("TOKEN", res.locals.contentCtx._id);
			res.redirect(`/project/${res.locals.project._id}`);
		});
	}

    function removeProject () {
    	return Promise.expressify(async function(req, res) {
    		await ctx.api.project.rmProject("TOKEN", res.locals.project._id);
    		res.redirect("/");
		})
	}

    function saveContent () {
    	return Promise.expressify(async function(req, res) {
			req.body._id = req.params._id || "";
			let [ content ] = await ctx.api.project.addContent("TOKEN", req.body);
			res.redirect(`/project/${content._idproject}/${content._id}`);
		});
	}

    function getContent () {
    	return Promise.expressify(async function(req, res) {
    		let contentList = await ctx.api.project.getContent("TOKEN", {
    			_idproject: {
    				eq: res.locals.project._id
				}
    		});
    		res.locals.contentList = contentList;
    		if (req.params._idcontent) {
				res.locals.contentCtx = _.find(contentList, _.matchesProperty("_id", req.params._idcontent));
				if (!res.locals.contentCtx) return Promise.reject(new Error("Not Found"));
			}
			return "next";
		})
	}

    function getProject () {
    	return Promise.expressify(async function(req, res) {
			let [ project ] = await ctx.api.project.getProjects("TOKEN", {
				_id: { eq: req.params._id }
			});

			if (!project) return Promise.reject(new Error("Not Found"));
			res.locals.project = project;
			return "next";
		});

	}

	function getProjectList () {
		return Promise.expressify(async function(req, res) {
			res.locals.projects = await ctx.api.project.getProjects("TOKEN", {});
			return "next";
		})
	}
};


