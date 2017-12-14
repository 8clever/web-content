let _ = require("lodash");

module.exports = ProjectApi;

ProjectApi.prototype = {
	addProject,
	getProjects,
	getContent,
	addContent,
	rmContent,
	rmProject
};

function ProjectApi (ctx) {
	this.ctx = ctx;
}

async function rmProject (token, _idproject) {
	let pr_col = this.ctx.driver.openCollection("projects");
	let cont_col = this.ctx.driver.openCollection("content");

	await cont_col.remove({
		_idproject: {
			eq: _idproject
		}
	});

	await pr_col.remove({
		_id: {
			eq: _idproject
		}
	});
}

async function rmContent (token, _idcontent) {
	let cont_col = this.ctx.driver.openCollection("content");

	await cont_col.remove({
		_id: {
			eq: _idcontent
		}
	});
}

async function addProject (token, project) {
	this.ctx.api.essence.validate(project, "project");
	let collection = this.ctx.driver.openCollection("projects");
	await collection.insert(project);
}

async function getProjects (token, query) {
	let collection = this.ctx.driver.openCollection("projects");
	if (_.isEmpty(query))
		return collection.all();
	return collection.find(query);
}

async function getContent (token, query) {
	let collection = this.ctx.driver.openCollection("content");
	if (_.isEmpty(query))
		return collection.all();
	return collection.find(query);
}

async function addContent (token, content) {
	this.ctx.api.essence.validate(content, "content");
	let collection = this.ctx.driver.openCollection("content");
	if (!content._id) return collection.insert(content);
	return collection.update(content);
}
