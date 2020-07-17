import { clonePolicy, policyTypes, Policy } from './policy.js';
import { storage } from './storage.js';
import { validate } from './validator.js';

export const placeholder = document.getElementById('forms');

export const clearForm = () => {
	placeholder.innerHTML = '';
};

const showDebug = false;


// @obsolete
export const listKeysIn = (source, prefix, destination) => {
	// Accumulating parameters top-to-bottom level
	// in flatten key-value format. 
	Object.keys(source).forEach(key => {
		let pkey = `${prefix}.${key}`;
		if (source[key]) {
			// If a parameter has been
			// set on the lower level - it should be removed from 
			// the resulting set
			delete destination[pkey];
		} else {
			// otherwise it should be proxied to the top
			destination[pkey] = '';
		}
	});
}

// Represents currently created EPTs as a dictionary with ownId as keys
export const buildEptCatalog = () => {
	return storage.get(Policy.name, []).reduce((result, ept) => {
		result[ept.ownId] = ept;
		return result;
	}, {});
}

function gatherParameters(ept, catalog, collector={}, flatten, prefix) {
	return ept.asJSON.nodes.reduce((result, {id, ownId}) => {
		let nextId = id || ownId;
		let node = catalog[nextId];
		if (!node) {
			throw new Error(`Unable to find EPT (ID: ${id}, OwnID: ${ownId})`);
		}

		if (node.type === policyTypes.basic) return {};

		if (node.type === policyTypes.elementary) {
			result[ownId] = {
				label: node.data.label,
				parameters: Object.entries(node.asJSON.parameters).reduce((result, [param, value]) => {
					result[`${id}\t${param}`] = value;
					return result;
				}, {})
			};
			return result;
		}

		let json = node.asJSON;
		if (json) {
			result[ownId] = {
				label: node.data.label,
				parameters: {},
				children: gatherParameters(node, catalog, {}, flatten)
			};
		}
		return result;
	}, collector);
}

export class PolicyForm {
	fullCatalog = {};
	isRendered = false;
	inputs = {};

	constructor(policy, callback=() => {}, isReadonly=false) {
		this.callback = callback;

		this.policy = policy;
		this.isReadonly = isReadonly;
		this.isRendered = false;

		// Rebuild full EPTs catalog to include newly cloned ones (uncommitted)
		this.fullCatalog = buildEptCatalog();
		this.collectParameters();
		
		this.data = clonePolicy(this.policy.data);
		this.data.parameters = {};//Object.assign(flatten, this.policy.data.parameters);
	}

	collectParameters() {
		// Walking the catalog in order to gather the real parameters set 
		// on the children
		// let flatten = {};
		this.formParameters = {
			label: this.policy.data.label,
			parameters: this.policy.data.parameters,
			children: gatherParameters(this.policy, this.fullCatalog, {})
		};
	}

	renderChildrenParameters(ownId, children, container, prevParameters) {
		
		Object.keys(children || {}).forEach(id => {
			let child = children[id];
			
			let ul = document.createElement('ul');
			ul.className = 'collapsed';

			let collapseLink = document.createElement('h2');
			collapseLink.innerText = child.label;
			collapseLink.onclick = () => {
				let state = ul.className === 'expanded';
				ul.className = state ? 'collapsed' : 'expanded'
			};
			ul.appendChild(collapseLink);
			
			let parametersList = document.createElement('ol');
			Object.entries(child.parameters || {}).forEach(([key, value]) => {
				this._appendInput(key, value, parametersList);
			});
			ul.appendChild(parametersList);

			this.renderChildrenParameters(`${ownId}.${id}`, child.children, ul, child.parameters);
			container.appendChild(ul);
		});

	}

	_appendInput(name, value, container) {
		let li = document.createElement('li');
		let [ownerId, title] = name.split('\t');

		let label = document.createElement('label');
		label.htmlFor = title;
		label.innerText = title;

		let input = document.createElement('input');
		input.name = title;
		input.value = value;
		// input.onchange = () => this._updateParameter(input, ownerId);
		input.onkeyup = () => this._updateParameter(input, ownerId);

		label.appendChild(input);
		li.appendChild(label);

		container.appendChild(li);


		// Keep the reference to the input
		// in order to update its value without rerendering
		if (this.inputs[name]) {
			this.inputs[name].push(input);
		} else {
			this.inputs[name] = [input];
		}
	}

	_updateParameter(input, ownerId) {
		let {name, value} = input;
		let ept = this.fullCatalog[ownerId];
		if (!ept) {
			throw new Error(`Unable to find EPT ${ownerId} in the catalog`);
		}
		ept.asJSON.parameters[name] = value;
		(this.inputs[`${ownerId}	${name}`] || [])
			.filter(someInput => someInput !== input)
			.forEach(someInput => someInput.value = value);

		this.applyChanges();
	}

	renderJson() {
		this.pre0.innerText = JSON.stringify(this.data.parameters, null, 2);
		this.pre1.innerText = JSON.stringify(this.policy.data.parameters, null, 2);
		this.pre2.innerText = JSON.stringify(this.formParameters, null, 2);
		this.pre3.innerText = JSON.stringify(this.policy.asJSON, null, 2);
	}

	applyChanges() {
		this.collectParameters();
		validate();
		this.callback(clonePolicy(this.data));
		this.renderJson();
	}

	render() {
		if (!placeholder) return;

		if (this.isRendered) {

		} else {
			clearForm();
			placeholder.className = 'ept';


			let title = document.createElement('h1');
			if ([policyTypes.reference, policyTypes.basic].includes(this.policy.type)) {
				title.innerText = this.data.label;
				placeholder.appendChild(title);
			} else {
				title.innerText = 'Parameters';
				placeholder.appendChild(title);

				let label = document.createElement('input');
				label.id = 'label';
				label.value = this.data.label;
				label.onkeyup = () => {
					this.data.label = label.value;
					this.applyChanges();
				};
				placeholder.appendChild(label);
			}

			this.renderChildrenParameters(this.policy.ownId, this.formParameters.children, placeholder, this.formParameters.parameters);

			// let commitButton = document.createElement('button');
			// commitButton.innerText = 'Commit Changes';
			// commitButton.onclick = () => {
			// 	this.callback(clonePolicy(this.data));
			// 	this.updateNodesValidity();
			// 	this.renderJson();
			// };
			// placeholder.appendChild(commitButton);

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
			this.isRendered = true;
		}
		this.renderJson();
		
	}
}