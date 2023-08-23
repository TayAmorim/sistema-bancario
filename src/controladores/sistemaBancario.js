const { format } = require("date-fns");
const { depositos, saques, transferencias } = require("../bancodedados");
let { contas, banco } = require("../bancodedados");

const dataAtual = new Date();
const dataFormatada = format(dataAtual, "yyy-MM-dd pp");

const listagemContas = (req, res) => {
  const { senha_banco } = req.query;
  if (!senha_banco) {
    return res.status(400).json({ mensagem: "Senha precisa ser informada!" });
  }

  if (!(banco.senha === senha_banco)) {
    return res.status(401).json({
      mensagem: "Senha Inválida!",
    });
  }

  return res.status(200).json(contas);
};

const criarConta = (req, res) => {
  const { nome, cpf, data_nascimento, telefone, email, senha } = req.body;
  if (
    nome === "" ||
    data_nascimento === "" ||
    telefone === "" ||
    email === "" ||
    senha === "" ||
    cpf === ""
  ) {
    return res
      .status(400)
      .json({ mensagem: "Todos os campos são obrigatórios" });
  }
  let numeroConta = 0;

  if (!contas.length) {
    numeroConta++;
  } else {
    const existeNumeroDeConta = contas[contas.length - 1].numero;
    numeroConta = Number(existeNumeroDeConta) + 1;
  }
  const novaConta = {
    numero: String(numeroConta),
    saldo: 0,
    usuario: {
      nome: nome,
      cpf: cpf,
      data_nascimento: data_nascimento,
      telefone: telefone,
      email: email,
      senha: senha,
    },
  };
  if (!contas.length) {
    contas.push(novaConta);
    return res.status(201).json(novaConta);
  }

  const cpfDuplicado = contas.findIndex((conta) => conta.usuario.cpf === cpf);
  const emailDuplicado = contas.findIndex(
    (conta) => conta.usuario.email === email
  );
  if (cpfDuplicado !== -1) {
    return res
      .status(401)
      .json({ mensagem: "Já possui uma conta com este cpf" });
  }
  if (emailDuplicado !== -1) {
    return res
      .status(401)
      .json({ mensagem: "Já possui uma conta com este email" });
  }
  contas.push(novaConta);
  return res.status(201).json(novaConta);
};

const atualizarUsuarioConta = (req, res) => {
  const { nome, cpf, data_nascimento, telefone, email, senha } = req.body;
  const { numeroConta } = req.params;

  if (!(nome && cpf && data_nascimento && telefone && email && senha)) {
    return res.status(400).json({
      mensagem:
        "Deverá ser preenchido ao menos um campo para atualização de dados.",
    });
  }

  const contaBancaria = contas.find((conta) => conta.numero === numeroConta);

  if (!contaBancaria) {
    return res.status(404).json({ mensagem: "Conta não existe" });
  }
  if (cpf) {
    const novoCpf = contas.find((conta) => conta.cpf === cpf);

    if (novoCpf) {
      return res.status(404).json({ mensagem: "Cpf informado já cadastrado!" });
    }
  }

  if (email) {
    const novoEmail = contas.find((conta) => conta.email === email);

    if (novoEmail) {
      return res
        .status(404)
        .json({ mensagem: "E-mail informado já cadastrado!" });
    }
  }
  if (nome) {
    contaBancaria.usuario.nome = nome;
  }
  if (cpf) {
    contaBancaria.usuario.cpf = cpf;
  }
  if (data_nascimento) {
    contaBancaria.usuario.data_nascimento = data_nascimento;
  }
  if (telefone) {
    contaBancaria.usuario.telefone = telefone;
  }
  if (email) {
    contaBancaria.usuario.email = email;
  }
  if (senha) {
    contaBancaria.usuario.senha = senha;
  }

  return res.status(200).json({ mensagem: "Conta atualizada com sucesso!" });
};

const excluirConta = (req, res) => {
  const { numeroConta } = req.params;
  const contaExcluir = contas.find((conta) => conta.numero === numeroConta);

  if (!contaExcluir) {
    return res.status(401).json({
      mensagem: "Conta não existe",
    });
  }
  if (contaExcluir.saldo !== 0) {
    return res.status(401).json({
      mensagem:
        "Não é possivel excluir uma conta que não esteja com saldo zerado",
    });
  }

  contas = contas.filter((conta) => conta.numero !== contaExcluir.numero);
  res.json({ mensagem: "Conta excluída com sucesso!" });
};

const depositar = (req, res) => {
  const { numero_conta, valor } = req.body;
  const contaBancaria = contas.find((conta) => conta.numero === numero_conta);
  if (!numero_conta || !valor) {
    return res.status(400).json({
      mensagem: "Os campos: Número da conta e valor são obrigatórios",
    });
  }
  if (!contaBancaria) {
    return res.status(404).json({ mensagem: "Conta não existe" });
  }
  if (valor < 0 || valor === 0) {
    return res.status(400).json({
      mensagem:
        "Valor de deposito inválido, apenas valores positivos e maiores que 0",
    });
  }
  const transacaoDeposito = {
    data: `${dataFormatada}`,
    numero_conta,
    valor,
  };
  const saldoInicial = contaBancaria.saldo;
  contaBancaria.saldo = saldoInicial + valor;

  depositos.push(transacaoDeposito);

  return res.status(200).json({ mensagem: "Depósito realizado com sucesso!" });
};

