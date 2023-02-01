const express = require('express');
const rabbitMQ = require('./rabbitMQ');
const bodyParser = require('body-parser');
const knex = require('knex');
const worker = require('./workers');

const app = express();
app.use(bodyParser.json());

const db = knex({
  client: 'sqlite3',
  connection: {
    filename: './db/database.db'
  }
});

app.post('/dish', (req, res) => {
  // Récupération des données envoyées dans la requête
  const dish = req.body;

  // Insertion du plat dans la table "dishes" et du status qui va avec dans le champs "status" et plat dans le champs "name"
  db('dishes').insert({ name: dish.name, status: 'pending' })
    .then((id) => {
      // Envoi d'une réponse de succès
      res.send({ status: 'success', id: id[0] });
      // Envoi du status "pending" à RabbitMQ
      rabbitMQ.sendStatus(`pending-${id[0]}`);

      worker.start(db, rabbitMQ);
    })
    .catch((err) => {
      // Envoi d'une réponse d'erreur
      res.send({ status: 'error', message: err });
    }); 
});

app.get('/dish/:id', (req, res) => {
  // Récupération de l'ID du plat à récupérer
  const id = req.params.id;

  // Récupération du plat dans la table "dishes" en fonction de l'ID et mise à jour du status
  db('dishes').where('id', id).select('name', 'status')
    .then((dish) => {
      // Envoi d'une réponse de succès
      res.send({ status: 'success', dish: dish[0] });
    })
    .catch((err) => {
      // Envoi d'une réponse d'erreur
      res.send({ status: 'error', message: err });
    });
});

app.listen(process.env.PORT || 3000, () => {
  console.log(`API démarrée sur le port ${process.env.PORT || 3000}`);
});
