module.exports = {
  async up(db, client) {
    await db.collection('usdvirtualcardfees').insertOne({
      name: "Card Creation Fee",
      currency: "USD",
      fee: 5
    });
  },

  async down(db, client) {
    // TODO write the statements to rollback your migration (if possible)
    // Example:
    // await db.collection('albums').updateOne({artist: 'The Beatles'}, {$set: {blacklisted: false}});
  }
};
