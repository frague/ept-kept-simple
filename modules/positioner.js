import { storage } from './storage.js';
import { Policy, policyHeight } from './policy.js';
import { Link } from './link.js';
import { ConnectionPoint, connectionPointTypes } from './connection_point.js';

export class Positioner {
	starts;
	ends;
	positions = [];
	
	init() {
		this.starts = [];
		this.ends = [];
		storage.get(ConnectionPoint.name, []).forEach(point => 
			(point.type === connectionPointTypes.in ? this.ends : this.starts).push(point)
		);
		this.positions = storage.get(Policy.name, [])
			.filter(ept => ept.isRendered)
			.map(ept => ept.position);
	}

	addLink(ept) {
		let connectionCandidates = this.starts
			// Filter out impossible connections
			.filter(point => point.canConnectTo(ept.input))
			// Sort possible ones by relevance
			.sort((point1, point2) => {
				return (point1.belongsTo || 'ID0') > (point2.belongsTo || 'ID0') ? -1 : 1;
			});

		// Connect to the most relevant candidate if there are any
		if (connectionCandidates.length) {
			new Link(ept.paper, connectionCandidates[0], ept.input).render();
		}
	}

	position(ept) {
		this.init();

		let maxY = Math.max(...this.positions.map(p => p.y), 20);
		ept.position = {x: 230, y: maxY + policyHeight + 65};
		ept.render();

		this.addLink(ept);

		return ept;
	}
}