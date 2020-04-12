const faunadb = require('faunadb'),
  q = faunadb.query;

var client = new faunadb.Client({
  secret: process.env.FAUNADB_SERVER_SECRET
});

client.query(
  q.CreateCollection({ name: 'kudos' }))
  .then((ret) => {
    console.log(ret);
    client.query(
      q.CreateIndex({
        name: 'kudos_by_post_title',
        source: q.Collection('kudos'),
        terms: [{ field: ['data', 'title'] }],
      }))
      .then((ret) => console.log(ret))
      .catch((ret) => console.log(ret));
  })
  .catch((ret) => console.log(ret));

