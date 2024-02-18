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
  const queryResult = await client.query(`SELECT nome, limite FROM clientes WHERE id = ${req.params.id}`)
  res.send(`Result: ${queryResult.rows[0].limite}`)
})

app.post('/clientes/:id/transacoes', async (req, res) => {
  // INSERT INTO lists VALUES ((SELECT max(id)+1 FROM lists),'KO','SPH', '5');

  const {
    valor,
    tipo,
    descricao,
  } = req.body

  const queryResult = await client.query(`
    CALL InserirTransacao(${req.params.id}, ${valor}, '${tipo}'::transacao_tipo, '${descricao}');
  `)

  res.send(JSON.stringify(queryResult.rows))

  // res.send(`{ "limite": ${queryResult.rows[0].limite}, "saldo": ${queryResult.rows[0].saldo} }`)
})

// POST /clientes/[id]/transacoes

// {
//     "valor": 1000,
//     "tipo" : "c",
//     "descricao" : "descricao"
// }

app.listen(8080, () => console.log('Server is up and running'));
