import { placeholder, clearForm, buildEptCatalog } from './policy_form.js';
import { policyTypes } from './policy.js';

export class CloningForm {
	eptsTree = {};

	constructor(ept, callback) {
		this.ept = ept;
		this.callback = callback;
	}

	_resetChildrenCloning(children) {
		Object.keys(children).forEach(key => {
			let child = children[key];
			child.clone = false;
			child.checkbox.checked = false;
			if (child.children) this._resetChildrenCloning(child.children);
		});
	}

	collectAndRenderChildren(ept, catalog, container) {
		return ept.asJSON.nodes.reduce((result, {id, ownId}) => {
			let node = catalog[id];
			if (!node) {
				throw new Error(`Unable to find EPT (ID: ${id}, OwnID: ${ownId})`);
			}

			let childrenContainer = document.createElement('ul');
			childrenContainer.className = 'hidden';

			let h3 = document.createElement('h3');

			let cloningSelector = document.createElement('input');
			cloningSelector.type = 'checkbox';
			cloningSelector.disabled = node.type === policyTypes.basic;
			cloningSelector.onchange = ({target}) => {
				let isChecked = target.checked;
				childrenContainer.className = isChecked ? 'shown' : 'hidden';
				eptCloningStatus.clone = isChecked;
				if (!isChecked && eptCloningStatus.children) {
					// If not checked all childredn cloning statuses must be reset
					this._resetChildrenCloning(eptCloningStatus.children);
				}
				this.renderJson();
			};

			let eptCloningStatus = {
				label: node.data.label,
				type: node.type,
				clone: false,
				id: node.id,
				checkbox: cloningSelector,
				children: this.collectAndRenderChildren(node, catalog, childrenContainer)
			};

			h3.append(cloningSelector, document.createTextNode(node.data.label));
			container.append(h3, childrenContainer);

			result[ownId] = eptCloningStatus;
			return result;
		}, {});
	}

	doCloning(eptTree, catalog, changedReferences={}) {
		let clones = Object.keys(eptTree).map(ownId => {
			let nodeData = eptTree[ownId];
			if (!nodeData.clone) return;

			if (nodeData.children) {
				// Perform bopttom-to-top cloning
				this.doCloning(nodeData.children, catalog, changedReferences);
			}
			let node = catalog[nodeData.id];
			if (!node) {
				throw new Error(`Unable to find ept ID:${nodeData.id} in the catalog`);
			}

			let isBasic = nodeData.type === policyTypes.basic;

			let reference;
			let asJSON;
			let data = {};
			if (isBasic) {
				reference = node.clone(policyTypes.reference);
				// Keeping changed references to the new EPTs
				changedReferences[ownId] = [node.id, reference.ownId];
				return reference;
			} else {
				// Full cloning for the custome EPTs +
				// new cloned reference creation
				let cloned = node.clone(policyTypes.clonedCustom);
				asJSON = cloned.asJSON;
				data = cloned.data;
				reference = cloned.clone(policyTypes.cloned);
				reference.id = cloned.id;

				// Keeping changed references to the new EPTs
				changedReferences[ownId] = [cloned.id, reference.ownId];
			}

			let children = nodeData.children;

			// Swapping references to the newly created EPTs and references
			if (nodeData.clone) {
				asJSON.nodes = asJSON.nodes.map(node => {
					if (changedReferences[node.ownId]) {
						[node.id, node.ownId] = changedReferences[node.ownId];
					}
					return node;
				});
			}

			// Updatign parameters in accordance with the new nodes ownIds.
			// Parameter's parts should be changed start-to-end without the
			// unchanged "holes" in the middle.
			asJSON.parameters = Object.keys(asJSON.parameters).reduce((result, parameter) => {
				let stop = false;
				let name = parameter
					.split('.')
					.map(part => {
						if (changedReferences[part] && !stop) {
							return changedReferences[part][1];
						}
						stop = true;
						return part;
					})
					.join('.');
				result[name] = asJSON.parameters[parameter];
				return result;
			}, {});
			data.parameters = asJSON.parameters;
			return reference;
		});
		if (clones && clones.length) return clones[0];
	}

	renderJson() {
		this.pre0.innerText = JSON.stringify(this.eptsTree, null, 2);
	}

	render() {
		clearForm();
		placeholder.className = 'cloning';

		let h1 = document.createElement('h1');
		h1.innerText = `EPT "${this.ept.data.label}" cloning`;
		placeholder.appendChild(h1);

		let container = document.createElement('ul');
		let cloneHint = document.createElement('div');
		cloneHint.innerText = 'Clone?';
		container.appendChild(cloneHint);

		this.catalog = buildEptCatalog();

		this.eptsTree = this.collectAndRenderChildren(this.ept, this.catalog, container);
		placeholder.appendChild(container);

		let cloneButton = document.createElement('button');
		cloneButton.innerText = 'Clone';
		cloneButton.onclick = () => {
			let clone = this.doCloning(
				{
					[this.ept.ownId]: {
						id: this.ept.id,
	    				label: this.ept.data.label,
						type: this.ept.type,
					    clone: true,
						children: this.eptsTree
					}
				},
				this.catalog
			);
			this.callback(clone);
			clearForm();
			delete this;
		};
		placeholder.appendChild(cloneButton);

		// Printing debug information
		let debug = document.getElementById('debug');
		debug.innerHTML = '';
		this.pre0 = document.createElement('pre');
		debug.append(
			document.createTextNode('EPTs tree'),
			this.pre0
		);
		this.renderJson();
	}
}