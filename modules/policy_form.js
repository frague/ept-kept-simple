import { clonePolicy, policyTypes, Policy } from './policy.js';
import { storage } from './storage.js';

export const placeholder = document.getElementById('forms');

export const clearForm = () => {
	placeholder.innerHTML = '';
};

const showDebug = true;

export const listKeysIn = (source, prefix, destination) => {
	let dest = destination;
	// if (prefix) {
	// 	if (!destination.hasOwnProperty(prefix)) {
	// 		destination[prefix] = {};
	// 	}
	// 	dest = destination[prefix];
	// }
	// Accumulating parameters top-to-bottom level
	// in flatten key-value format. 
	Object.keys(source).forEach(key => {
		let pkey = prefix ? `${prefix}.${key}` : key;
		// if (source[key]) {
		// 	// If a parameter has been
		// 	// set on the lower level - it should be removed from 
		// 	// the resulting set
		// 	delete dest[key];
		// } else {
		// 	// otherwise it should be proxied to the top
		// 	dest[key] = '';
		// }
		dest[pkey] = source[key];
	});
}

function gatherParameters(ept, catalog, collector={}, flatten, prefix) {
	if (ept.type === policyTypes.elementary) prefix = ept.id || ept.ownId;
	return ept.asJSON.nodes.reduce((result, {id, ownId}) => {
		let nextLevel = id || ownId;
		let node = catalog[nextLevel];
		if (!node) {
			throw new Error(`Unable to find EPT (ID: ${id}, OwnID: ${ownId})`);
		}

		let pr = '';
		if (node.type === policyTypes.basic) {
			pr = prefix ? `${prefix}.${nextLevel}` : (nextLevel);
			result[ownId] = {
				label: node.data.label,
				parameters: node.data.parameters
			};
			// listKeysIn(node.data.parameters, pr, flatten);
			return result;
		}

		let json = node.asJSON;
		if (json) {
			result[nextLevel] = {
				label: node.data.label,
				parameters: {},
				children: gatherParameters(node, catalog, {}, flatten, pr)
			};
			
			if (node.type === policyTypes.elementary) {
				listKeysIn(json.parameters, nextLevel, flatten);
			}
		}
		return result;
	}, collector);
}

// Represents currently created EPTs as a dictionary with ownId as keys
export const buildEptCatalog = () => {
	return storage.get(Policy.name, []).reduce((result, ept) => {
		result[ept.ownId] = ept;
		return result;
	}, {});
}

export class PolicyForm {
	fullCatalog = {};

	constructor(policy, callback=() => {}, isReadonly=false) {
		this.callback = callback;

		this.policy = policy;
		this.isReadonly = isReadonly;

		// Rebuild full EPTs catalog to include newly cloned ones (uncommitted)
		this.fullCatalog = buildEptCatalog();
		console.log(this.fullCatalog);

		// Walking the catalog in order to gather the real parameters set 
		// on the children
		let flatten = {};
		this.formParameters = {
			label: policy.data.label,
			parameters: policy.data.parameters,
			children: gatherParameters(policy, this.fullCatalog, {}, flatten)
		};

		this.data = clonePolicy(policy.data);
		this.data.parameters = flatten;
	}

	renderParametersForm(container) {
		let ul = document.createElement('ul');
		let bucket = '';

		Object.keys(this.data.parameters || {}).sort().forEach(path => {
			console.log('Path', path);

			let [elementaryId, basicId, parameter] = path.split('.');

			let elementary = this.fullCatalog[elementaryId].data.label;
			let basic = this.fullCatalog[basicId].data.label;

			if (bucket !== `${elementaryId}.${basicId}`) {
				let li = document.createElement('li');
				let label = document.createElement('h2');
				label.innerText = `${elementary} (${basic})`;
				ul.appendChild(label);
				bucket = `${elementaryId}.${basicId}`;
			}

			this._appendInput(parameter, this.data.parameters[path], ul, elementaryId, basicId);
		});

		container.appendChild(ul);
	}

	_updateParameter(input, elementaryId, basicId) {
		let ept = this.fullCatalog[elementaryId];
		if (!ept) throw new Error(`Unable to set parameters in ID:${elementaryId}`);
		let {name, value} = input;
		ept.asJSON.parameters[`${basicId}.${name}`] = value;
		this.renderJson();
	}

	_appendInput(name, value, container, elementaryId, basicId) {
		let li = document.createElement('li')

		let label = document.createElement('label');
		label.htmlFor = name;
		label.innerText = name;

		let input = document.createElement('input');
		input.id = name;
		input.name = name;
		input.value = value;
		input.onchange = () => this._updateParameter(input, elementaryId, basicId);

		label.appendChild(input);
		li.appendChild(label);

		container.appendChild(li);
	}

	// Updates validity status of the top level of child 
	// EPTs
	updateNodesValidity() {
		// console.log('Update nodes validity:');
		let children = this.formParameters.children;
		Object.keys(children || {}).forEach(ownId => {
			let node = this.fullCatalog[ownId];
			if (!node) {
				throw Error(`Unable to find node ${ownId} in the catalog`);
			}
			// Update each child node's parameters based on the
			// gathered information
			node.data.parameters = children[ownId].parameters;
			let hasErrors = node.validatePolicyParameters(ownId, this.data.parameters);
			// console.log('Validity:', node.ownId, !hasErrors);
			if (hasErrors !== node.hasErrors) {
				node.hasErrors = hasErrors;
				node.render();
			}
		});
	}

	renderJson() {
		this.pre0.innerText = JSON.stringify(this.data.parameters, null, 2);
		this.pre1.innerText = JSON.stringify(this.policy.data.parameters, null, 2);
		this.pre2.innerText = JSON.stringify(this.formParameters, null, 2);
		this.pre3.innerText = JSON.stringify(this.policy.asJSON, null, 2);
	}

	render() {
		if (!placeholder) return;
		clearForm();
		placeholder.className = 'ept';


		if ([policyTypes.reference, policyTypes.basic].includes(this.policy.type)) {
			let title = document.createElement('h1');
			title.innerText = this.data.label;
			placeholder.appendChild(title);
		} else {
			let title = document.createElement('h1');
			title.innerText = 'Parameters';
			placeholder.appendChild(title);

			let label = document.createElement('input');
			label.id = 'label';
			label.value = this.data.label;
			label.onchange = () => this.data.label = label.value;
			placeholder.appendChild(label);
		}

		this.renderParametersForm(placeholder);

		let commitButton = document.createElement('button');
		commitButton.innerText = 'Commit Changes';
		commitButton.onclick = () => {
			this.callback(clonePolicy(this.data));
			// this.updateNodesValidity();
			this.renderJson();
		};
		placeholder.appendChild(commitButton);

		let debug = document.getElementById('debug');
		debug.innerHTML = '';
		this.pre0 = document.createElement('pre');
		this.pre1 = document.createElement('pre');
		this.pre2 = document.createElement('pre');
		this.pre3 = document.createElement('pre');
		if (showDebug) {
			debug.append(
				document.createTextNode('this.data.parameters (Form data)'),
				this.pre0, 
				document.createTextNode('this.policy.data.parameters (Active EPT)'),
				this.pre1, 
				document.createTextNode('this.formParameters (Gathered on init)'),
				this.pre2,
				document.createTextNode('this.policy.asJSON (asJSON)'),
				this.pre3,
			);
		}
		this.renderJson();
		
	}
}