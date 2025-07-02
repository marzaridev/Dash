import { initializeApp } from "https://www.gstatic.com/firebasejs/9.14.0/firebase-app.js";
import { getDatabase, ref, set, get, onValue, push, update, remove, child } from "https://www.gstatic.com/firebasejs/9.14.0/firebase-database.js";

const firebaseConfig = {
  apiKey: "AIzaSyCX4Cmnu0G9wUPT2QboqZVff6Hn7Ro47aI",
  authDomain: "tentativa-app.firebaseapp.com",
  databaseURL: "https://tentativa-app-default-rtdb.europe-west1.firebasedatabase.app/",
  projectId: "tentativa-app",
  storageBucket: "tentativa-app.firebasestorage.app",
  messagingSenderId: "667491720305",
  appId: "1:667491720305:web:ec21fdb14edc5dc46fcfd0"
};

const app = initializeApp(firebaseConfig);
const db = getDatabase(app);

// ...restante do seu código...


// Utilidades
function dataHoje() {
  const hoje = new Date();
  return hoje.toISOString().split('T')[0]; // "2025-07-02"
}

// Estado global (apenas para cache local)
let funcionarios = [];
let pausasAtivas = [];
let timers = {};
let configuracoes = {
  nomeEmpresa: "Font Office",
  textoRodape: "© 2025 Font Office"
};

// Chart instances
let coberturaChart = null;
let coberturaRelatorioChart = null;
let distribuicaoChart = null;

// Sincronização em tempo real dos funcionários
function syncFuncionarios() {
  const funcionariosRef = ref(db, `funcionarios/${dataHoje()}`);
  onValue(funcionariosRef, (snapshot) => {
    const data = snapshot.val();
    funcionarios = data ? Object.values(data) : [];
    renderAll();
  });
}

// Sincronização das configurações
function syncConfiguracoes() {
  const configRef = ref(db, `configuracoes`);
  onValue(configRef, (snapshot) => {
    const data = snapshot.val();
    if (data) {
      configuracoes = data;
      initializeConfiguracoes();
      updateRodape();
    }
  });
}

// Salvar funcionário
function salvarFuncionarios() {
  const funcionariosRef = ref(db, `funcionarios/${dataHoje()}`);
  // Salva como objeto com chave única (nome)
  const obj = {};
  funcionarios.forEach(f => {
    obj[f.nome] = f;
  });
  set(funcionariosRef, obj);
}

// Salvar configurações
function salvarConfiguracoes() {
  const configRef = ref(db, `configuracoes`);
  set(configRef, configuracoes);
}

// Histórico de pausas (opcional, pode ser expandido)
function registrarPausa(funcionarioNome, tipo, inicio, fim) {
  const histRef = ref(db, `historico/${dataHoje()}/${funcionarioNome}/${tipo}`);
  push(histRef, {
    inicio,
    fim
  });
}

// Inicialização da aplicação
document.addEventListener('DOMContentLoaded', function() {
  syncFuncionarios();
  syncConfiguracoes();
  initializeTabs();
  initializeTimeSelect();
  initializeHorarioSelects();
  initializeModals();
  setInterval(updateLastUpdateTime, 1000);
  setInterval(updateTimers, 1000);
  setInterval(checkPausaExpiration, 60000);

  // Eventos de adicionar/remover funcionário
  document.getElementById('adicionar-funcionario')?.addEventListener('click', function() {
    const nome = document.getElementById('novo-nome').value.trim();
    const entrada = document.getElementById('horario-entrada').value;
    const saida = document.getElementById('horario-saida').value;
    if (nome && entrada && saida) {
      const turno = `${entrada.split(':')[0]}h-${saida.split(':')[0]}h`;
      const novoFuncionario = {
        nome: nome,
        turno: turno,
        presente: true,
        pausas: {
          manha: { realizada: false, horario: "11:30" },
          almoco: { realizada: false, horario: "12:00" },
          tarde: { realizada: false, horario: "16:00" }
        }
      };
      funcionarios.push(novoFuncionario);
      salvarFuncionarios();
      document.getElementById('novo-nome').value = '';
    }
  });

  document.getElementById('remover-funcionario')?.addEventListener('click', function() {
    openRemoveEmployee();
  });
});

// Funções de interface (iguais ao seu código, mas adaptadas para usar o array global atualizado pelo Firebase)
function renderAll() {
  renderFuncionariosList();
  renderPresencaList();
  renderEscalaTable();
  renderCronogramaPausas();
  renderFuncionariosCadastrados();
  updateDashboard();
  renderRelatorios();
}

// ... (Aqui você pode colar todas as funções de renderização e utilitários do seu app.js original, sem mudanças na lógica de interface. Apenas substitua qualquer alteração de dados para chamar salvarFuncionarios() após modificar o array "funcionarios".)

// Exemplo: Quando marcar/desmarcar pausa:
function marcarPausa(funcionario, tipo, realizada) {
  funcionario.pausas[tipo].realizada = realizada;
  salvarFuncionarios();
}

// Exemplo: Quando alterar presença:
function alterarPresenca(funcionario, presente) {
  funcionario.presente = presente;
  salvarFuncionarios();
}

// Exemplo: Quando editar horário:
function editarHorario(funcionario, tipo, novoHorario) {
  funcionario.pausas[tipo].horario = novoHorario;
  salvarFuncionarios();
}

// Exemplo: Quando remover funcionário:
function removerFuncionario(nome) {
  funcionarios = funcionarios.filter(f => f.nome !== nome);
  salvarFuncionarios();
}

// Para configurações:
function alterarConfiguracoes(nomeEmpresa, textoRodape) {
  configuracoes.nomeEmpresa = nomeEmpresa;
  configuracoes.textoRodape = textoRodape;
  salvarConfiguracoes();
}

// O restante das funções de interface (renderização, gráficos, etc.) pode ser mantido igual ao seu código original.

