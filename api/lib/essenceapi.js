let _ = require("lodash");
let TYPES = {
	OPTIONAL: "optional"
};
module.exports = EssenceApi;

EssenceApi.prototype = {
	add,
	get,
	validate
};

function EssenceApi () {
	this.essences = {};
}

/**
 * Add any object for be as schema
 *
 * @param {Object} essence
 * @param {string} name - name of essence
 */
function add (essence, name) {
	if (!_.isPlainObject(essence))
		throw new Error("Invalid type of essence. Expected Object");

	if (!_.isString(name))
		throw new Error("Invalid type of name. Expected string");

	if (this.essences[name])
		throw new Error("Essence already exists.");

	this.essences[name] = essence;
}

/**
 *
 * Validate object by essence
 *
 * @param {Object} object - parameters which need validate
 * @param name - name of essence can be with dot notation
 */
function validate (object, name) {
	if (!_.isPlainObject(object))
		throw new Error("Invalid type of object. Expected Object");

	if (!_.isString(name))
		throw new Error("Invalid type of name. Expected string");

	if (!this.essences[name])
		throw new Error(`Essence not exists (${name})`);

	let essenceKeys = Object.keys(this.essences[name]);
	let objectKeys = Object.keys(object);

	if (essenceKeys.length < objectKeys.length)
		throw new Error(`Essence key length not equal Object key length`);

	essenceKeys.forEach(key => {
		let essValue = this.essences[name][key];
		let objValue = object[key];

		// start to validate keys
		if (essValue === TYPES.OPTIONAL) {

		} else if (objValue === undefined) {
			throw new Error(`Object not have field (${key}).`);
		} else if (_.isArray(essValue) && _.isArray(objValue)) {
			objValue.forEach(subObj => {
				this.validate(subObj `${name}.${key}`);
			})
		} else if (_.isPlainObject(essValue) && _.isPlainObject(objValue)) {
			this.validate(objValue, `${name}.${key}`);
		} else if (_.isString(essValue) && _.isString(objValue)) {

		} else if (_.isFinite(essValue) && _.isFinite(objValue)) {

		} else {
			throw new Error(`Key value not have supported type (${key}.${objValue})`);
		}
	});
}

/**
 * Get essence by name
 *
 * @param name
 */
function get (name) {
	if (!_.isString(name))
		throw new Error("Invalid type of name. Expected string");

	if (!this.essences[name])
		throw new Error(`Essence not exists (${name})`);

	return _.cloneDeep(this.essences[name]);
}