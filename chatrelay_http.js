const mc = require('minecraft-protocol')
var client = mc.createClient({
	host: "localhost",   // optional
	port: 25565,         // optional
	username: "steve@minecraft.net",
	password: "i love diamonds"
})

client.on('chat', function (packet) {
	buffer.add(packet.message)
});


var buffer = []
buffer.i = 0
buffer.size = 32

buffer.add = function (message) {
	buffer.i %= buffer.size
	buffer[buffer.i] = { data: message, time: Date.now() }
	buffer.i++
}

buffer.getMessages = function (timestamp) {
	let unreadMessages = []
	let i = buffer.i;
	do {
		if (buffer[i] && buffer[i].time && buffer[i].time > timestamp)
			unreadMessages.push(buffer[i])
		i = (i + 1) % buffer.size 
	} while (i != buffer.i)
	return unreadMessages;
}


var http = require("http")
var url = require("url")

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
}).listen(25566)
