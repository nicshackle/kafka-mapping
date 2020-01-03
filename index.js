const server = require('http').createServer();
const io = require('socket.io')(server);
const ip = require('ip');
const uuid = require('uuid')
const { Kafka } = require('kafkajs');

const host = process.env.HOST_IP || ip.address();

const kafka = new Kafka({
  clientId: 'transactions-map',
  brokers: [`${host}:9092`]
});

const topic = 'yoco-transactions';

io.on('connection', socket => {
  console.log("client connected");

  socket.on('disconnect', () => {
    console.log("client disconnected")
    stop().catch(e => console.error(`[stopping consumger] ${e.message}`, e));
  });

  // each client will get a new kafka consumer and consumer group ID
  const consumer = kafka.consumer({ groupId: `frontend-consumer-`+uuid.v1()});

  const stop = async () => {
    console.log("stopping consumer...")
    await consumer.stop()
    await consumer.disconnect()
  }

  const run = async () => {
    await consumer.connect()
    await consumer.subscribe({ topic, fromBeginning: false })
    await consumer.run({
      eachMessage: async ({ topic, partition, message }) => {
        const prefix = `${topic}/${partition}|${message.offset}/${message.timestamp}`
        console.log(`Consumer rxd: ${prefix} ${message.key}:${message.value}`)
        socket.emit('transaction',
          {
            lat: message.value.toString().split(',')[0],
            long: message.value.toString().split(',')[1],
            failed: message.value.toString().split(',')[2],
            info: message.value.toString().split(',')[3],
          }
        );
      },
    })
  };

  run().catch(e => console.error(`[example/consumer] ${e.message}`, e));

});


server.listen(3000);
