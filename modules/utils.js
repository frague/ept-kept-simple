export const className = names => {
	return Object.entries(names)
		.filter(([, condition]) => !!condition)
		.map(([name]) => name)
		.join(' ');
};