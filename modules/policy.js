import { Draggable } from './draggable.js';
import { ConnectionPoint, connectionPointTypes } from './connection_point.js';
import { PolicyForm } from './policy_form.js';

const titleMaxWidth = 150;
export const policyWidth = 150;
export const policyHeight = 30;
const charWidth = 6;

export const policyTypes = {
	'basic': '#DDF', 
	'cloned': '#EEE', 
	'new': '#DFD',
	'reference': '#EFEFEF'
};

export const clonePolicy = policy => {
	let clonedPolicy = Object.assign({}, policy);
	clonedPolicy.parameters = Object.assign({}, policy.parameters);
	return clonedPolicy;
}

export class Policy extends Draggable {
	wasMoved = false;
	type = policyTypes.reference;
	hasErrors = false;

	input = null;
	output = null;

	constructor(paper, position, data) {
		super(position);
		this.paper = paper;

		this.data = clonePolicy(data);
		this.validatePolicyParameters(this.data);
	}

	destructor() {
		super.destructor();
		this.linkedWith.forEach(linked => linked.destructor());
		this.group.remove();
		delete this;
	}

	clone() {
		return new Policy(this.paper, this.position, this.data);
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
		return point;
	}

	addConnections() {
		let {x, y} = this.position;
		this.input = this.addConnectionPoint(y, connectionPointTypes.in, false, false, this.data.input_types);
		this.output = this.addConnectionPoint(y + policyHeight, connectionPointTypes.out, false, true, [this.data.output_type]);

		this.group.push(
			this.paper.image('/images/delete.png', x + policyWidth - 14, y + 2, 12, 12)
				.attr('cursor', 'hand')
				.click(() => {
					this.destructor();
				}),
			this.paper.image('/images/settings.png', x + policyWidth - 30, y + 2, 12, 12)
				.attr('cursor', 'hand')
				.click(() => {
					new PolicyForm(this, data => {
						this.data = data;
						this.validatePolicyParameters(data);
						this.render();
					})
						.render();
				})
		);
	}

	startDragging() {
		let policy = this.container.entity;
		if (!policy.wasMoved) {
			let np = policy.clone();
			np.type = policy.type;
			np.render();

			policy.wasMoved = true;
			policy.addConnections();
			policy.type = policyTypes.reference;
			policy.render();
		}
		super.startDragging();
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
    	let color = this.type;
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
		}
		this.rect.attr('fill', this._determineColor());
		this.text.attr('text', this._splitTitle(this.data.label));
		super.render();
		return this.group;
	}
}