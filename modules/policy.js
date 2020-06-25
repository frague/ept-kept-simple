import { Draggable } from './draggable.js';

const titleMaxWidth = 150;
const policyWidth = 150;
export const policyHeight = 30;
const charWidth = 6;

export class Policy extends Draggable {
	wasMoved = false;

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
		if (!this.wasMoved) {
			this.container.policy.clone();
			this.wasMoved = true;
		}
		super.startDragging();
	}

    _splitTitle(text) {
    	return text.split(' ').reduce((result, chunk, index) => {
    		if (!index) return chunk;
    		let width = (result.length + chunk.length) * charWidth;
    		return result + (width > titleMaxWidth ? '\n' : ' ') + chunk;
    	});
    }

	render() {
		this.group = this.paper.set();
		let rect = this.paper.rect(this.position.x, this.position.y, policyWidth, policyHeight)
			.attr({
		    	fill: '#EEE',
		    	stroke: '#000'
			});
		let text = this.paper.text(this.position.x + 5, this.position.y + policyHeight / 2, this._splitTitle(this.data.name))
			.attr({'text-anchor': 'start'});

		this.group.push(rect, text);
		this.group.policy = this;
		this.makeDraggable(this.group, [rect, text]);
	}
}