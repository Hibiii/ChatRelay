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
		if (timestamp < 0)
			return response.writeHead(400).end()
		let unreadMessages = buffer.getMessages(timestamp)
		if (unreadMessages) {
			return response.writeHead(200).write(unreadMessages).end()
		} else {
			return response.writeHead(304).end()
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
			response.writeHead(404).write("404: The endpoint \"" + requestPath + "\" does not exist.").end()
			return
	}
}).listen(25566)
