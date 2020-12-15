// --- Config ---
const config = require("./config.json")


// --- Minecraft side Bot ---
const mc = require('minecraft-protocol')
var client = null
var clientLoginAttempts = 0
var clientRadioCheck = null

// Stopping condition is either a working client or giving up
function createClient(force) {

	if (client) {
		if (!client.ended) {
			clientLoginAttempts = 0
			return
		} else if (force)
			client.end()
	}

	client = null

	// Don't waste resources if network is bad or I'm banned
	if (clientLoginAttempts >= config.mcSurrenderThreshold && !force) {
		console.log(Date.now().toLocaleString() + " I can't connect...")
		client = null
		clearInterval(clientRadioCheck)
		return
	}

	clientLoginAttempts++
	// client.connect() has been giving me WriteAfterEnd exceptions
	client = mc.createClient({
		host: config.mcHost,
		port: config.mcPort,
		username: config.mcUsername,
		password: config.mcPassword
	})
	// We always need to do this when making a new client
	client.on('chat', function (packet) {
		buffer.add(packet.message)
	})
}
createClient(false)
clientRadioCheck = setInterval(() => { createClient(false) }, config.mcLoginRetryInterval * 1000)


// --- Messages Buffer ---
const ChatMessage = require("prismarine-chat")(config.mcVersion)

var buffer = {
	b: [],                     // Circular buffer
	i: 0,                      // Requires an internal index
	size: config.bufferSize,   // Save it for modulus

	// It's okay if I override, because the messages will be too old
	add: function (message) {
		this.i %= buffer.size
		this.b[this.i] = { data: message, time: Date.now() }
		this.i++
	},

	// I will loop through the buffer entirely, oldest messages first
	// Buffer i should always be immediately next to the newest message
	getMessages: function (timestamp) {
		let unreadMessages = []
		let j = this.i;
		do {
			if (this.b[j] && this.b[j].time && this.b[j].time > timestamp)
				unreadMessages.push(this.b[j])
			j = (j + 1) % this.size
		} while (j != this.i)
		return unreadMessages
	},

	// Same thing but use raw strings
	getRawMessages: function (timestamp) {
		let unreadMessages = ""
		let rawMessage = null
		let latestTime = 0
		let j = this.i;
		do {
			if (this.b[j] && this.b[j].time && this.b[j].time > timestamp) {
				if (this.b[j].time > latestTime)
					latestTime = this.b[j].time
				rawMessage = new ChatMessage(JSON.parse(this.b[j].data))
				unreadMessages += rawMessage.toString() + "\r\n"
			}
			j = (j + 1) % this.size
		} while (j != this.i)
		let t = new Date(latestTime)
		return { data: unreadMessages, time: t.toUTCString() }
	},


	// Just in case
	reset: function () {
		this.b = []
		this.i = 0
	}
}


// --- HTTP facing API ---
const http = require("http")
const url = require("url")

// Glue together the buffer and the web
function respondGetMessages(request, response) {
	if (client == null)
		return response.writeHead(503).end()

	let timestamp = -1

	timestamp = Date.parse(request.headers['if-modified-since'])
	// Handle badly formed bodies.
	if (isNaN(timestamp)) {
		response.writeHead(400)
		response.end()
		return
	}
	// Send raw text if asked for
	if (request.headers["accept"] == "text/plain") {
		let unreadRawMessages = buffer.getRawMessages(timestamp)
		if (unreadRawMessages.data) {
			response.setHeader("Last-Modified", unreadRawMessages.time)
			response.writeHead(200)
			response.write(unreadRawMessages.data)
			response.end()
			return
		} else {
			response.writeHead(304) // Not Modified
			response.end()
			return
		}
	}
	// Status code is dependent on whether or not we have new messages.
	let unreadMessages = buffer.getMessages(timestamp)
	if (unreadMessages.length > 0) {
		response.writeHead(200)
		response.write(JSON.stringify(unreadMessages))
		response.end()
		return
	} else {
		response.writeHead(304) // Not Modified
		response.end()
		return
	}
}

// Get the current status of MC-side
function respondGetStatus(response) {
	if (client) {
		if (client.ended) {
			// "Yellow light"
			response.statusCode = 218
			response.statusMessage = "This is fine"
			response.end()
		} else {
			// "Green light"
			response.writeHead(200).end()
		}
	} else {
		// "Red light"
		response.writeHead(503).end()
	}
}

// Add an ability for the MC-side to restart on demand
function respondGetDefibrillators(response) {
	// Alive, don't touch
	if (client && !client.ended) {
		response.writeHead(403).end()
		return
	} else {
		buffer.reset()
		createClient(true)
		clientRadioCheck = setInterval(() => { createClient(false) }, config.mcLoginRetryInterval * 1000)
		// Wait a little before checking
		setTimeout(() => {
			if (client && !client.ended)
				response.writeHead(200).end()
			else
				response.writeHead(500).end()
		}, config.httpDefibWait * 1000)

	}
}

// Basic scaffolding for handling all types of requests
http.createServer(function (request, response) {
	let requestPath = url.parse(request.url).pathname
	if (request.method != "GET") {
		response.writeHead(405).end()
		return
	}
	switch (requestPath) {
		case "/messages": return respondGetMessages(request, response)
		case "/status": return respondGetStatus(response)
		case "/defibrillators": return respondGetDefibrillators(response)
		default: return response.writeHead(404).end()
	}
}).listen(config.httpPort)
