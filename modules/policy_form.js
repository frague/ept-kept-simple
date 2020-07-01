import { clonePolicy, policyTypes, Policy } from './policy.js';
import { storage } from './storage.js';

const placeholder = document.getElementById('forms');

export const clearForm = () => {
	placeholder.innerHTML = '';
};

// function _prefixParameters(prefix, parameters) {
// 	return Object.keys(parameters).reduce((result, key) => {
// 		result[`${prefix}|${key}`] = parameters[key];
// 		return result;
// 	}, {});
// }

function gatherParameters(ept, catalog, path, collector={}) {
	return ept.asJSON.nodes.reduce((result, {id, ownId}) => {
		let node = catalog[id];
		if (!node) {
			throw new Error(`Unable to find EPT (ID: ${id}, OwnID: ${ownId})`);
		}
		let localPath = `${path}${path ? '|' : ''}${ownId}`;

		if (node.type === policyTypes.basic) {
			result[ownId] = {
				label: node.data.label,
				parameters: node.data.parameters
				// parameters: _prefixParameters(localPath, node.data.parameters)
			};
			return result;
		}

		let json = node.asJSON;
		if (json) {
			result[ownId] = gatherParameters(node, catalog, localPath, {
				label: node.data.label,
				parameters: json.parameters
				// parameters: _prefixParameters(localPath, json.parameters)
			});
		}
		return result;
	}, collector);
}

export class PolicyForm {
	constructor(policy, callback=() => {}, isReadonly=false) {
		this.callback = callback;

		this.policy = policy;
		this.data = clonePolicy(policy.data);
		this.isReadonly = isReadonly;

		// Rebuild full EPTs catalog to include newly cloned ones (uncommitted)
		let fullCatalog = storage.get(Policy.name, []).reduce((result, ept) => {
			result[ept.ownId] = ept;
			return result;
		}, {});
		console.log(fullCatalog);
		let p = gatherParameters(policy, fullCatalog, policy.ownId);
		console.log('Parameters gathered:', p);
	}

	_updateParameter(input) {
		let {name, value} = input;
		this.data.parameters[name] = value;
	}

	_appendInput(name, value) {
		let div = document.createElement('div')

		let label = document.createElement('label');
		label.htmlFor = name;
		label.innerText = name;

		let input = document.createElement('input');
		input.id = name;
		input.name = name;
		input.value = value;
		input.onchange = () => this._updateParameter(input);
		if (this.isReadonly || (value && ![policyTypes.cloned, policyTypes.new].includes(this.policy.type))) {
			input.setAttribute('disabled', 'true');
		}

		label.appendChild(input);
		div.appendChild(label);

		placeholder.appendChild(div);
	}

	render() {
		if (!placeholder) return;
		clearForm();

		if ([policyTypes.reference, policyTypes.basic].includes(this.policy.type)) {
			let title = document.createElement('h1');
			title.innerText = this.data.label;
			placeholder.appendChild(title);
		} else {
			let title = document.createElement('input');
			title.id = 'label';
			title.value = this.data.label;
			title.onchange = () => this.data.label = title.value;
			placeholder.appendChild(title);
		}

		Object.keys(this.data.parameters || {}).forEach(name => this._appendInput(name, this.data.parameters[name]));

		let commitButton = document.createElement('button');
		commitButton.innerText = 'Commit Changes';
		commitButton.onclick = () => this.callback(clonePolicy(this.data));
		placeholder.appendChild(commitButton);
	}
}