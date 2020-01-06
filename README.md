# kafka-transactions-mapping

### See it running [here](https://yoco-transactions-map.herokuapp.com/) (if I've turned the dynos on)
____________________________

### Running locally
The current configuration relies on a free-tier [managed Kafka broker](https://www.cloudkarafka.com/). However, if you would like to run the broker+stack locally, do the following:

1. In `producer.js` and `index.js`, change the Kafka instantiation to the following:
```
const host = process.env.HOST_IP || ip.address()
const kafka = new Kafka({
  logLevel: logLevel.INFO,
  brokers: [`${host}:9092`],
  clientId: 'transactions-map',
})
```

2. Start a local Kafka broker:

`export HOST_IP=$(ifconfig | grep -E "([0-9]{1,3}\.){3}[0-9]{1,3}" | grep -v 127.0.0.1 | awk '{ print $2 }' | cut -f2 -d: | head -n1)` followed by `docker-compose up`

3. Start the server and producer:

`npm install` to install dependencies for the server

`node index.js` and `node producer.js` to start server and produce kafka records

You'll need to drop in your own Mapbox access token to the mapbox URL for the map show, since the current one is restricted to the heroku domain. 


