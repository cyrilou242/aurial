import {h, render} from 'preact'
import Subsonic from './subsonic'
import App from './jsx/app'

/**
* Application bootstrap
*/
const subsonic = new Subsonic(
	localStorage.getItem('url') || 'https://music.catheu.tech/',
	localStorage.getItem('username') || '',
	localStorage.getItem('token') || '',
	localStorage.getItem('salt') || '',
	"1.13.0", "Aurial"
);

const container = document.createElement('app');
document.body.appendChild(container);
render(
	<App subsonic={subsonic}
		trackBuffer={localStorage.getItem('trackBuffer') || 0}
		persistQueue={localStorage.getItem('persistQueue') === 'true'}
	/>,
	container);
