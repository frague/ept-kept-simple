import { Draggable } from './draggable.js';
import { ConnectionPoint, connectionPointTypes } from './connection_point.js';
import { PolicyForm } from './policy_form.js';
import { isEptValid } from './validator.js';
import { className } from './utils.js';

const titleMaxWidth = 150;
export const policyWidth = 150;
export const policyHeight = 40;
const charWidth = 6;

export const policyTypes = {
	new: 'new',
	basic: 'basic',
	elementary: 'elementary',
	custom: 'custom',
	reference: 'reference',
};

export const policyTypesColors = {
	[policyTypes.basic]: '#DDF', 
	[policyTypes.elementary]: '#FFF', 
	[policyTypes.reference]: '#DDF', 
	[policyTypes.custom]: '#888',
};

export const clonePolicy = policy => {
	let clonedPolicy = Object.assign({}, policy);
	clonedPolicy.parameters = Object.assign({}, policy.parameters);
	return clonedPolicy;
}

export const fromJSON = (json, availablePolicies) => {
	let p = availablePolicies[json.id || json.ownId];
	if (p) {
		let result = p.clone(policyTypes.reference);
		result.position = json.position;
		result.id = json.id;
		result.ownId = json.ownId;
		result.asJSON.parameters = json.parameters;
		result.data.parameters = json.parameters;
		return result;
	} else {
		console.log(json, availablePolicies);
		throw new Error(`Unable to find EPT id=${json.id}`);
	}
};

export class Policy extends Draggable {
	type;
	hasErrors = true;
	asJSON = {nodes: [], links: [], parameters: {}};
	data = {};
	input = null;
	output = null;
	isSaved = false;
	isCloned = false;
	onDestruct = () => {};

	serialized = {};

	constructor(paper, position, data, type=policyTypes.reference) {
		super(position);
		this.paper = paper;
		this.data = clonePolicy(data);
		this.hasErrors = isEptValid(this.ownId); 
		this.type = type;
	}

	destructor(keepObject=false) {
		super.destructor();
		this.hide();
		this.onDestruct();
		if (!keepObject) delete this;
	}

	hide() {
		if (this.isRendered) {
			this.group.remove();
			this.isRendered = false;
		}
		this.linkedWith.forEach(linked => linked.destructor());
	}

	toJSON() {
		return {
			id: this.id,
			ownId: this.ownId,
			parameters: Object.assign({}, this.data.parameters),
			position: this.position
		};
	}

	clone(type=null, cloneReferences=false) {
		let p = new Policy(this.paper, this.position, this.data, type || this.type);
		let asJSON = {
			nodes: [...this.asJSON.nodes],
			links: [...this.asJSON.links],
			parameters: Object.assign({}, this.asJSON.parameters)
		};
		if (cloneReferences) {
			let oldOwnIds = {};
			asJSON.nodes = asJSON.nodes.map(node => {
				let ownId = node.ownId;
				let newId;
				let referenceId;
				let update = {};
				if (cloneReferences === true) {
					// All references must be regenerated
					newId = this.generateId();
					update = {ownId: newId};
				} else {
					// Only supplied references must be regenerated
					[newId, referenceId] = cloneReferences[ownId] || [ownId, node.id];
					update = {id: referenceId, ownId: newId}
				}
				oldOwnIds[ownId] = newId;
				return Object.assign({}, node, update);
			});
			asJSON.links = asJSON.links.map(([from, to]) => {
				return [
					oldOwnIds[from] || from,
					oldOwnIds[to] || to
				]
			});
		}
		p.asJSON = asJSON;
		p.id = this.ownId;
		p.hasErrors = this.hasErrors;
		p.isCloned = this.isCloned;
		return p;
	}

	save() {
		switch (this.type) {
			case policyTypes.new:
			case policyTypes.reference:
				this.type = policyTypes.custom;
				this.id = null;
				break;
			case policyTypes.basic:
			case policyTypes.custom:
			case policyTypes.elementary:
				this.id = null;
				break;
		}
		this.isSaved = true;
	}

	addConnectionPoint(y, type, isStatic, isMulti, acceptedTypes) {
		let point = new ConnectionPoint(
			this.paper,
			{x: this.position.x + policyWidth / 2, y},
			type,
			isStatic,
			isMulti,
			acceptedTypes
		);
		point.isHidden = !acceptedTypes.length || acceptedTypes.includes(null);
		this.group.push(point.render());
		this.linkWith(point);
		point.belongsTo = this.ownId;
		return point;
	}

	addExtras() {
		let {x, y} = this.position;
		this.input = this.addConnectionPoint(y, connectionPointTypes.in, false, false, this.data.input_types);
		this.output = this.addConnectionPoint(y + policyHeight, connectionPointTypes.out, false, true, [this.data.output_type]);

		this.group.push(
			this.paper.image('./images/close.png', x + policyWidth - 12, y + 4, 8, 8)
				.attr('cursor', 'hand')
				.click(() => {
					this.destructor();
						let policyForm = window.policyForm;
						if (policyForm) {
							policyForm.update();
						}
					}
				),
		);
	}

	updatePosition(dx, dy) {
		super.updatePosition(dx, dy);
		if (this.input) {
			this.input.updatePosition(dx, dy);
			this.output.updatePosition(dx, dy);
		}
	}

    _splitTitle(text) {
    	return text.split(' ').reduce((result, chunk, index) => {
    		if (!index) return chunk;
    		let width = (result.length + chunk.length) * charWidth;
    		return result + (width > titleMaxWidth ? '\n' : ' ') + chunk;
    	});
    }

    _determineColor() {
    	let color = policyTypesColors[this.type];
    	if (this.hasErrors) {
    		color = '#e58f96';
    	}
    	return color;
    }

    _determineClassNames() {
    	return className({
    		'ept': true,
    		[this.type]: true,
    		'error': this.hasErrors,
    		'cloned': this.isCloned,
    	});
    }

	render() {
		if (!this.isRendered) {
			let {x, y} = this.position;
			this.group = this.paper.set();
			if (this.isCloned) {
				let cRect = this.paper.rect(x + 4, y + 4, policyWidth, policyHeight)
				.attr({
			    	'fill': '#AAA',
			    	'stroke': '#000'
				});
				this.group.push(cRect);
			}
			this.rect = this.paper.rect(x, y, policyWidth, policyHeight)
				.attr('stroke', '#000');
			this.text = this.paper.text(x + 5, y + policyHeight / 2, this._splitTitle(this.data.label))
				.attr({
					'text-anchor': 'start',
					'font-size': '13px'
				});
			this.group.push(this.rect, this.text);
			this.makeDraggable(this.group);

			this.addExtras();
		}
		// this.rect.attr('fill', this._determineColor());
		this.rect.node.setAttribute('class', this._determineClassNames());
		this.text.attr('text', this._splitTitle(this.data.label));
		super.render();
		return this.group;
	}
}