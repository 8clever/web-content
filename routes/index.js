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
			await ctx.api.project.addProject(req.token, req.body);
			res.redirect("/");
		})
	);
	router.get(
		"/project/:_id",
		getProject(),
		getContent(),
		prepareTitle,
		getCategories(),
		prepareContentList(),
		renderContent()
	);
	router.get(
		"/project/:_id/:_idcontent",
		getProject(),
		getContent(),
		prepareTitle,
		getCategories(),
		prepareContentList(),
		renderContent()
	);
	router.get(
		"/project/:_id/:_idcontent/images",
		getProject(),
		getContent(),
		prepareTitle,
		getCategories(),
		prepareContentList(),
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
		Promise.expressify(uploadImage)
	);
	router.get(
		"/remove/image/:_id/:_idcontent/:_idimage",
		getProject(),
		getContent(),
		prepareTitle,
		Promise.expressify(removeImage)
	);
    return router;

    function getCategories () {
    	return Promise.expressify(async function(req, res) {
    		res.locals.categories = await ctx.api.category.get(req.token, {
    			idproject: res.locals.project._id
			});
    		if (res.locals.contentCtx) {
    			let selectedCategory = _.find(
    				res.locals.categories,
					_.matchesProperty("_id", res.locals.contentCtx.idcategory)
				);
				if (selectedCategory)
					selectedCategory._t_selected = 1;
			}
    		return "next";
		})
	}

    async function removeImage (req, res) {
    	try {
			await ctx.api.image.rmImage(req.token, req.params._idimage);
		} catch (err) {}
		_.remove(res.locals.contentCtx.images, _.matchesProperty("id", req.params._idimage));
		await ctx.api.project.addContent(req.token, res.locals.contentCtx);
		res.locals.message = "Image removed successfully";
		res.goBack();
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
			res.render("content_edit", {});
		});
	}

	function prepareContentList () {
    	return Promise.expressify(async function(req, res) {
			let contentMapByCategory = _.groupBy(res.locals.contentList, "idcategory");
			let categoriesMap = _.keyBy(res.locals.categories, "_id");
			res.locals.contentList = _.map(contentMapByCategory, (content, _idcategory) => {
				let category = categoriesMap[_idcategory] || { name: "Uncategorized" };
				category.items = content;
				return category;
			});
			return "next";
		})
	}


    async function uploadImage (req, res) {
		let _idimage = await ctx.api.image.storeImage(req.token, req.file);
		res.locals.contentCtx.images = res.locals.contentCtx.images || [];
		res.locals.contentCtx.images.push({ id: _idimage });
		await ctx.api.project.addContent(req.token, res.locals.contentCtx);
    	res.locals.message = "Image uploaded successfully";
    	res.goBack();
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
			await ctx.api.project.rmContent(req.token, res.locals.contentCtx._id);
			res.redirect(`/project/${res.locals.project._id}`);
		});
	}

    function removeProject () {
    	return Promise.expressify(async function(req, res) {
    		await ctx.api.project.rmProject(req.token, res.locals.project._id);
    		res.redirect("/");
		})
	}

    function saveContent () {
    	return Promise.expressify(async function(req, res) {
			req.body._id = req.params._id || "";
			let [ content ] = await ctx.api.project.addContent(req.token, req.body);
			res.redirect(`/project/${content.idproject}/${content._id}`);
		});
	}

    function getContent () {
    	return Promise.expressify(async function(req, res) {
    		let contentList = await ctx.api.project.getContent(req.token, {
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
			let [ project ] = await ctx.api.project.getProjects(req.token, {
				_id: req.params._id
			});

			if (!project) return Promise.reject(new Error("Not Found"));
			res.locals.project = project;
			return "next";
		});

	}

	function getProjectList () {
		return Promise.expressify(async function(req, res) {
			res.locals.projects = await ctx.api.project.getProjects(req.token, {
				iduser: res.locals.user._id
			});
			return "next";
		})
	}
};


