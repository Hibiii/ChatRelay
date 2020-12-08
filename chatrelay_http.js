// --- Config ---
const config = require("./config.json")

// --- Minecraft side Bot ---
const mc = require('minecraft-protocol')
var client = null
var clientLoginAttempts = 0
function createClient(force) {
	if (client) {
		if (!client.ended) {
			clientLoginAttempts = 0
			return
		}	else if (force)
			client.end()
	}
	client = null
	if (clientLoginAttempts >= config.mcSurrenderThreshold && !force) {
		console.log(Date.now().toString() + " I can't connect...")
		return
	}
	clientLoginAttempts++
	console.log("attempt no. " + clientLoginAttempts)
	client = mc.createClient({
		host: config.mcHost,
		port: config.mcPort,
		username: config.mcUsername,
		password: config.mcPassword
	})
	client.on('chat', function (packet) {
		buffer.add(packet.message)
	})
	setTimeout(() => { createClient(false) }, config.mcLoginRetryInterval * 100)
}
createClient(false)

// --- Messages Buffer ---
var buffer = {
	b: [],
	i: 0,
	size: config.bufferSize,

	add: function (message) {
		this.i %= buffer.size
		this.b[this.i] = { data: message, time: Date.now() }
		this.i++
	},

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

	reset: function () {
		this.b = []
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
			response.write(unreadMessages)
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
			response.writeHead(501).end()
			return
		default:
			response.writeHead(404)
			response.write("404: The endpoint \"" + requestPath + "\" does not exist.")
			response.end()
			return
	}
}).listen(config.httpPort)
