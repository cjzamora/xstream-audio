// Main XStream Audio Service
(function(w) {
	/* Definition
	-----------------------------*/
	var c = function() {
		if(!(this instanceof c)) {
			return new c(arguments);
		}

		return this.__construct.apply(this, arguments);
	}, prototype = c.prototype;

	/* Public Properties
	-----------------------------*/
	// audio list
	prototype.queue     = {};
	// current audio playing
	prototype.current   = {};
	// total audio duration
	prototype.duration  = 0;
	// progress interval
	prototype.interval  = null;
	// timer interval
	prototype.intervalt = null;
	// if we are playing queue
	prototype.isque 	= false;
	// current queue index
	prototype.queindex  = 0;

	// timer variables
	prototype.m = 0, prototype.s = 0,
	prototype.t = '';

	/* Private Properties
	-----------------------------*/
	var graceful 	= require(process.cwd() + '/lib/node_modules/graceful-fs');
	var metadata 	= require(process.cwd() + '/lib/node_modules/audio-metadata');
	var handlebars  = require(process.cwd() + '/lib/node_modules/handlebars');

	/* Construct
	-----------------------------*/
	prototype.__construct = function() {
		return this;
	};

	/* Public Methods
	-----------------------------*/
	/**
	 * Loads up the audio file
	 * and auto plays it.
	 *
	 * @param 	object
	 * @return 	this
	 */
	prototype.load  = function(file) {
		// get audio wrapper
		var wrapper = $('div#defaultPlayer');
		var audio   = wrapper.find('audio').get(0);

		// get audio tag and
		// set it's source.
		wrapper.find('audio').attr('src', file.path);

		// set slight delay
		// before playing
		setTimeout(function() {
			// reset progress
			_stopProgress.call(this);

			// reset audio timer
			_stopAudioTimer.call(this);

			// play audio
			audio.play();

			// get audio duration
			this.duration = audio.duration;

			// start progress tick
			_startProgress.call(this, this.duration);

			// start audio timer
			_startAudioTimer.call(this, this.duration);
		}.bind(this), 500);

		// set current file playing
		this.current = file;

		return this;
	};

	/**
	 * Continue playing the last file
	 * played / loaded
	 *
	 * @return 	this
	 */
	prototype.play = function() {
		// get audio wrapper
		var wrapper = $('div#defaultPlayer');
		var audio   = wrapper.find('audio').get(0);

		// play / continue currently 
		// loaded audio
		audio.play();

		// start progress
		_startProgress.call(this, this.duration);

		// start timer
		_startAudioTimer.call(this, this.duration);

		// set controller action
		// to pause
		_setPauseIcon.call(this);

		return this;
	};

	/**
	 * Pause currently playing 
	 * audio file.
	 *
	 * @return this
	 */
	prototype.pause = function() {
		// get audio wrapper
		var wrapper = $('div#defaultPlayer');
		var audio   = wrapper.find('audio').get(0);

		// pause currently loaded
		// audio
		audio.pause();

		// clear current progress
		// interval
		clearInterval(this.interval);

		// clear current timer
		// interval
		clearInterval(this.intervalt);

		// set controller action to
		// play button
		_setPlayIcon.call(this);

		return this;
	};

	/**
	 * Proceed to next or prev
	 * index on queue list
	 *
	 * @param  int
	 * @return this
	 */
	prototype.prevnext = function(index) {
		if(this.isqueue) {
			// get file info
			var file = this.queue.tracks[index];

			// reset progress
			_stopProgress.call(this);

			// reset timer
			_stopAudioTimer.call(this);

			// load file
			this.load(file);

			// set queue index
			this.queindex = index;

			// read meta data
			this.readmeta(file);

			// reset track active
			$('table.track-table tbody tr').each(function(i, t) {
				$(t).removeClass('track-active');
			});

			// set active track
			$('table.track-table tbody tr.track-'+index).addClass('track-active');

			return this;
		}
	};

	/**
	 * Set audio pointer to specific
	 * time, seek backward / forward
	 *
	 * @return this
	 */
	prototype.seek = function(width) {
		// get progress width
		var progress = $('div#audioProgress');
		// get progress bar
		var bar 	 = progress.find('div#xBar');
		// get default audio player
		var audio    = $('div#defaultPlayer').find('audio').get(0);
		// seek time
		var seek     = width * this.duration
		// progress size
		var size     = width * progress.width();

		// set audio current time
		audio.currentTime = seek;

		// clear progress interval
		clearInterval(this.interval);

		// update bar
		bar.width(size);

		// clear timer interval
		clearInterval(this.intervalt);

		// set current minute based on
		// seek time
		this.m = Math.floor(seek / 60);
		this.s = Math.floor(seek % 60);

		// restart audio timer
		_startAudioTimer.call(this, this.duration);

		// restart progress tick
		_startProgress.call(this, this.duration);

		return this;
	};

	/**
	 * Reads up metadata of an audio
	 * file.
	 *
	 * @return 	this
	 */
	prototype.readmeta = function(file) {
		// read meta data
		var meta = _readMetaData(file.path);
		// audio info
		var info = $('div#audioInfo .x-info');

		// if there is no 
		// meta data
		if(!meta) {
			// set song title
			info.find('.title marquee').html(file.name || file.title);

			// set artist + album
			info.find('.artist-album').html('Unknown Artist - Unknown Album');

			// set pause icon
			_setPauseIcon.call(this);

			return this;
		}

		// set song title
		info.find('.title marquee').html(meta.title);

		// set artist + album
		info.find('.artist-album').html(meta.artist + ' - ' + meta.album);

		// set pause icon
		_setPauseIcon.call(this);

		return this;
	};

	/**
	 * Sets the volume up / down
	 *
	 * @return this
	 */
	prototype.volume = function() {

	};

	/**
	 * Loads up single track
	 * image / album art
	 *
	 * @return this
	 */
	prototype.loadTrackImage = function(file) {
		// read audio file
		var data = graceful.readFileSync(file.path);
		// read meta data from buffer
		var meta = metadata.id3v2(data);
		// track data
		var data = {};
		// single track template
		var template = graceful.readFileSync(process.cwd() + '/source/single.html', 'utf8');

		if(!meta) {
			// compile template
			var html = handlebars.compile(template)({});

			// set track template
			$('section#mainSection').html(html).hide().fadeIn(1000);

			return;
		}
	};

	/**
	 * Loads up audio listing from
	 * the given list of audio
	 *
	 * @param 	array
	 * @return  this
	 */
	prototype.loadAudioList = function(files) {
		var tracks = {};

		if(files.length !== 0) {
			tracks['tracks'] = [];

			for(var i in files) {
				var meta = _readMetaData(files[i].path);

				// if there is no 
				// meta data
				if(!meta) {
					tracks.tracks.push({ title : files[i].name, path : files[i].path, index : i });
					continue;
				}

				var m   = meta;
				m.path  = files[i].path;
				m.index = i;

				tracks.tracks.push(m);
			}

			// reset audio progress
			_stopProgress.call(this);

			// reset audio timer
			_stopAudioTimer.call(this);

			var template = graceful.readFileSync(process.cwd() + '/source/list.html', 'utf8');
			var html 	 = handlebars.compile(template)(tracks);

			// set queue list
			this.queue = tracks;

			// append template
			$('section#mainSection').html(html);

			// load first track
			this.load(tracks['tracks'][0]);

			// read meta
			this.readmeta(tracks['tracks'][0]);

			// highlight currently playing
			// audio in the list
			$('table.track-table tbody tr.track-0').addClass('track-active');

			// set isqueue to true
			this.isqueue = true;

			// set pause icon 
			_setPauseIcon.call(this);

			return this;
		}
	};

	/* Private Methods
	-----------------------------*/
	var _readMetaData = function(file) {
		// read raw data
		var data = graceful.readFileSync(file);
		// read meta data
		var meta = metadata.id3v2(data);

		if(!meta) {
			return null;
		}

		var audiometa = {
			title 	: meta.title  || 'Unknown Title',
			artist  : meta.artist || 'Unknown Artist',
			album   : meta.album  || 'Unknown Album',
			genre 	: meta.genre,
			track 	: meta.track,
			year 	: meta.year
		};

		return audiometa;
	};

	var _setPlayIcon = function() {
		// get audio controller
		var controller = $('div#audioController ul li.play');

		// hide pause icon
		controller.find('a.icon-pause').addClass('hide');
		// show play icon
		controller.find('a.icon-play').removeClass('hide');
	
		return this;
	};

	var _setPauseIcon = function() {
		// get audio controller
		var controller = $('div#audioController ul li.play');

		// show pause icon
		controller.find('a.icon-pause').removeClass('hide');
		// hide play icon
		controller.find('a.icon-play').addClass('hide');

		return this;
	};
	
	var _startProgress = function(duration) {
		// audio progress wrapper
		var progress = $('div#audioProgress');
		// audio progress bar
		var	xbar 	 = $('div#audioProgress div#xBar');
		// progress width
		var width 	 = progress.width();
		// current progress bar width
		var current  = xbar.width();
		// progress bar tick
		var tick     = width / duration;

		this.interval = setInterval(function() {
			// set current progress
			current = current + tick;

			// if xbar is greater than
			// total progress width
			if(current > width) {
				// stop progress
				_stopProgress.call(this);

				// set play icon
				_setPlayIcon.call(this);

				// if is queue
				if(this.isqueue) {
					this.queindex = (this.queindex + 1) % this.queue.tracks.length;

					this.prevnext(this.queindex);
				}

				return;
			}

			// update xbar width
			xbar.width(current);
		}.bind(this), 1000);	
	};

	var _startAudioTimer = function(duration) {
		// current audio time
		var current = $('div#audioProgressMeta div.current');
		// audio bit-rate, type
		var bitrate = $('div#audioProgressMeta div.bit-rate');
		// total audio length
		var total 	= $('div#audioProgressMeta div.total');
		// audio length in minutes
		var minutes = Math.floor(duration / 60);
		// total seconds
		var seconds = Math.floor(duration % 60);

		// start audio interval
		this.intervalt = setInterval(function() {
			// calculate seconds
			this.s = (this.s + 1) % 60;

			// if current counter is equals
			// on audio duration
			if(this.m == minutes && this.s == seconds + 1) {
				// stop audio timer
				_stopAudioTimer.call(this);

				return;
			}

			// if seconds is 60
			// increment minutes
			if(this.s == 0) {
				this.m++;
			}

			// format seconds
			this.t = (this.s < 10) ? '0' + this.s.toString() : this.s;

			// update current timer
			current.html(this.m + ':' + this.t);
		}.bind(this), 1000);

		// set total audio length
		total.html(minutes + ':' + seconds);

		return;
	};

	var _stopProgress = function() {
		var xbar = $('div#audioProgress div#xBar');

		// clear interval
		clearInterval(this.interval);

		// reset xbar width
		xbar.width(0);

		return;
	};

	var _stopAudioTimer = function() {
		// current audio time
		var current = $('div#audioProgressMeta div.current');
		// total audio length
		var total 	= $('div#audioProgressMeta div.total');

		// clear timer interval
		clearInterval(this.intervalt);

		// reset timer variables
		this.m = 0, this.s = 0,
		this.t = '';

		// reset timer
		current.html('0:00');

		return;
	};

	var _reset = function() {
		// reset timer variables
		this.m = 0, this.s = 0,
		this.t = '',

		// reset progress interval
		this.interval 	= null,
		// reset timer interval
		this.intervalt 	= null,
		// reset current audio
		this.current 	= {},
		// reset audio duration
		this.duration 	= 0;

		return this;
	};

	/* Adapter
	-----------------------------*/
	window.xaudioservice = c();
})(window);