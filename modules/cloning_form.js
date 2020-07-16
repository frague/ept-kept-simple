import { placeholder, clearForm, buildEptCatalog } from './policy_form.js';
import { Policy, policyTypes } from './policy.js';
import { generateId } from './base.js';
import { storage } from './storage.js';

const showDebug = true;
const version = /( v\.(\d+))$/;

export const addVersion = title => {
	let titles = storage.get(Policy.name || []).map(ept => ept.data.label);
	let newTitle = title;
	do {
		let match = newTitle.match(version);
		let nextVersion = match ? match[2] : 0;
		newTitle = `${title} v.${++nextVersion}`
	} while (titles.includes(newTitle));
	return newTitle;
};

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
		let defaultState = true;

		return ept.asJSON.nodes.reduce((result, {id, ownId}) => {
			let nextId = id || ownId;
			let node = catalog[nextId];
			if (!node) {
				console.log('Catalog:', catalog);
				throw new Error(`Unable to find EPT (ID: ${id}, OwnID: ${ownId})`);
			}

			if (node.type === policyTypes.basic) {
				return {};
			} else if (node.type === policyTypes.elementary) {
				console.log('Elementary node: ', node);
			}

			let childrenContainer = document.createElement('ul');
			childrenContainer.className = defaultState ? 'shown' : 'hidden';

			let h3 = document.createElement('h3');

			let cloningSelector = document.createElement('input');
			cloningSelector.type = 'checkbox';
			cloningSelector.disabled = node.type === policyTypes.basic;
			cloningSelector.checked = defaultState ? 'checked' : '';
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
				clone: defaultState,
				id: nextId,
				checkbox: cloningSelector,
				children: this.collectAndRenderChildren(node, catalog, childrenContainer),
				newOwnId: generateId(),
				newReferenceId: generateId(),
				onlyCreate: true
			};

			h3.append(cloningSelector, document.createTextNode(node.data.label));
			container.append(h3, childrenContainer);

			result[ownId] = eptCloningStatus;
			return result;
		}, {});
	}

	doCloning(eptTree, catalog, changedReferences={}) {
		let clones = Object.entries(eptTree).map(([ownId, nodeData]) => {
			if (!nodeData.clone) return;

			if (nodeData.children) {
				// Perform bottom-to-top cloning
				this.doCloning(nodeData.children, catalog, changedReferences);
			}
			let node = catalog[nodeData.id || ownId];
			if (!node) {
				console.log(nodeData, ownId, catalog);
				throw new Error(`Unable to find EPT (ID: ${nodeData.id}, OwnID: ${ownId})`);
			}

			let reference = node.clone(null, node.type === policyTypes.elementary ? true : changedReferences);
			let [newOwnId, newReferenceId] = changedReferences[ownId];
			reference.id = null;
			reference.ownId = newReferenceId;
			reference.isCloned = true;
			reference.onlyCreate = !!nodeData.onlyCreate;
			reference.data.label = addVersion(reference.data.label);
			console.log('Cloning', node, 'into', reference);
			return reference;
		});
		if (clones && clones.length) return clones[0];
	}

	renderJson() {
		this.pre0.innerText = JSON.stringify(this.eptsTree, null, 2);
	}

	getChangedReferences(eptsTree, flatten={}) {
		Object.entries(eptsTree).forEach(([ownId, nodeData]) => {
			if (nodeData.clone) {
				flatten[ownId] = [nodeData.newOwnId, nodeData.newReferenceId];
			}
			this.getChangedReferences(nodeData.children, flatten);
		});
		return flatten;
	}

	cloningClicked() {
		console.log('EPTs tree:', this.eptsTree);
		let [myOwnId, myReferenceId] = [generateId(), generateId()];
		let changedReferences = this.getChangedReferences(this.eptsTree, {[this.ept.ownId]: [myOwnId, myReferenceId]});
		console.log('Changed references:', changedReferences);
		let clone = this.doCloning(
			{
				[this.ept.ownId]: {
					id: this.ept.id,
    				label: this.ept.data.label,
					type: this.ept.type,
				    clone: true,
					children: this.eptsTree,
					newOwnId: myOwnId,
					newOwnId: myReferenceId,
					onlyCreate: false
				}
			},
			this.catalog,
			changedReferences
		);
		this.callback(clone);
		clearForm();
		delete this;
	}

	render() {
		clearForm();
		placeholder.className = 'cloning';

		let h1 = document.createElement('h1');
		h1.innerText = `"${this.ept.data.label}" Cloning`;
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
		cloneButton.onclick = () => this.cloningClicked();
		placeholder.appendChild(cloneButton);

		// Printing debug information
		let debug = document.getElementById('debug');
		debug.innerHTML = '';
		this.pre0 = document.createElement('pre');

		if (showDebug) {
			debug.append(
				document.createTextNode('EPTs tree'),
				this.pre0
			);
		}
		this.renderJson();
	}
}