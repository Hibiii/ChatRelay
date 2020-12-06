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
  let i = buffer[i];
  do {
    if (buffer[i] && buffer[i].time && buffer[i].time <= timestamp)
      unreadMessages.push(buffer[i])
    i++
  } while (i != buffer.i)
  return unreadMessages;
}
