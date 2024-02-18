const { Client } = require('pg');
const express = require('express');
const app = express();

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

app.use(function (req, res, next) {
  res.removeHeader("x-powered-by");
  res.removeHeader("Server");
  res.removeHeader("Connection");

  next();
});

databaseSetup()

app.use(express.json())

app.get('/show_clientes', async (req, res) => {
  const queryResult = await client.query(`SELECT * FROM clientes`)
  res.send(JSON.stringify(queryResult.rows))
})

app.get('/show_transacoes', async (req, res) => {
  const queryResult = await client.query(`SELECT * FROM transacoes`)
  res.send(JSON.stringify(queryResult.rows))
})

app.get('/clientes/:id/extrato', async (req, res) => {
  if (req.params.id < 1 || req.params.id > 5) {
    res.writeHead(404)
    res.end()
    return
  }

  const queryResult = await client.query(`
    SELECT generate_json_output(${req.params.id});
  `)

  res.writeHead(200)
  res.write(JSON.stringify(queryResult.rows[0]['generate_json_output']))
  res.end()
})

app.post('/clientes/:id/transacoes', async (req, res) => {
  if (req.params.id < 1 || req.params.id > 5) {
    res.writeHead(404)
    res.end()
    return
  }

  const {
    valor,
    tipo,
    descricao,
  } = req.body

  if (!descricao || typeof descricao !== 'string' || descricao.length === 0 || descricao.length > 10) {
    res.writeHead(422)
    res.end()
    return
  }

  try {
    const queryResult = await client.query(`
      CALL InserirTransacao(${req.params.id}, ${valor}, '${tipo}'::transacao_tipo, '${descricao}');
    `)
  
    res.writeHead(200)
    res.write(JSON.stringify(queryResult.rows[0]))
    res.end()
  } catch (e) {
    res.writeHead(422)
    res.end()
  }
})

app.listen(8080, () => console.log('Server is up and running'));
