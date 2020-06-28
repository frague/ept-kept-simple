import { clonePolicy } from './policy.js';

const placeholder = document.getElementById('forms');

export class PolicyForm {
	constructor(policy, callback=() => {}) {
		this.callback = callback;

		this.policy = clonePolicy(policy);
	}


	_clear() {
		placeholder.innerHTML = '';
	}

	_updateParameter(input) {
		let {name, value} = input;
		this.policy.parameters[name] = value;
	}

	_appendInput(name, value) {
		let div = document.createElement('div')

		let label = document.createElement('label');
		label.htmlFor = name;
		label.innerText = name;
		div.appendChild(label);

		let input = document.createElement('input');
		input.id = name;
		input.name = name;
		input.value = value;
		input.onchange = () => this._updateParameter(input);
		div.appendChild(input);

		placeholder.appendChild(div);
	}

	render() {
		if (!placeholder) return;
		this._clear();

		let title = document.createElement('h1');
		title.innerText = this.policy.label;
		placeholder.appendChild(title);

		Object.keys(this.policy.parameters || {}).forEach(name => this._appendInput(name, this.policy.parameters[name]));

		let commitButton = document.createElement('button');
		commitButton.innerText = 'Commit Changes';
		commitButton.onclick = () => this.callback(clonePolicy(this.policy));
		placeholder.appendChild(commitButton);
	}
}