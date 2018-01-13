let _ = require("lodash");
let express = require('express');
let path = require('path');
let logger = require('morgan');
let cookieParser = require('cookie-parser');
let bodyParser = require('body-parser');
let lessMiddleware = require('less-middleware');
let session = require("cookie-session");
let uuidv1 = require("uuid/v1");
let ctx = prepareCtx();
let oneYear = 1000*60*60*24*365;

Promise.expressify = expressify;

// add project essences
ctx.api.essence.add(require("./essences/project"), "project");
ctx.api.essence.add(require("./essences/content"), "content");
ctx.api.essence.add(require("./essences/session"), "session");
ctx.api.essence.add(require("./essences/session.user"), "session.user");

// routes
let index = require('./routes/index')(ctx);

let app = express();
let dust = require("express-dustjs");

app.engine('dust', dust.engine({ useHelpers: true }));
app.set('view engine', 'dust');
app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cookieParser());
app.get("/js/:file", sendJs);
app.get("/fonts/:file", sendFonts);
app.use(lessMiddleware(path.join(__dirname, 'public'), { once: true }));
app.use(express.static(path.join(__dirname, 'public'), { maxAge: oneYear }));
app.set('views', path.resolve(__dirname, './views'));
app.post("/login", session(getSessionCfg()), Promise.expressify(login));
app.get("/logout", session(getSessionCfg()), Promise.expressify(logout));
app.use('/', session(getSessionCfg()), auth(), Promise.expressify(prepareLocals), index);
app.use(catch403);
app.use(catch404);
app.use(errorHandler);

module.exports = app;

function getDriver (ctx) {
	let isProduction = ctx.cfg.env === "production";
	let prefix = path.join(__dirname, "db/");
	let PouchDB = isProduction ? require("pouchdb-http") : require("pouchdb");
	if (!isProduction) PouchDB = PouchDB.defaults({ prefix });
	PouchDB.plugin(require("pouchdb-find"));
	PouchDB.plugin(require("pouchdb-security"));
	PouchDB.plugin(require("pouchdb-security-helper"));
	PouchDB.plugin(pluginGetUrl());
	return {
		openCollection,
		addSecuritySync,
		addSecurity
	};
	function openCollection (name) {
		if (!isProduction) return new PouchDB(name);
		if (!ctx.cfg.pouchdb.domain)
			throw new Error("Invalid env.POUCHDB_DOMAIN");
		if (!ctx.cfg.pouchdb.protocol)
			throw new Error("Invalid env.POUCHDB_PROTOCOL");
		if (!ctx.cfg.pouchdb.login)
			throw new Error("Invalid env.POUCHDB_LOGIN");
		if (!ctx.cfg.pouchdb.password)
			throw new Error("Invalid env.POUCHDB_PASSWORD");
		let url = "";
		url += ctx.cfg.pouchdb.protocol + "://";
		url += ctx.cfg.pouchdb.domain;
		if (ctx.cfg.pouchdb.port) url += ":" + ctx.cfg.pouchdb.port;
		url += "/";
		url += name;
		return new PouchDB(url, {
			auth: {
				username: ctx.cfg.pouchdb.login,
				password: ctx.cfg.pouchdb.password
			}
		});
	}
	function addSecuritySync (name) {
		addSecurity(name).catch(console.error);
	}
	async function addSecurity (name) {
		let collection = openCollection(name);
		let security = collection.security();
		security.reset();
		security.members.roles.add("admin");
		security.members.names.add("admin");
		security.admins.roles.add("admin");
		security.admins.names.add("admin");
		await security.save();
		console.log(`${name}: Security added succefully.`);
	}
	function pluginGetUrl () {
		return {
			getUrl: function () {
				return this.name + "/";
			},
			getHeaders: function() {
				let { Base64 } = require("js-base64");
				let user = ctx.cfg.pouchdb.login;
				let login = ctx.cfg.pouchdb.password;
				let hash = Base64.encode(`${user}:${login}`);
				return {
					"Authorization": `Basic ${hash}`
				}
			}
		}
	}
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
		return "next";
	});
}

function getSessionCfg () {
	return {
		secret: ctx.cfg.secret,
		maxAge: 24 * 60 * 60 * 1000 // 24 hours
	};
}

function prepareCtx () {
	let ctx = {};
	ctx.cfg = require("./config.js");
	let driver = getDriver(ctx);
	let collections = {
		projects: driver.openCollection("projects"),
		content: driver.openCollection('content'),
		session: driver.openCollection("session")
	};
	ctx.driver = { openCollection };
	Object.keys(collections).forEach(driver.addSecuritySync);
	ctx.api = require("./api")(ctx);
	return ctx;
	function openCollection (name) {
		if (!collections[name]) throw new Error(`Collection (${name}) does not exists.`);
		return collections[name];
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
	}
}

async function prepareLocals (req, res) {
	let session = await ctx.api.authorize.get(req.session.id);
	res.locals.prefix = "/";
	res.locals.user = session.user;
	return "next";
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
		message: err.message,
		isLoginPage: 1
	});
}

function errorHandler (err, req, res, next) {
	console.error(err);
	// set locals, only providing error in development
	res.locals.message = err.message;
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