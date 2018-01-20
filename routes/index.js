let express = require('express');
let _ = require("lodash");
let router = express.Router();
let multer = require("multer");
let upload = multer({ dest: 'uploads/' });

module.exports = function(ctx) {
	router.get(
		'/',
		getProjectList(),
		Promise.expressify(async function(req, res) {
			let data = { title: "Web Content" };
			res.render('index', data);
		})
	);
	router.get(
		'/add_project',
		getProjectList(),
		function(req, res, next) {
			res.render( 'add_project', { title: 'Create Project' });
		}
	);
	router.post(
		"/add_project",
		Promise.expressify(async function(req, res) {
			await ctx.api.project.addProject("TOKEN", req.body);
			res.redirect("/");
		})
	);
	router.get(
		"/project/:_id",
		getProject(),
		getContent(),
		prepareTitle,
		renderContent()
	);
	router.get(
		"/project/:_id/:_idcontent",
		getProject(),
		getContent(),
		prepareTitle,
		renderContent()
	);
	router.get(
		"/project/:_id/:_idcontent/images",
		getProject(),
		getContent(),
		prepareTitle,
		renderImages()
	);
	router.post(
		"/edit_content",
		saveContent()
	);
	router.post(
		"/edit_content/:_id",
		saveContent()
	);
	router.get(
		"/rm_content/:_id/:_idcontent",
		getProject(),
		getContent(),
		removeContent()
	);
	router.get(
		"/rm_project/:_id",
		getProject(),
		removeProject()
	);
	router.post(
		"/upload/image/:_id/:_idcontent",
		getProject(),
		getContent(),
		prepareTitle,
		upload.single('image'),
		Promise.expressify(uploadImage),
		renderImages("redirect")
	);
	router.get(
		"/remove/image/:_id/:_idcontent/:_idimage",
		getProject(),
		getContent(),
		prepareTitle,
		Promise.expressify(removeImage),
		renderImages("redirect")
	);
    return router;

    async function removeImage (req, res) {
    	try {
			await ctx.api.image.rmImage("TOKEN", req.params._idimage);
		} catch (err) {}
		_.remove(res.locals.contentCtx.images, _.matchesProperty("id", req.params._idimage));
		await ctx.api.project.addContent("TOKEN", res.locals.contentCtx);
		res.locals.message = "Image removed successfully";
		return "next";
	}

	function renderImages (direction) {
    	return Promise.expressify(async function(req, res) {
			if (direction === "redirect") {
				return res.redirect(`/project/${res.locals.project._id}/${res.locals.contentCtx._id}/images`);
			}
			res.render("content_images", { isImagesPage: 1 });
		})
	}

	function renderContent (direction) {
    	return Promise.expressify(async function(req, res) {
			if (direction === "redirect") {
				return res.redirect(`/project/${res.locals.project._id}/${res.locals.contentCtx._id}`);
			}
			res.render("edit_project", {});
		});
	}

    async function uploadImage (req, res) {
		let _idimage = await ctx.api.image.storeImage("TOKEN", req.file);
		res.locals.contentCtx.images = res.locals.contentCtx.images || [];
		res.locals.contentCtx.images.push({ id: _idimage });
		await ctx.api.project.addContent("TOKEN", res.locals.contentCtx);
    	res.locals.message = "Image uploaded successfully";
    	return "next";
	}

    function prepareTitle (req, res, next) {
    	let projectName = res.locals.project.name;
    	let count = res.locals.contentList.length;
    	res.locals.title = projectName;
    	res.locals.subtitle = badge(count);
		next();

    	function badge (text) {
    		return `<span class="badge">${text}</span>`
		}
	}

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
			res.redirect(`/project/${content.idproject}/${content._id}`);
		});
	}

    function getContent () {
    	return Promise.expressify(async function(req, res) {
    		let contentList = await ctx.api.project.getContent("TOKEN", {
    			idproject: res.locals.project._id
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
				_id: req.params._id
			});

			if (!project) return Promise.reject(new Error("Not Found"));
			res.locals.project = project;
			return "next";
		});

	}

	function getProjectList () {
		return Promise.expressify(async function(req, res) {
			res.locals.projects = await ctx.api.project.getProjects("TOKEN", {
				iduser: res.locals.user._id
			});
			return "next";
		})
	}
};


