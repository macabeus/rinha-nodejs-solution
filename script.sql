CREATE TYPE transacao_tipo AS ENUM ('c', 'd');

CREATE TABLE IF NOT EXISTS clientes (
  id SERIAL PRIMARY KEY,
  nome TEXT NOT NULL,
  t_limite INTEGER NOT NULL,
  t_saldo INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS transacoes (
  id SERIAL PRIMARY KEY,
  cliente_id integer REFERENCES clientes,
  valor INTEGER NOT NULL,
  tipo transacao_tipo NOT NULL,
  descricao TEXT NOT NULL,
  realizada_em TIMESTAMP NOT NULL
);

CREATE PROCEDURE InserirTransacao(
  _cliente_id integer,
  _valor integer,
  _tipo transacao_tipo,
  _descricao text,
  INOUT saldo integer DEFAULT NULL,
  INOUT limite integer DEFAULT NULL
)
LANGUAGE plpgsql
AS $$
DECLARE
    novo_saldo INTEGER;
BEGIN
  SELECT t_saldo, t_limite INTO saldo, limite FROM clientes WHERE id = _cliente_id FOR UPDATE;
  
  IF _tipo = 'd' THEN
    IF (saldo - _valor) < -limite THEN
      RAISE EXCEPTION 'Saldo insuficiente para realizar a transacao';
    END IF;

    novo_saldo := saldo - _valor;
    UPDATE clientes SET t_saldo = novo_saldo WHERE id = _cliente_id RETURNING t_saldo INTO saldo;
  ELSE
    novo_saldo := saldo + _valor;
    UPDATE clientes SET t_saldo = novo_saldo WHERE id = _cliente_id RETURNING t_saldo INTO saldo;
  END IF;

  INSERT INTO transacoes(cliente_id, valor, tipo, descricao, realizada_em)
  VALUES(_cliente_id, _valor, _tipo, _descricao, NOW());
END;
$$;

CREATE OR REPLACE FUNCTION generate_json_output(_id integer) RETURNS JSON AS $$
DECLARE
  saldo_record RECORD;
  ultimas_transacoes_json json[];
  ultimas_transacoes_record RECORD;
  saldo_total INTEGER := 0;
  saldo_limite INTEGER := 0;
BEGIN
  SELECT t_saldo, t_limite INTO saldo_total, saldo_limite FROM clientes WHERE id = _id;

  FOR ultimas_transacoes_record IN 
    SELECT * FROM transacoes WHERE cliente_id = _id ORDER BY realizada_em DESC LIMIT 10
  LOOP
    ultimas_transacoes_json := ultimas_transacoes_json || 
      ARRAY[json_build_object(
        'valor', ultimas_transacoes_record.valor,
        'tipo', ultimas_transacoes_record.tipo,
        'descricao', ultimas_transacoes_record.descricao,
        'realizada_em', ultimas_transacoes_record.realizada_em
      )];
  END LOOP;

  IF array_length(ultimas_transacoes_json, 1) IS NULL THEN
    ultimas_transacoes_json := array[]::varchar[];
  END IF;

  -- Construct the JSON object
  RETURN json_build_object(
    'saldo', json_build_object(
      'total', saldo_total,
      'data_extrato', NOW(),
      'limite', saldo_limite
    ),
    'ultimas_transacoes', ultimas_transacoes_json
  );
END;
$$ LANGUAGE plpgsql;

-- seeds

DO $$
BEGIN
  INSERT INTO clientes (nome, t_limite, t_saldo)
  VALUES
    ('o barato sai caro', 1000 * 100, 0),
    ('zan corp ltda', 800 * 100, 0),
    ('les cruders', 10000 * 100, 0),
    ('padaria joia de cocaia', 100000 * 100, 0),
    ('kid mais', 5000 * 100, 0);
END; $$
