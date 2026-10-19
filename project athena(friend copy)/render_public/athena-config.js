const isLocalPreview = ['localhost', '127.0.0.1'].includes(window.location.hostname)
	&& window.location.port !== '8001';

window.ATHENA_API_BASE_URL = isLocalPreview
	? `${window.location.protocol}//${window.location.hostname}:8001`
	: '';