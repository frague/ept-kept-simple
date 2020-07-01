import { Draggable } from './draggable.js';
import { ConnectionPoint, connectionPointTypes } from './connection_point.js';
import { PolicyForm } from './policy_form.js';

const titleMaxWidth = 150;
export const policyWidth = 150;
export const policyHeight = 30;
const charWidth = 6;

export const policyTypes = {
	basic: 'basic',
	cloned: 'cloned',
	new: 'new',
	reference: 'reference',
	custom: 'custom'
};

export const policyTypesColors = {
	[policyTypes.basic]: '#DDF', 
	[policyTypes.cloned]: '#EEE', 
	[policyTypes.new]: '#DFD',
	[policyTypes.reference]: '#EFEFEF',
	[policyTypes.custom]: '#888'
};

export const clonePolicy = policy => {
	let clonedPolicy = Object.assign({}, policy);
	clonedPolicy.parameters = Object.assign({}, policy.parameters);
	return clonedPolicy;
}

export const fromJSON = (json, availablePolicies) => {
	let p = availablePolicies[json.id];
	if (p) {
		let result = p.clone([policyTypes.basic, policyTypes.custom].includes(p.type) ? policyTypes.reference : p.type);
		result.position = json.position;
		result.ownId = json.ownId;
		return result;
	} else {
		throw new Error('Unable to find EPT id=', json.id);
	}
};

export class Policy extends Draggable {
	wasMoved = false;
	type;
	hasErrors = false;
	asJSON = {nodes: [], links: []};

	input = null;
	output = null;

	serialized = {};

	constructor(paper, position, data, type=policyTypes.reference) {
		super(position);
		this.paper = paper;
		this.data = clonePolicy(data);
		this.validatePolicyParameters(this.data);
		this.type = type;
	}

	destructor(keepObject=false) {
		super.destructor();
		this.linkedWith.forEach(linked => linked.destructor());
		this.group.remove();
		if (!keepObject) delete this;
	}

	toJSON() {
		return {
			id: this.id,
			ownId: this.ownId,
			position: this.position
		};
	}

	clone(type) {
		if (!type) {
			throw new Error('Policy cloning with no type specified!');
		}
		let p = new Policy(this.paper, this.position, this.data, type);
		if (type === policyTypes.reference) {
			p.id = this.id;
		}
		return p;
	}

	validatePolicyParameters(data) {
		this.hasErrors = Object.keys(data.parameters || {}).some(parameter => !data.parameters[parameter]);
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
			this.paper.image('/images/close.png', x + policyWidth - 12, y + 4, 8, 8)
				.attr('cursor', 'hand')
				.click(() => {
					this.destructor();
				}),
			// this.paper.image('/images/settings.png', x + policyWidth - 13, y + 17, 10, 10)
			// 	.attr('cursor', 'hand')
			// 	.click(() => {
			// 		new PolicyForm(this, data => {
			// 			this.data = data;
			// 			this.validatePolicyParameters(data);
			// 			this.render();
			// 		})
			// 			.render();
			// 	})
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
    	if (this.wasMoved) {
	    	if (this.hasErrors) {
	    		color = '#FAA';
	    	}
    	}
    	return color;
    }

	render() {
		if (!this.wasTouched) {
			let {x, y} = this.position;
			this.group = this.paper.set();
			if (this.type === policyTypes.cloned) {
				let cRect = this.paper.rect(x + 4, y + 4, policyWidth, policyHeight)
				.attr({
			    	'fill': '#DDD',
			    	'stroke': '#000'
				});
				this.group.push(cRect);
			}
			this.rect = this.paper.rect(x, y, policyWidth, policyHeight)
				.attr('stroke', '#000');
			this.text = this.paper.text(x + 5, y + policyHeight / 2, this._splitTitle(this.data.label))
				.attr('text-anchor', 'start');
			this.group.push(this.rect, this.text);
			this.makeDraggable(this.group);

			this.addExtras();
		}
		this.rect.attr('fill', this._determineColor());
		this.text.attr('text', this._splitTitle(this.data.label));
		super.render();
		return this.group;
	}
}