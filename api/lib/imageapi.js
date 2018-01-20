let fs = require("fs");
let path = require("path");
module.exports = ImageApi;

ImageApi.prototype = {
	storeImage,
	getImage,
	rmImage
};

function ImageApi (ctx) {
	this.ctx = ctx;
}

async function storeImage (token, image) {
	this.ctx.api.essence.validate(image, "image");
	let buff = fs.readFileSync(path.join(__dirname, "../../", image.path));
	let __image = this.ctx.driver.openCollection("image");
	let { id } = await __image.post({
		name: image.filename,
		_attachments: {
			img: {
				content_type: image.mimetype,
				data: buff
			}
		}
	});
	return id;
}

async function getImage (token, _id) {
	let __image = this.ctx.driver.openCollection("image");
	return __image.getAttachment(_id, "img");
}

async function rmImage (token, _id) {
	let __image = this.ctx.driver.openCollection("image");
	let doc = await __image.get(_id);
	await __image.remove(doc);
}
