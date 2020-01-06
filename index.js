const server = require('http').createServer();
const io = require('socket.io')(server);
const ip = require('ip');
const fs = require('fs')
const uuid = require('uuid')
const { Kafka } = require('kafkajs');

const kafka = new Kafka({
  clientId: 'transactions-map',
  brokers: [`moped-01.srvs.cloudkafka.com:9094`, `moped-02.srvs.cloudkafka.com:9094`, `moped-03.srvs.cloudkafka.com:9094`],
  ssl: true,
  authenticationTimeout: 1000,
  reauthenticationThreshold: 10000,
  sasl: {
    mechanism: 'scram-sha-512', // scram-sha-256 or scram-sha-512
    username: `${process.env.KAFKA_USERNAME}`,
    password: `${process.env.KAFKA_PASSWORD}`
  },
});

const topic = 'u2ptt72c-transactions';

io.on('connection', socket => {
  console.log("client connected");

  socket.on('disconnect', () => {
    console.log("client disconnected")
    stop().catch(e => console.error(`[stopping consumer] ${e.message}`, e));
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


server.listen(process.env.PORT || 3000);
