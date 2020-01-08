const {Kafka, CompressionTypes, logLevel} = require('kafkajs')

const kafka = new Kafka({
  logLevel: logLevel.INFO,
  clientId: 'transactions-map',
  brokers: [`pkc-4nym6.us-east-1.aws.confluent.cloud:9092`],
  ssl: true,
  authenticationTimeout: 1000,
  reauthenticationThreshold: 10000,
  sasl: {
    mechanism: 'PLAIN',
    username: `${process.env.KAFKA_USERNAME}`,
    password: `${process.env.KAFKA_PASSWORD}`
  },
})

const topic = 'transactions'
const producer = kafka.producer()

const sendMessage = () => {
  const data = {
      lat: -33.822028 + Math.random() * 7,
      long: 19.419810 + Math.random() * 10,
      failed: Math.random() <= 0.2,
      info: Math.round(Math.random() * 1000),
    }


  return producer
    .send({
      topic,
      compression: CompressionTypes.GZIP,
      messages: [
        {
          key: 'transaction',
          value: JSON.stringify(data)
        }
      ]
    })
    .then(console.log)
    .catch(e => console.error(`[example/producer] ${e.message}`, e))
}

const run = async () => {
  await producer.connect()
  setInterval(sendMessage, process.env.MESSAGE_INTERVAL || 3000)
}

run().catch(e => console.error(`[example/producer] ${e.message}`, e))

const errorTypes = ['unhandledRejection', 'uncaughtException']
const signalTraps = ['SIGTERM', 'SIGINT', 'SIGUSR2']

errorTypes.map(type => {
  process.on(type, async () => {
    try {
      console.log(`process.on ${type}`)
      await producer.disconnect()
      process.exit(0)
    } catch (_) {
      process.exit(1)
    }
  })
})

signalTraps.map(type => {
  process.once(type, async () => {
    try {
      await producer.disconnect()
    } finally {
      process.kill(process.pid, type)
    }
  })
})
