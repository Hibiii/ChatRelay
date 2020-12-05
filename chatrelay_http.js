var http = require("http")
var url = require("url")

http.createServer(function (request, response) {
	var requestPath = url.parse(request.url).pathname
	if (request.method == "POST" && requestPath == "/messages") {
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
