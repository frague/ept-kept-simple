const _key = 'dummyStorage';
const init = () => {
	if (!window.hasOwnProperty(_key)) {
		window[_key] = {};
	}
};

const get = (key, initial=null) => {
	init();
	// console.log(`Get ${key}`);
	return key in window[_key] ? window[_key][key] : set(key, initial);
};

const set = (key, value) => {
	init();
	// console.log(`Set ${key} to be`, value);
	window[_key][key] = value;
	return value;
}

export var storage = {
	get, set
};