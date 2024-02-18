const { Client } = require('pg');
const fastify = require('fastify')({})
// const jsonParser = require('fast-json-body');

const client = new Client({
  host: 'db',
  port: 5432,
  user: 'admin',
  password: '123',
  database: 'rinha',
})

const databaseSetup = async () => {
  await client.connect()
}

databaseSetup()

// fastify.addContentTypeParser('application/jsoff', function (request, payload, done) {
//   jsonParser(payload, function (err, body) {
//     done(err, body)
//   })
// })

fastify.get('/show_clientes', async (req, res) => {
  const queryResult = await client.query(`SELECT * FROM clientes`)
  res.send(JSON.stringify(queryResult.rows))
})

fastify.get('/show_transacoes', async (req, res) => {
  const queryResult = await client.query(`SELECT * FROM transacoes`)
  res.send(JSON.stringify(queryResult.rows))
})

fastify.get('/clientes/:id/extrato', async (req, res) => {
  if (req.params.id < 1 || req.params.id > 5) {
    res.status(404).send()
    return
  }

  const queryResult = await client.query(`
    SELECT generate_json_output(${req.params.id});
  `)

  res.send(JSON.stringify(queryResult.rows[0]['generate_json_output']))
})

fastify.post('/clientes/:id/transacoes', async (req, res) => {
  if (req.params.id < 1 || req.params.id > 5) {
    res.status(404).send()
    return
  }

  const {
    valor,
    tipo,
    descricao,
  } = req.body

  if (!descricao || typeof descricao !== 'string' || descricao.length === 0 || descricao.length > 10) {
    res.status(422).send()
    return
  }

  if (tipo !== 'd' && tipo !== 'c') {
    res.status(422).send()
    return
  }

  try {
    const queryResult = await client.query(`
      CALL InserirTransacao(${req.params.id}, ${valor}, '${tipo}'::transacao_tipo, '${descricao}');
    `)
  
    res.send(JSON.stringify(queryResult.rows[0]))
  } catch (e) {
    res.status(422).send()
  }
})

fastify.listen({ port: 8080, host: '0.0.0.0' }, (err) => {
  if (err) {
    throw err
  }

  console.log('Server is up and running')
});
