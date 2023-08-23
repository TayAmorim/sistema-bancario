const express = require("express");
const {
  criarConta,
  depositar,
  transferir,
  extrato,
  excluirConta,
  listagemContas,
  atualizarUsuarioConta,
  sacar,
  saldo
} = require("./controladores/sistemaBancario");

const rotas = express();

rotas.post("/contas", criarConta);
rotas.delete("/contas/:numeroConta", excluirConta);
rotas.post("/transacoes/depositar", depositar);
rotas.post("/transacoes/transferir", transferir);
rotas.get("/contas/extrato", extrato);
rotas.get("/contas", listagemContas);
rotas.put("/contas/:numeroConta/usuario", atualizarUsuarioConta);
rotas.post("/transacoes/sacar", sacar);
rotas.get("/contas/saldo", saldo);

module.exports = rotas;
