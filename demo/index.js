const { createContainer } = require('express-ve')

createContainer().then((container) => {
    const { app } = container
    app.listen(4040, () => {
        console.log('Listening at port 9000')
    })
})