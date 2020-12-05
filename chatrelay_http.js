var http = require("http")

http.createServer(function (request, response) {
	response.writeHead(501)
	response.write("501 Not Implemented :(")
	response.end()
}).listen(25566)
