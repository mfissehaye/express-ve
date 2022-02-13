require('dotenv').config()
const { createContainer } = require('../../../node-packages/node-ioc/index')

createContainer().then((container) => {
    const { app } = container
    app.listen(4040, () => {
        console.log('Listening at port 4040')
    })
})
