const start = (db, rabbitMQ) => {
  rabbitMQ.receiveStatus((status) => {
    const id = status.split('-')[1];
    console.log(id);

    // Mise à jour du status dans la BDD
    db('dishes').where({ id }).update({ status: 'Done' })
      .then(() => {
        console.log(`Le status de l'objet a été mis à jour avec succès en 'Done' pour l'ID ${id}`);
      })
      .catch((err) => {
        console.error(`Erreur lors de la mise à jour du status : ${err}`);
      });
  });
};

module.exports = {
  start,
};
