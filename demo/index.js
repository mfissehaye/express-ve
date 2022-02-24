require('dotenv').config()
const {createContainer} = require('..')

createContainer().then((container) => {
    const {app, sockets} = container
    app.server.listen(4040, () => {
        console.log('Listening at port 4040')
    })
})

// const tweets = await db.collection('tweet').get()
// GET /api/v1/tweet

// const tweet = await db.doc('tweet/123').get()
// GET /api/v1/tweet/123

