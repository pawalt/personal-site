const faunadb = require('faunadb'),
  q = faunadb.query;

var client = new faunadb.Client({
  secret: process.env.FAUNADB_SERVER_SECRET
});

exports.handler = async event => {
  const post = event.queryStringParameters.post;
  const user = event.queryStringParameters.user;
  const postQuery = q.Match(q.Index('kudos_by_post_title'), post);
  const existCheck = await client.query(q.Exists(postQuery));
  if (existCheck) {
    const postData = await client.query(q.Get(postQuery));
    const users = postData.data.users;
    return {
      statusCode: 200,
      body: JSON.stringify({
        numClicked: users.length,
        userClicked: users.includes(user)
      })
    }
  } else {
    return {
      statusCode: 200,
      body: JSON.stringify({
        numClicked: 0,
        userClicked: false
      })
    }
  }
}
