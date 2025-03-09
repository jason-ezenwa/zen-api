module.exports = {
  async up(db, client) {const currencyExchangeMargin = {
      name: "Currency Exchange Margin",
      margin: 0.1
    }

    await db.collection('margins').insertOne(currencyExchangeMargin);
  },

  async down(db, client) {
    // TODO write the statements to rollback your migration (if possible)
    // Example:
    // await db.collection('albums').updateOne({artist: 'The Beatles'}, {$set: {blacklisted: false}});
  }
};
