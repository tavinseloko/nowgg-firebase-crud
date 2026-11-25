// Importação do Firebase SDK Modular (v10) via CDN
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import {
  getFirestore,
  collection,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  onSnapshot,
  query,
  orderBy,
  serverTimestamp
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

// Configuração do seu projeto Firebase
const firebaseConfig = {
  apiKey: "AIzaSyCjJR49ISeFI85dn-5G3oFH_jewGG8BcBU",
  authDomain: "ottavio-477b4.firebaseapp.com",
  projectId: "ottavio-477b4",
  storageBucket: "ottavio-477b4.firebasestorage.app",
  messagingSenderId: "394479677045",
  appId: "1:394479677045:web:f61bb0eb52346897a8923c",
  measurementId: "G-PTVQ40KJ3R"
};

// Inicialização do Firebase e Firestore
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const jogosRef = collection(db, "jogos");

// Elementos do DOM
const gameForm = document.getElementById("gameForm");
const gameIdInput = document.getElementById("gameId");
const tituloInput = document.getElementById("titulo");
const desenvolvedoraInput = document.getElementById("desenvolvedora");
const generoInput = document.getElementById("genero");
const classificacaoInput = document.getElementById("classificacao");
const avaliacaoInput = document.getElementById("avaliacao");
const tempoSessaoInput = document.getElementById("tempo_sessao");

const formTitle = document.getElementById("formTitle");
const submitBtn = document.getElementById("submitBtn");
const cancelEditBtn = document.getElementById("cancelEditBtn");

const searchInput = document.getElementById("searchInput");
const gamesList = document.getElementById("gamesList");
const gamesCount = document.getElementById("gamesCount");
const loadingState = document.getElementById("loadingState");
const emptyState = document.getElementById("emptyState");
const feedbackBox = document.getElementById("feedback");
const connectionStatus = document.getElementById("connectionStatus");

// Estado local para filtragem instantânea
let allGames = [];

// Exibe mensagem temporária de sucesso ou erro
function showFeedback(message, type = "success") {
  feedbackBox.textContent = message;
  feedbackBox.className = `feedback ${type}`;
  clearTimeout(feedbackBox._timer);
  feedbackBox._timer = setTimeout(() => {
    feedbackBox.classList.add("hidden");
  }, 3500);
}

// Limpa o formulário e volta para o modo de cadastro
function resetForm() {
  gameForm.reset();
  gameIdInput.value = "";
  formTitle.textContent = "Cadastrar Novo Jogo";
  submitBtn.textContent = "Cadastrar Jogo";
  cancelEditBtn.classList.add("hidden");
}

// 1. CREATE e 3. UPDATE — Salvar ou atualizar jogo
gameForm.addEventListener("submit", async (event) => {
  event.preventDefault();

  const dadosJogo = {
    titulo: tituloInput.value.trim(),
    desenvolvedora: desenvolvedoraInput.value.trim(),
    genero: generoInput.value,
    classificacao: classificacaoInput.value,
    avaliacao: Number(avaliacaoInput.value),
    tempo_sessao: Number(tempoSessaoInput.value)
  };

  if (!dadosJogo.titulo || !dadosJogo.desenvolvedora) {
    showFeedback("Preencha todos os campos obrigatórios.", "error");
    return;
  }

  submitBtn.disabled = true;

  try {
    const idAtual = gameIdInput.value;

    if (idAtual) {
      // Atualizar documento existente
      const docRef = doc(db, "jogos", idAtual);
      await updateDoc(docRef, dadosJogo);
      showFeedback(`"${dadosJogo.titulo}" atualizado com sucesso!`);
    } else {
      // Criar novo documento
      await addDoc(jogosRef, {
        ...dadosJogo,
        criadoEm: serverTimestamp()
      });
      showFeedback(`"${dadosJogo.titulo}" cadastrado com sucesso!`);
    }

    resetForm();
  } catch (error) {
    console.error("Erro ao salvar jogo:", error);
    showFeedback("Erro ao salvar no Firebase. Verifique o console.", "error");
  } finally {
    submitBtn.disabled = false;
  }
});

cancelEditBtn.addEventListener("click", resetForm);

// 2. READ — Escuta em tempo real na coleção "jogos"
const q = query(jogosRef, orderBy("titulo", "asc"));

onSnapshot(
  q,
  (snapshot) => {
    loadingState.classList.add("hidden");
    connectionStatus.textContent = "Firestore Online";
    connectionStatus.classList.add("online");

    allGames = snapshot.docs.map((documento) => ({
      id: documento.id,
      ...documento.data()
    }));

    renderGames();
  },
  (error) => {
    console.error("Erro ao ler dados:", error);
    loadingState.classList.add("hidden");
    connectionStatus.textContent = "Erro de conexão";
    showFeedback("Não foi possível carregar os jogos do Firestore.", "error");
  }
);

// Renderiza os cards aplicando o filtro de busca
function renderGames() {
  const termo = searchInput.value.trim().toLowerCase();

  const filtrados = allGames.filter((jogo) => {
    const titulo = (jogo.titulo || "").toLowerCase();
    const genero = (jogo.genero || "").toLowerCase();
    return titulo.includes(termo) || genero.includes(termo);
  });

  gamesCount.textContent = `${filtrados.length} ${filtrados.length === 1 ? "jogo" : "jogos"}`;
  gamesList.innerHTML = "";

  if (filtrados.length === 0) {
    emptyState.classList.remove("hidden");
    return;
  }

  emptyState.classList.add("hidden");

  filtrados.forEach((jogo) => {
    const card = document.createElement("article");
    card.className = "game-card";

    card.innerHTML = `
      <div>
        <h3 class="game-title"></h3>
        <p class="game-dev"></p>
        <div class="badges">
          <span class="badge badge-genre"></span>
          <span class="badge badge-rating"></span>
        </div>
      </div>

      <div>
        <div class="game-meta">
          <span>Nota: <strong>⭐ ${Number(jogo.avaliacao).toFixed(1)}</strong></span>
          <span>Sessão: <strong>⏱ ${jogo.tempo_sessao} min</strong></span>
        </div>
        <div class="card-actions" style="margin-top: 12px;">
          <button type="button" class="btn btn-edit">Editar</button>
          <button type="button" class="btn btn-delete">Excluir</button>
        </div>
      </div>
    `;

    // Preenche via textContent para evitar injeção de HTML
    card.querySelector(".game-title").textContent = jogo.titulo;
    card.querySelector(".game-dev").textContent = jogo.desenvolvedora;
    card.querySelector(".badge-genre").textContent = jogo.genero;
    card.querySelector(".badge-rating").textContent = `Classificação: ${jogo.classificacao}`;

    // Ação de Editar
    card.querySelector(".btn-edit").addEventListener("click", () => {
      preencherEdicao(jogo);
    });

    // Ação de Excluir
    card.querySelector(".btn-delete").addEventListener("click", () => {
      excluirJogo(jogo.id, jogo.titulo);
    });

    gamesList.appendChild(card);
  });
}

// Preenche o formulário com os dados do jogo escolhido
function preencherEdicao(jogo) {
  gameIdInput.value = jogo.id;
  tituloInput.value = jogo.titulo;
  desenvolvedoraInput.value = jogo.desenvolvedora;
  generoInput.value = jogo.genero;
  classificacaoInput.value = jogo.classificacao;
  avaliacaoInput.value = jogo.avaliacao;
  tempoSessaoInput.value = jogo.tempo_sessao;

  formTitle.textContent = "Editar Jogo";
  submitBtn.textContent = "Salvar Alterações";
  cancelEditBtn.classList.remove("hidden");

  window.scrollTo({ top: 0, behavior: "smooth" });
  tituloInput.focus();
}

// 4. DELETE — Exclui o documento após confirmação
async function excluirJogo(id, titulo) {
  const confirmou = confirm(`Tem certeza que deseja excluir "${titulo}"?`);
  if (!confirmou) return;

  try {
    await deleteDoc(doc(db, "jogos", id));
    showFeedback(`"${titulo}" foi excluído.`);

    // Se o usuário estava editando justamente o item excluído, limpa o formulário
    if (gameIdInput.value === id) {
      resetForm();
    }
  } catch (error) {
    console.error("Erro ao excluir jogo:", error);
    showFeedback("Erro ao excluir o jogo.", "error");
  }
}

// Filtro em tempo real
searchInput.addEventListener("input", renderGames);