const sacar = (req, res) => {
  const { numero_conta, valor, senha } = req.body;

  if (!numero_conta || !valor || !senha) {
    return res.status(400).json({
      mensagem: "Numero de conta e valor a sacar precisam ser informados!",
    });
  }

  const contaBancaria = contas.find((conta) => conta.numero === numero_conta);

  if (!contaBancaria) {
    return res.status(404).json({ mensagem: "Conta não existe" });
  }

  if (!(contaBancaria.usuario.senha === senha)) {
    return res.status(404).json({ mensagem: "Senha inválida" });
  }

  if (valor > contaBancaria.saldo) {
    return res.status(400).json({
      mensagem:
        "Valor de saque inválido, apenas valores menores que o saldo em conta.",
    });
  }
  const transacaoSaque = {
    data: `${dataFormatada}`,
    numero_conta,
    valor,
  };
  const saldoInicial = contaBancaria.saldo;
  contaBancaria.saldo = saldoInicial - valor;

  saques.push(transacaoSaque);

  return res.status(200).json({ mensagem: "Saque realizado com sucesso!" });
};

const transferir = (req, res) => {
  const { numero_conta_origem, numero_conta_destino, valor, senha } = req.body;
  if (!numero_conta_origem || !numero_conta_destino || !valor || !senha) {
    return res
      .status(400)
      .json({ mensagem: "Todos os campos são obrigatórios" });
  }

  const contaOrigem = contas.find(
    (conta) => conta.numero === numero_conta_origem
  );
  const contaDestino = contas.find(
    (conta) => conta.numero === numero_conta_destino
  );
  if (!contaOrigem || !contaDestino) {
    return res.status(401).json({
      mensagem: "Conta não existe",
    });
  }
  if (!(contaOrigem.usuario.senha === senha)) {
    return res.status(401).json({ mensagem: "Senha inválida" });
  }
  if (!(contaOrigem.saldo > 0 && contaOrigem.saldo >= Number(valor))) {
    return res.status(401).json({ mensagem: "Saldo insuficiente" });
  }

  const novaTransferencia = {
    data: `${dataFormatada}`,
    numero_conta_origem,
    numero_conta_destino,
    valor,
  };
  transferencias.push(novaTransferencia);

  const saldoInicialContaOrigem = contaOrigem.saldo;
  contaOrigem.saldo = saldoInicialContaOrigem - valor;

  const saldoInicialContaDestino = contaDestino.saldo;
  contaDestino.saldo = saldoInicialContaDestino + valor;

  res.json({ mensagem: "Transferência realizada com sucesso!" });
};

const saldo = (req, res) => {
  const { numero_conta, senha } = req.query;

  if (!numero_conta || !senha) {
    return res
      .status(400)
      .json({ mensagem: "Número da conta e senha precisam ser informados!" });
  }

  const contaBancaria = contas.find((conta) => conta.numero === numero_conta);

  if (!contaBancaria) {
    return res.status(404).json({ mensagem: "Conta não existe" });
  }

  if (!(contaBancaria.usuario.senha === senha)) {
    return res.status(401).json({
      mensagem: "Senha Inválida!",
    });
  }

  const saldoConta = { saldo: contaBancaria.saldo };
  return res.status(200).json(saldoConta);
};

const extrato = (req, res) => {
  const { numero_conta, senha } = req.query;
  if (!numero_conta || !senha) {
    return res
      .status(400)
      .json({ mensagem: "Numero de conta e senha precisam ser informados!" });
  }
  const contaExtrato = contas.find((conta) => conta.numero === numero_conta);

  if (!contaExtrato) {
    return res.status(401).json({
      mensagem: "Conta não existe!",
    });
  }
  if (!(contaExtrato.usuario.senha === senha)) {
    return res.status(401).json({
      mensagem: "Senha Inválida!",
    });
  }

  const contaExtratoDeposito = depositos.filter(
    (deposito) => deposito.numero_conta === numero_conta
  );
  const contaExtratoSaques = saques.filter(
    (saques) => saques.numero_conta === numero_conta
  );
  const contaextratoTransferenciasRecebidas = transferencias.filter(
    (transferencia) => transferencia.numero_conta_destino === numero_conta
  );
  const contaextratoTransferenciasEnviadas = transferencias.filter(
    (transferencia) => transferencia.numero_conta_origem === numero_conta
  );

  const extrato = {
    depositos: contaExtratoDeposito,
    saques: contaExtratoSaques,
    transferenciasEnviadas: contaextratoTransferenciasEnviadas,
    transferenciasRecebidas: contaextratoTransferenciasRecebidas,
  };
  res.json(extrato);
};

module.exports = {
  criarConta,
  depositar,
  transferir,
  extrato,
  excluirConta,
  listagemContas,
  atualizarUsuarioConta,
  sacar,
  saldo,
};
