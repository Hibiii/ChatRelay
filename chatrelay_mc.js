const mc = require('minecraft-protocol')
var client = mc.createClient({
  host: "localhost",   // optional
  port: 25565,         // optional
  username: "steve@minecraft.net",
  password: "i love diamonds"
})

client.on('chat', function (packet) {
  var jsonMsg = JSON.parse(packet.message);
  if (jsonMsg.translate == 'chat.type.text') {
    buffer.add(jsonMsg.with[0].text,jsonMsg.with[1])
  }
});


var buffer = []
buffer.i = 0
buffer.size = 128

buffer.add = function (authorIn, messageIn) {
	buffer.i %= buffer.size
	buffer[i] = { author: authorIn, message: messageIn, time: Date.now() }
	buffer.i++
}
