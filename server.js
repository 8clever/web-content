let _ = require("lodash");
let express = require('express');
let path = require('path');
let logger = require('morgan');
let cookieParser = require('cookie-parser');
let bodyParser = require('body-parser');
let lessMiddleware = require('less-middleware');
let session = require("cookie-session");
let uuidv1 = require("uuid/v1");
let oneYear = 1000*60*60*24*365;
const drive = require("drive");

Promise.expressify = expressify;

module.exports = {
	makeApp
};

async function makeApp () {
	const ctx = {};
	ctx.cfg = require("./config.js");
	const driver = new drive.DB({ name: "web-content" });
	const collections = {
		projects: await driver.collection("projects"),
		content: await driver.collection('content'),
		session: await driver.collection("session"),
		image: await driver.collection("image"),
		category: await driver.collection("category")
	};
	
	ctx.driver = { openCollection };
	ctx.api = require("./api")(ctx);

	ctx.api.essence.add(require("./essences/project"), "project");
	ctx.api.essence.add(require("./essences/content"), "content");
	ctx.api.essence.add(require("./essences/session"), "session");
	ctx.api.essence.add(require("./essences/session.user"), "session.user");
	ctx.api.essence.add(require("./essences/image"), "image");
	ctx.api.essence.add(require("./essences/category"), "category");

	const index = require('./routes/index')(ctx);
	const category = require('./routes/category')(ctx);

	const app = express();
	const dust = require("express-dustjs");

	app.engine('dust', dust.engine({ useHelpers: true }));
	app.set('view engine', 'dust');
	app.use(logger('dev'));
	app.use(bodyParser.json());
	app.use(bodyParser.urlencoded({ extended: false }));
	app.use(cookieParser());
	app.get("/js/:file", sendJs);
	app.get("/fonts/:file", sendFonts);
	app.get("/img/:_idimage", Promise.expressify(getImage));
	app.use(lessMiddleware(path.join(__dirname, 'public'), { once: true }));
	app.use(express.static(path.join(__dirname, 'public'), { maxAge: oneYear }));
	app.set('views', path.resolve(__dirname, './views'));
	app.post("/login", session(getSessionCfg()), Promise.expressify(login));
	app.get("/logout", session(getSessionCfg()), Promise.expressify(logout));
	app.use('/', session(getSessionCfg()), auth(), Promise.expressify(prepareLocals), index, category);
	app.use(catch403);
	app.use(catch404);
	app.use(errorHandler);

	return app;

	function openCollection (name) {
		if (!collections[name]) throw new Error(`Collection (${name}) does not exists.`);
		return collections[name];
	}

	function getSessionCfg () {
		return {
			secret: ctx.cfg.secret,
			maxAge: 24 * 60 * 60 * 1000 // 24 hours
		};
	}

	async function getImage (req, res) {
		let imgData = await ctx.api.image.getImage(null, req.params._idimage);
		res.setHeader('Cache-Control', `public, max-age=${oneYear}`);
		res.send(imgData);
	}
	
	async function login (req, res) {
		let { login, password } = req.body;
		let users = _.values(ctx.cfg.users);
		let user = _.find(users, u => u.login === login && u.password === password);
		if (!user) {
			let err = new Error("Invalid login or password");
			err.status = 403;
			throw err;
		}
	
		let _u = _.pick(user, [ "_id" ]);
		await ctx.api.authorize.add({
			user: _u,
			id: req.session.id
		});
		res.redirect("/");
	}
	
	async function logout (req, res) {
		await ctx.api.authorize.rm(req.session.id);
		res.redirect("/");
	}
	
	function auth () {
		return Promise.expressify(async function(req, res) {
			if (!req.session.id) req.session.id = uuidv1();
			let userIsAuthorized = await ctx.api.authorize.check(req.session.id);
			if (!userIsAuthorized) {
				let err = new Error("Access Denied");
				err.status = 403;
				throw err;
			}
			req.token = "TOKEN";
			return "next";
		});
	}

	async function prepareLocals (req, res) {
		let session = await ctx.api.authorize.get(req.session.id);
		res.locals.prefix = "/";
		res.locals.user = session.user;
		res.goBack = function () {
			let backURL = req.header('Referer') || '/';
			res.redirect(backURL);
		};
		return "next";
	}
}

function sendFonts(req, res, next) {
	let fontPath = getAllowedFonts()[req.params.file];
	if (!fontPath) return next();
	res.sendFile(fontPath, {
		maxAge: oneYear
	});
}

function sendJs(req, res, next) {
	let jsPath = getAllowedJs()[req.params.file];
	if (!jsPath) return next();
	res.sendFile(jsPath, {
		maxAge: oneYear
	});
}

function getAllowedFonts () {
	return {
		"fontawesome-webfont.woff2": path.join(__dirname, "node_modules/font-awesome/fonts/fontawesome-webfont.woff2"),
		"fontawesome-webfont.woff": path.join(__dirname, "node_modules/font-awesome/fonts/fontawesome-webfont.woff"),
		"fontawesome-webfont.ttf": path.join(__dirname, "node_modules/font-awesome/fonts/fontawesome-webfont.ttf")
	}
}

function getAllowedJs () {
	return {
		"bootstrap.js": path.join(__dirname, "node_modules/bootstrap/dist/js/bootstrap.min.js"),
		"bootstrap-dialog.js": path.join(__dirname, "node_modules/bootstrap-dialog/dist/js/bootstrap-dialog.min.js"),
		"jquery.js": path.join(__dirname, "node_modules/jquery/dist/jquery.min.js"),
		"pace.js": path.join(__dirname, "node_modules/pace-js/pace.min.js")
	}
}

function catch404 (req, res, next) {
	let err = new Error('Not Found');
	err.status = 404;
	next(err);
}

function catch403 (err, req, res, next) {
	if (err.status !== 403) return next(err);
	res.render("login", {
		title: "Authorization",
		errMessage: err.message,
		isLoginPage: 1
	});
}

function errorHandler (err, req, res, next) {
	console.error(err);
	// set locals, only providing error in development
	res.locals.errMessage = err.message;
	res.locals.error = req.app.get('env') === 'development' ? err : {};

	// render the error page
	res.status(err.status || 500);
	res.render('error');
}

function expressify (fn) {
	return function (req, res, next) {
		fn(req, res).then(result => {
			if (result === "next") return next();
		}).catch(next);
	}
}