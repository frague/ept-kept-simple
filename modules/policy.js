import { Draggable } from './draggable.js';
import { ConnectionPoint, connectionPointTypes } from './connection_point.js';

const titleMaxWidth = 150;
const policyWidth = 150;
export const policyHeight = 30;
const charWidth = 6;

export class Policy extends Draggable {
	wasMoved = false;

	connectionPoint = null;

	constructor(paper, position, data) {
		super(position);
		this.paper = paper;
		this.data = data;
	}

	clone() {
		return new Policy(this.paper, this.position, this.data);
	}

	startDragging() {
		let policy = this.container.entity;
		if (!policy.wasMoved) {
			policy.clone().render();
			policy.wasMoved = true;
			policy.connectionPoint = new ConnectionPoint(
				policy.paper,
				{x: policy.position.x + policyWidth / 2, y: policy.position.y},
				connectionPointTypes.in,
				true
			);
			policy.group.push(policy.connectionPoint.render());
			policy.linkWith(policy.connectionPoint);
		}
		super.startDragging();
	}

	move(dx, dy) {
		super.move(dx, dy);
		let policy = this.container.entity;
		if (policy.ConnectionPoint) {
			policy.ConnectionPoint.render();
		}
	}

	updatePosition(dx, dy) {
		super.updatePosition(dx, dy);
		if (this.connectionPoint) {
			this.connectionPoint.updatePosition(dx, dy);
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