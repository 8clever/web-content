let express = require('express');
let path = require('path');
let favicon = require('serve-favicon');
let logger = require('morgan');
let cookieParser = require('cookie-parser');
let bodyParser = require('body-parser');
let lessMiddleware = require('less-middleware');
let Driver = require("mydb-driver");
let fs = require("fs");
let ctx = prepareCtx();
let oneYear = 1000*60*60*24*365;

Promise.expressify = expressify;

// add project essences
ctx.api.essence.add(require("./essences/project"), "project");
ctx.api.essence.add(require("./essences/content"), "content");

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
app.use(lessMiddleware(path.join(__dirname, 'public'), { once: true }));
app.use(express.static(path.join(__dirname, 'public'), { maxAge: oneYear }));
app.set('views', path.resolve(__dirname, './views'));
app.use('/', prepareLocals, index);
app.use(catch404);
app.use(errorHandler);

module.exports = app;

function prepareCtx () {
	let ctx = {};
	ctx.cfg = require("./config.js");
	ctx.driver = new Driver (ctx.cfg.mydb);
	ctx.api = require("./api")(ctx);
	return ctx;
}

function sendJs(req, res, next) {
	let jsPath = getAllowedJs()[req.params.file];
	if (!jsPath) return next();
	res.sendFile(jsPath, {
		maxAge: oneYear
	});
}

function getAllowedJs () {
	return {
		"bootstrap.js": path.join(__dirname, "node_modules/bootstrap/dist/js/bootstrap.min.js"),
		"jquery.js": path.join(__dirname, "node_modules/jquery/dist/jquery.min.js"),
	}
}

function prepareLocals (req, res, next) {
  res.locals.prefix = "/";
  next();
}

function catch404 (req, res, next) {
	let err = new Error('Not Found');
	err.status = 404;
	next(err);
}

function errorHandler (err, req, res, next) {
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