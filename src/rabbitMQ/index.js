const amqp = require('amqplib/callback_api');
const knex = require('knex');

const db = knex({
  client: 'sqlite3',
  connection: {
    filename: './db/database.db'
  }
});

// création d'une promesse pour connecter à RabbitMQ
const connect = () => {
  return new Promise((resolve, reject) => {
    amqp.connect(process.env.RABBITMQ_URL, (err, connection) => {
      if (err) {
        reject(err);
      } else {
        resolve(connection);
      }
    });
  });
};

// création d'une promesse pour créer un canal RabbitMQ
const createChannel = (connection) => {
  return new Promise((resolve, reject) => {
    connection.createChannel((err, channel) => {
      if (err) {
        reject(err);
      } else {
        resolve(channel);
      }
    });
  });
};

// création d'une promesse pour envoyer un message à une file RabbitMQ
const sendToQueue = (channel, status) => {
  return new Promise((resolve, reject) => {
    channel.assertQueue('DishesQueue', { durable: false });
    channel.sendToQueue('DishesQueue', Buffer.from(status));
    console.log(`Sent ${status} to RabbitMQ`);
    resolve();
  });
};

const receiveFromQueue = (channel, callback) => {
  const queue = 'DishesQueue';
  channel.consume(queue, (message) => {
    if (message !== null) {
      callback(message.content.toString());
      channel.ack(message);
    }
  });
};

// fonction pour envoyer le statut à RabbitMQ
const sendStatus = async status => {
  try {
    // connexion à RabbitMQ
    const connection = await connect();
    // création d'un canal RabbitMQ
    const channel = await createChannel(connection);
    // envoi du statut à la file RabbitMQ
    await sendToQueue(channel, status);
    // fermeture de la connexion à RabbitMQ
    setTimeout(() => {
      connection.close();
    }, 500);
  } catch (err) {
    console.error(err);
  }
};

// fonction pour recevoir le statut de RabbitMQ
const receiveStatus = async callback => {
  try {
    // connexion à RabbitMQ
    const connection = await connect();
    // création d'un canal RabbitMQ
    const channel = await createChannel(connection);
    // réception du statut de la file RabbitMQ
    receiveFromQueue(channel, callback);
    // fermeture de la connexion à RabbitMQ
    setTimeout(() => {
      connection.close();
    }, 500);
  } catch (err) {
    console.error(err);
  }
};



module.exports = { sendStatus, receiveStatus };