const {Kafka, logLevel} = require('kafkajs')

const kafka = new Kafka({
  logLevel: logLevel.INFO,
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
})

const topic = 'u2ptt72c-transactions'
const producer = kafka.producer()

const sendMessage = () => {
  return producer
    .send({
      topic,
      messages: [
        {
          key: 'transaction', value: `${-33.822028 + Math.random()*7},${19.419810 + Math.random()*10},${Math.random() <= 0.2 ? true:''},"R${Math.round(Math.random()*1000)}"`
        }
      ]
    })
    .then(console.log)
    .catch(e => console.error(`[example/producer] ${e.message}`, e))
}

const run = async () => {
  await producer.connect()
  setInterval(sendMessage, 1500)
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
