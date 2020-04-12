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
    let users = postData.data.users;
    if (!users.includes(user)) {
      users.push(user);
      const newData = {
        users: users
      }
      await client.query(
        q.Update(postData.ref, {
          data: newData
        }));
    }
  } else {
    const newData = {
      title: post,
      users: [user]
    };
    await client.query(
      q.Create(
        q.Collection('kudos'),
        { data: newData }
      )
    )
  }
  return {
    statusCode: 200,
    body: ""
  }
}