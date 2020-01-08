const express = require('express')
const app = express()
const server = require('http').Server(app)
const io = require('socket.io')(server)
const uuid = require('uuid')
const {Kafka} = require('kafkajs')

app.use(express.static('public'))

const kafka = new Kafka({
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

const consumer = kafka.consumer({groupId: `transaction-consumer-server`})

const run = async () => {
  await consumer.connect()
  await consumer.subscribe({topic: 'transactions', fromBeginning: false})
  await consumer.run({
    autoCommitInterval: 100,
    eachMessage: async ({topic, partition, message}) => {
      const prefix = `${topic}/${partition}|${message.offset}/${message.timestamp}`
      console.log(`Consumer rxd: ${prefix} ${message.key}:${message.value}`)
      const data = JSON.parse(message.value.toString())
      io.sockets.emit('transaction', {
        ...data
      })
    },
  })
}

const stop = async () => {
  console.log("stopping consumer...")
  await consumer.stop()
  await consumer.disconnect()
}

const errorTypes = ['unhandledRejection', 'uncaughtException']
const signalTraps = ['SIGTERM', 'SIGINT', 'SIGUSR2']

errorTypes.map(type => {
  process.on(type, async () => {
    try {
      console.log(`process.on ${type}`)
      await stop()
      process.exit(0)
    } catch (_) {
      process.exit(1)
    }
  })
})

signalTraps.map(type => {
  process.once(type, async () => {
    try {
      await stop()
    } finally {
      process.kill(process.pid, type)
    }
  })
})

run().catch(e => console.error(`[example/consumer] ${e.message}`, e))
server.listen(process.env.PORT || 3000)
