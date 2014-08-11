// Main Xstream Lib
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
	// current file playing
	prototype.single 	= {};
	// list of queued files
	prototype.queue 	= [];
	// valid file extensions
	prototype.ext 		= ['ogg', 'wav', 'mp3'];
	// current track index
	prototype.index 	= 0;

	/* Private Properties
	-----------------------------*/
	var walker 		= require(process.cwd() + '/lib/node_modules/walker');
	var fs 			= require('fs');

	/* Construct
	-----------------------------*/
	prototype.__construct = function() {
		return this;
	};

	/* Public Methods
	-----------------------------*/
	/**
	 * Read the files from the given
	 * directory.
	 *
	 * @param 	string
	 * @return 	this
	 */
	prototype.readDirectory = function(directory) {
		// reset queue
		this.queue = [];

		// open file diagloe
		$('input#audioFolder').off('click').trigger('click');

		// on user select directory
		$('input#audioFolder')
		.off('change')
		.on('change', function(e) {
			var directory = e.currentTarget.files[0].path;

			// walk directory
			walker(directory)
			// on walker entry
			.on('entry', function(entry, stat) {
				// do nothing
			}.bind(this))
			// on walker directory
			.on('dir', function(dir, stat) {
				// do nothing
			}.bind(this))
			// on walker file
			.on('file', function(file, stat) {
				var type = file.substring(file.lastIndexOf('.') + 1);

				// if this is not a valid file
				if(this.ext.indexOf(type) === -1) {
					return;
				}

				var name = file.substring(file.lastIndexOf('/') + 1);

				this.queue.push({ name : name, path : file });
			}.bind(this))
			// on walker end
			.on('end', function() {
				xaudioservice.loadAudioList(this.queue);
			}.bind(this));
		}.bind(this));
	};

	/**
	 * Read a single file the user
	 * has selected.
	 *
	 * @return 	this
	 */
	prototype.readFile = function() {
		// open file dialog
		$('input#audioFile').off('click').trigger('click');

		// on user file select
		$('input#audioFile')
		.off('change')
		.on('change', function(e) {
			// get the file
			var file = e.currentTarget.files;

			// if there is no file
			// being selected
			if(!file.length) {
				return;
			}

			// store as current audio to play
			prototype.single = {
				name : file[0].name,
				size : file[0].size,
				type : file[0].type,
				path : file[0].path
			};

			// start playing the audio file
			xaudioservice.load(prototype.single);
			// read meta data
			xaudioservice.readmeta(prototype.single);
			// load track image
			xaudioservice.loadTrackImage(prototype.single);

			return;
		});
	};

	/**
	 * Plays / continues currently
	 * loaded audio file
	 *
	 * @return this
	 */
	prototype.playAudio = function() {
		// trigger audio service play
		xaudioservice.play();

		return this;
	};

	/**
	 * Pause currently loaded
	 * audio file
	 *
	 * @return this
	 */
	prototype.pauseAudio = function() {
		// trigger audio service pause
		xaudioservice.pause();

		return this;
	};

	/**
	 * Seek audio progress / time
	 *
	 * @return 	this
	 */
	prototype.seekAudio = function(e) {
		e = e || window.event;
		
		// client mouse x
		var seekTo  = e.clientX - 39;
		// total progress bar size
		var barSize = $('div#audioProgress').width(); 

		// trigger audio service seek
		xaudioservice.seek(seekTo / barSize);

		return this;
	};

	/**
	 * Select track in list
	 *
	 * @return this
	 */
	prototype.selectTrack = function(e) {
		var index = $(e.currentTarget).attr('data-index');

		xaudioservice.prevnext(index);

		return this;
	};

	/**
	 * Go to previous track
	 *
	 * @return this
	 */
	prototype.prev = function() {
		this.index = this.index - 1;

		if(this.index == -1) {
			this.index = this.queue.length - 1;
		}

		xaudioservice.prevnext(Math.abs(this.index));

		return this;
	};

	/**
	 * Go to next track
	 *
	 * @return this
	 */
	prototype.next = function() {
		this.index = (this.index + 1) % this.queue.length;

		xaudioservice.prevnext(this.index);

		return this;
	};

	/* Private Methods
	-----------------------------*/

	/* Adapter - (Expose Globally)
	-----------------------------*/

	w.xstream = c();
})(window);