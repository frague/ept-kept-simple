import { Draggable } from './draggable.js';
import { ConnectionPoint, connectionPointTypes } from './connection_point.js';

const titleMaxWidth = 150;
const policyWidth = 150;
export const policyHeight = 30;
const charWidth = 6;

export class Policy extends Draggable {
	wasMoved = false;

	input = null;
	output = null;

	constructor(paper, position, data) {
		super(position);
		this.paper = paper;
		this.data = data;
	}

	clone() {
		return new Policy(this.paper, this.position, this.data);
	}

	addConnectionPoint(y, type, isStatic, isMulti) {
		let point = new ConnectionPoint(
			this.paper,
			{x: this.position.x + policyWidth / 2, y},
			type,
			isStatic,
			isMulti
		);
		this.group.push(point.render());
		this.linkWith(point);
		return point;
	}

	startDragging() {
		let policy = this.container.entity;
		if (!policy.wasMoved) {
			policy.clone().render();
			policy.wasMoved = true;

			policy.input = policy.addConnectionPoint(policy.position.y, connectionPointTypes.in, false, false);
			policy.output = policy.addConnectionPoint(policy.position.y + policyHeight, connectionPointTypes.out, false, true);
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

	render() {
		if (!this.wasTouched) {
			let {x, y} = this.position;
			this.group = this.paper.set();
			let rect = this.paper.rect(x, y, policyWidth, policyHeight)
				.attr({
			    	'fill': '#EEE',
			    	'stroke': '#000'
				});
			let text = this.paper.text(x + 5, y + policyHeight / 2, this._splitTitle(this.data.name))
				.attr({
					'text-anchor': 'start'
				});

			this.group.push(rect, text);
			this.makeDraggable(this.group, [rect, text]);
		}
		super.render();
		return this.group;
	}
}