var ChatRelay = {
	updateInterval: 1,
	
	start: function(textFieldIn, iconIn, statusBarIn, updateIntervalIn) {
		this.textField = textFieldIn;
		this.icon = iconIn;
		this.statusBar = statusBarIn;
		this.changeTiming(updateIntervalIn);
	},
	
	changeTiming: function (updateIntervalIn) {
		if(this.timelyUpdate != null)
			window.clearTimeout(this.timelyUpdate);
		this.updateInterval = updateIntervalIn * 1000;
		this.timelyUpdate = window.setInterval(this.getMessages, this.updateInterval);
	},
	
	getMessages: function() {
		let xhr = new XMLHttpRequest();
		xhr.open("GET", "http://localhost:25566/messages", true);
		xhr.setRequestHeader('If-Modified-Since', ChatRelay.latestMessage);
		xhr.setRequestHeader('Accept', 'text/plain');
		xhr.responseType = 'text';
		xhr.onreadystatechange = function() {
			if(xhr.readyState != 4)
				return;
			switch(xhr.status) {
				case 200:
					let messages = xhr.response.replace("\r\n","\n").split("\n");
					for (i in messages)
						ChatRelay.buffer[ChatRelay.buffer.length] = messages[i];
					while (ChatRelay.buffer.length > ChatRelay.bufferSize)
						ChatRelay.buffer.shift();
					ChatRelay.textField.innerText = ChatRelay.buffer.join("\n");
					let d = new Date(xhr.getResponseHeader('Last-Modified')).valueOf;
					ChatRelay.latestMessage = d + 1;
					break;
				default: return;
			}
		}
		xhr.send()
	},
	
	timelyUpdate: null,
	textField: null,
	icon: null,
	statusBar: null,
	latestMessage: 0,
	failedCalls: 0,
	buffer: [],
	bufferSize: 40
}