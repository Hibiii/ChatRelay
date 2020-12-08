// --- Config ---
const config = require("./config.json")


// --- Minecraft side Bot ---
const mc = require('minecraft-protocol')
var client = null
var clientLoginAttempts = 0

// This is a recursive function
// Stopping condition is either a working client or giving up
function createClient(force) {

	if (client) {
		if (!client.ended) {
			clientLoginAttempts = 0
			return
		}	else if (force)
			client.end()
	}

	client = null

	// Don't waste resources if network is bad or I'm banned
	if (clientLoginAttempts >= config.mcSurrenderThreshold && !force) {
		console.log(Date.now().toString() + " I can't connect...")
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
	// Wait a little before trying again
	// Don't force! or you'll be in an infinite loop
	setTimeout(() => { createClient(false) }, config.mcLoginRetryInterval * 100)
}
createClient(false)


// --- Messages Buffer ---
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

	// Just in case
	reset: function () {
		this.b = []
		this.i = 0
	}
}


// --- HTTP facing API ---
const http = require("http")
const url = require("url")

http.createServer(function (request, response) {
	let requestPath = url.parse(request.url).pathname
	if (request.method == "POST" && requestPath == "/messages") {
		let data = ""
		let timestamp = 0
		request.on("data", blob => { data += blob })
		request.on("end", () => {
			try { timestamp = JSON.parse(data).from }
			catch (e) { timestamp = -1 }
		})
		if (timestamp < 0) {
			response.writeHead(400)
			response.end()
			return
		}
		let unreadMessages = buffer.getMessages(timestamp)
		if (unreadMessages) {
			response.writeHead(200)
			response.write(unreadMessages.toString())
			response.end()
			return
		} else {
			response.writeHead(304)
			response.end()
			return
		}
		response.writeHead(501).end()
		return
	}
	if (request.method != "GET") {
		response.writeHead(405).end()
		return
	}
	switch (requestPath) {
		case "/status":
			response.writeHead(501).end()
			return
		case "/defibrillators":
			if (client && !client.ended) {
				response.writeHead(403).end()
				return
			} else {
				createClient(true)
				setTimeout(() => {
					if (client && !client.ended)
						response.writeHead(200).end();
					else
						response.writeHead(500).end();}, config.httpDefibWait * 1000)
				
			}
			return
		default:
			response.writeHead(404)
			response.write("404: The endpoint \"" + requestPath + "\" does not exist.")
			response.end()
			return
	}
}).listen(config.httpPort)
