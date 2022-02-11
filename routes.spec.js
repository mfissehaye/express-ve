const chai = require('chai');
const expect = chai.expect
const chaiHttp = require('chai-http');
const createContainer = require('./container');

chai.use(chaiHttp);

const createServer = (container) => new Promise((resolve) => {
  const server = container.app.listen(9876, () => {
    resolve(server);
  });
});

describe('ioc routes', () => {
  let server;
  before(async () => {
    const container = await createContainer();
    server = await createServer(container);
  });

  it('loads routes in the routes directory', async () => {
    // const token = await getToken();
    // console.log(token);
    const response = await chai
      .request(server).get('/api/v1/')
      .send({});

    expect(response.body).to.have.property('message', 'Version 1 API');
    expect(response).to.have.status(200);

    const response2 = await chai
      .request(server)
      .post('/api/card-sets/23/duplicate')
      .send({});

    expect(response2).to.have.status(200);
  });
});
