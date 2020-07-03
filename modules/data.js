export var basic_epts = [
	{
		'label': 'Subinterface',
		'tags': [],
		'node': '',
		'parameters': {
			'security_zone': '',
			'vlan_id': ''
		},
		'input_types': ['interface'],
		'output_type': 'interface',
		'basic': true,
	},
	{
		'label': 'Attach VLAN',
		'tags': [],
		'node': '',
		'parameters': {
			'vlan_id': ''
		},
		'input_types': ['interface'],
		'output_type': 'interface',
	},
	{
		'label': 'Address type',
		'tags': [],
		'node': '',
		'parameters': {
			'IPv4': '',
			'IPv6': ''
		},
		'input_types': ['interface', 'subinterface'],
		'output_type': 'routable interface',
	},
	{
		'label': 'BGP unnumbered',
		'tags': [],
		'node': '',
		'parameters': {
			'timeout': ''
		},
		'input_types': ['interface', 'subinterface'],
		'output_type': 'interface',
	},
	{
		'label': 'Routing policy',
		'tags': [],
		'node': '',
		'parameters': {
			'import/export': ''
		},
		'input_types': ['routable interface'],
		'output_type': 'routing session',
	},
]