var PlaylistManager = React.createClass({
	getInitialState: function() {
		return {playlists: [], playlist: []};
	},

	componentDidMount: function() {
		this.loadPlaylists();
	},

	loadPlaylists: function() {
		this.props.subsonic.getPlaylists({
			success: function(data) {
				this.setState({playlists: data.playlists});
			}.bind(this),
			error: function(status, err) {
				console.error(this, status, err.toString());
			}.bind(this)
		});
	},

	loadPlaylist: function(id) {
		this.props.subsonic.getPlaylist({
			id: id,
			success: function(data) {
				this.setState({playlist: data.playlist});
			}.bind(this),
			error: function(status, err) {
				console.error(this, status, err.toString());
			}.bind(this)
		});
	},

	render: function() {
		//var hash = 1;
		//this.state.playlists.map(function (playlist) {
		//	hash += 31 * playlist.id;
		//});

		return (
			<div className="playlistManager">
				<PlaylistSelector subsonic={this.props.subsonic} playlists={this.state.playlists} iconSize={this.props.iconSize} selected={this.loadPlaylist} />
				<Playlist subsonic={this.props.subsonic} events={this.props.events} iconSize={this.props.iconSize} playlist={this.state.playlist} />
			</div>
		);
	}
});


var PlaylistSelector = React.createClass({
	componentDidMount: function() {
		var _this = this;
		$('.playlistSelector .dropdown').dropdown({
			action: 'activate',
			onChange: function(value, text, $selectedItem) {
				_this.props.selected(value);
			}
		});
	},

	render: function() {
		var _this = this;
		var playlists = this.props.playlists.map(function (playlist) {
			return (
				<PlaylistSelectorItem key={playlist.id} subsonic={_this.props.subsonic} data={playlist} iconSize={_this.props.iconSize} />
			);
		});

		return (
			<div className="ui basic segment playlistSelector">
				<div className="ui fluid selection dropdown">
					<i className="dropdown icon"></i>
					<div className="default text">Playlists...</div>
					<div className="menu">
						{playlists}
					</div>
				</div>
			</div>
		);
	}
});

var PlaylistSelectorItem = React.createClass({
	render: function() {
		return (
			<div className="item" data-value={this.props.data.id}>
				<CoverArt subsonic={this.props.subsonic} id={this.props.data.coverArt} size={this.props.iconSize} />
				<span className="description">{this.props.data.songCount} tracks, {this.props.data.duration.asTime()}</span>
				<span className="text">{this.props.data.name}</span>
			</div>
		);
	}
})

var Playlist = React.createClass({
	render: function() {
		if (this.props.playlist.length == 0) {
			return (
				<div className="playlistView">
					<IconMessage icon="info circle" header="Nothing Selected!" message="Select a playlist." />
				</div>
			);

		} else {
			return (
				<div className="ui basic segment playlistView">
					<TrackList subsonic={this.props.subsonic} subsonic={this.props.subsonic} tracks={this.props.playlist} events={this.props.events} iconSize={this.props.iconSize} />
				</div>
			);
		}
	}
});

var Selection = React.createClass({
	getInitialState: function() {
		return {album: null};
	},

	componentDidMount: function() {
		this.props.events.subscribe({
			subscriber: this,
			event: ["browserSelected"]
		});
	},

	receive: function(event) {
		switch (event.event) {
			case "browserSelected": this.setState({album: event.data}); break;
		}
	},

	render: function() {
		if (this.state.album == null) {
			return (
				<IconMessage icon="info circle" header="Nothing Selected!" message="Select an album from the browser." />
			);

		} else {
			return (
				<div className="ui basic segment selectionView">
					<TrackList subsonic={this.props.subsonic} events={this.props.events} tracks={this.state.album.song} iconSize={this.props.iconSize} />
				</div>
			);
		}
	}
});

var PlaylistQueue = React.createClass({
	getInitialState: function() {
		return {queue: null};
	},

	componentDidMount: function() {
		this.props.events.subscribe({
			subscriber: this,
			event: ["playerEnqueued"]
		});
	},

	receive: function(event) {
		switch (event.event) {
			case "playerEnqueued": this.setState({queue: event.data}); break;
		}
	},

	render: function() {
		if (this.state.queue == null) {
			return (
				<IconMessage icon="info circle" header="Nothing in the queue!" message="Add some tracks to the queue by browsing, or selecting a playlist." />
			);

		} else {
			return (
				<div className="ui basic segment queueView">
					<TrackList subsonic={this.props.subsonic} events={this.props.events} tracks={this.state.queue} iconSize={this.props.iconSize} />
				</div>
			);
		}
	}

});

var TrackList = React.createClass({
	getInitialState: function() {
		return {queue: [], playing: null};
	},

	componentDidMount: function() {
		this.props.events.subscribe({
			subscriber: this,
			event: ["playerStarted", "playerStopped", "playerEnqueued"]
		});
	},

	receive: function(event) {
		switch (event.event) {
			case "playerStarted": this.setState({playing: event.data}); break;
			case "playerStopped": this.setState({playing: null}); break;
			case "playerEnqueued": this.setState({queue: event.data.map(function(q) {return q.id} )}); break;
		}
	},

	render: function() {
		var _this = this;
		var tracks = this.props.tracks.map(function (entry) {
			return (
				<Track key={entry.id} subsonic={_this.props.subsonic} events={_this.props.events} track={entry} iconSize={_this.props.iconSize} 
				 playing={_this.state.playing != null && _this.state.playing.id == entry.id} 
				 queued={_this.state.queue.indexOf(entry.id) > -1} />
			);
		});

		return (
			<table className="ui selectable single line very basic compact table trackList">
				<thead>
					<tr>
						<th className="controls">&nbsp;</th>
						<th className="number">#</th>
						<th className="artist">Artist</th>
						<th className="title">Title</th>
						<th className="album">Album</th>
						<th className="date">Date</th>
						<th className="right aligned duration">Duration</th>
					</tr>
				</thead>
				<tbody>
					{tracks}
				</tbody>
			</table>
		);
	}
});

var Track = React.createClass({
	play: function() {
		this.props.events.publish({event: "playerPlay", data: this.props.track});
	},

	enqueue: function() {
		this.props.events.publish({event: "playerEnqueue", data: [this.props.track]});
	},

	render: function() {
		return (
			<tr className={this.props.playing ? "positive" : ""}>
				<td>
					<i className={this.props.playing ? "play icon" : "grey play icon"} onClick={this.play}></i>
					<i className={this.props.queued ? "minus icon" : "grey plus icon"} onClick={this.enqueue}></i>
				</td>
				<td>
					{this.props.track.track}
				</td>
				<td>
					{this.props.track.artist}
				</td>
				<td>
					{this.props.track.title}
				</td>
				<td>
					{/* <CoverArt subsonic={this.props.subsonic} id={this.props.track.coverArt} size={this.props.iconSize} /> */}
					{this.props.track.album}
				</td>
				<td>
					{this.props.track.year}
				</td>
				<td className="right aligned">
					{this.props.track.duration ? this.props.track.duration.asTime() : '?:??'}
				</td>
			</tr>
		);
	}
});
