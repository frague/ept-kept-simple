import { Draggable } from './draggable.js';
import { ConnectionPoint } from './connection_point.js';

const titleMaxWidth = 150;
const policyWidth = 150;
export const policyHeight = 30;
const charWidth = 6;

export class Policy extends Draggable {
	wasMoved = false;

	connectionPoint = null;

	constructor(paper, position, data) {
		super();
		this.paper = paper;
		this.position = position
		this.data = data;
	}

	clone() {
		return new Policy(this.paper, this.position, this.data).render();
	}

	startDragging() {
		let policy = this.container.entity;
		if (!policy.wasMoved) {
			policy.clone();
			policy.wasMoved = true;
			policy.connectionPoint = new ConnectionPoint(
				policy.paper,
				{x: policy.position.x + policyWidth - 10, y: policy.position.y + 10
			});
			policy.group.push(policy.connectionPoint.render());
		}
		super.startDragging();
	}

	move(dx, dy) {
		super.move(dx, dy);
		let policy = this.container.entity;
		if (policy.connectionPoint) {
			policy.connectionPoint.render();
		}
	}

	updatePosition(dx, dy) {
		super.updatePosition(dx, dy);
		if (this.connectionPoint) this.connectionPoint.updatePosition(dx, dy);
	}

    _splitTitle(text) {
    	return text.split(' ').reduce((result, chunk, index) => {
    		if (!index) return chunk;
    		let width = (result.length + chunk.length) * charWidth;
    		return result + (width > titleMaxWidth ? '\n' : ' ') + chunk;
    	});
    }

	render() {
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
		this.group.policy = this;
		this.makeDraggable(this.group, [rect, text]);
	}
}