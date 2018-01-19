let fs = require("fs");
let path = require("path");

module.exports = ProjectApi;

ProjectApi.prototype = {
	addProject,
	getProjects,
	getContent,
	addContent,
	rmContent,
	rmProject,
	uploadImageToContent
};

function ProjectApi (ctx) {
	this.ctx = ctx;
}

async function rmProject (token, idproject) {
	let pr_col = this.ctx.driver.openCollection("projects");
	let cont_col = this.ctx.driver.openCollection("content");
	let content = await cont_col.find({ selector: { idproject }});
	for (let c of content.docs) {
		await cont_col.remove(c);
	}
	let project = await pr_col.get(idproject);
	await pr_col.remove(project);
}

async function rmContent (token, _idcontent) {
	let cont_col = this.ctx.driver.openCollection("content");
	let doc = await cont_col.get(_idcontent);
	await cont_col.remove(doc);
}

async function addProject (token, project) {
	this.ctx.api.essence.validate(project, "project");
	let collection = this.ctx.driver.openCollection("projects");
	await collection.post(project);
}

async function getProjects (token, query) {
	let collection = this.ctx.driver.openCollection("projects");
	let project = await collection.find({ selector: query });
	return project.docs;
}

async function getContent (token, query) {
	let collection = this.ctx.driver.openCollection("content");
	let content = await collection.find({ selector: query });
	return content.docs;
}

async function addContent (token, content) {
	this.ctx.api.essence.validate(content, "content");
	let collection = this.ctx.driver.openCollection("content");
	if (!content._id) {
		delete content._id;
		let { id } = await collection.post(content);
		content._id = id;
	} else {
		let { _rev } = await collection.get(content._id);
		content._rev = _rev;
		await collection.put(content);
	}
	return [ content ];
}

/**
 *
 * @param token
 * @param params.content
 * @param params.file
 * @returns {Promise<void>}
 */
async function uploadImageToContent (token, params) {
	this.ctx.api.essence.validate(params.file, "image");
	let content = this.ctx.driver.openCollection("content");
	let buff = fs.readFileSync(path.join(__dirname, "../../", params.file.path));
	params.content._attachments = params.content._attachments || {};
	params.content._attachments[ params.file.originalname ] = {
		content_type: params.file.mimetype,
		data: buff
	};
	await content.put(params.content);
}
