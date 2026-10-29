// URL do app da web do Apps Script (a mesma que o EA usa para gravar na planilha)
const SCRIPT_URL = "https://script.google.com/macros/s/AKfycbzRlZOY3oAAHqZ43owpuz06KD_5lvZhJOMI_oabSZcXVq0Lqn4HBGA50VywArgPa_1N/exec";

const MAX_LINHAS = 50;       // quantas linhas mostrar na tabela (as mais recentes)
let totalVisto = null;       // quantas linhas da planilha o log ja registrou

// Tira acento e deixa minusculo: "Açao" -> "acao", "Preço" -> "preco"
const semAcento = s => String(s).normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();

// Normaliza os nomes das colunas para o painel funcionar com ou sem acento no cabecalho
function normaliza(linha) {
    const o = {};
    Object.keys(linha).forEach(k => { o[semAcento(k)] = linha[k]; });
    return o;
}

// Evita que texto vindo da planilha seja interpretado como HTML
const esc = v => String(v == null ? "" : v).replace(/[&<>"']/g, c => (
    { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]
));

// Numero em formato brasileiro; vazio, "-" ou zero viram "-"
function fmtNum(v) {
    if (v === "" || v === null || v === undefined || v === "-") return "-";
    const n = (typeof v === "number") ? v : Number(String(v).replace(",", "."));
    if (!isFinite(n) || n <= 0) return "-";
    return n.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

// Horario: se o Google Sheets converteu em data (ISO), mostra no horario de Fortaleza
function fmtHora(v) {
    if (v === "" || v === null || v === undefined) return "-";
    const s = String(v);
    if (/^\d{4}-\d{2}-\d{2}T/.test(s)) {
        const d = new Date(s);
        if (!isNaN(d.getTime())) return d.toLocaleString("pt-BR", { timeZone: "America/Fortaleza" });
    }
    return s;
}

// COMPRA verde, VENDA vermelho, demais eventos (TRAILING, FECHAMENTO, SEM ENTRADA...) amarelo
function corAcao(acao) {
    const a = semAcento(acao);
    if (a === "compra") return "#34d399";
    if (a === "venda") return "#f87171";
    return "#fbbf24";
}

async function carregarSinais() {
    try {
        const resposta = await fetch(SCRIPT_URL);
        const bruto = await resposta.json();

        const tabela = document.getElementById("sinais-tabela");
        const terminal = document.getElementById("terminal-log");

        if (!Array.isArray(bruto) || bruto.length === 0) {
            tabela.innerHTML = `<tr><td colspan="7" class="loading">Aguardando novos sinais da conta demo...</td></tr>`;
            return;
        }

        const dados = bruto.map(normaliza);

        // Tabela: os mais recentes primeiro
        tabela.innerHTML = dados.slice(-MAX_LINHAS).reverse().map(s => `
            <tr>
                <td>${esc(fmtHora(s.horario))}</td>
                <td><strong>${esc(s.ativo || "-")}</strong></td>
                <td><span style="color: ${corAcao(s.acao)}">${esc(s.acao || "-")}</span></td>
                <td>${esc(fmtNum(s.preco))}</td>
                <td>${esc(fmtNum(s.tp))}</td>
                <td>${esc(fmtNum(s.sl))}</td>
                <td><span style="background: #065f46; color: #34d399; padding: 3px 8px; border-radius: 4px; font-size: 0.8rem;">${esc(s.status || "Ativo")}</span></td>
            </tr>`).join("");

        // Log: so acrescenta linhas NOVAS da planilha (antes repetia a ultima a cada 10 s)
        let novos = [];
        if (totalVisto === null) novos = dados.slice(-5);
        else if (dados.length > totalVisto) novos = dados.slice(totalVisto);
        totalVisto = dados.length;

        novos.forEach(s => {
            const p = document.createElement("p");
            p.className = "log-item";
            p.textContent = `[Robô] ${fmtHora(s.horario)} | ${s.acao || "-"} ${s.ativo || ""} a ${fmtNum(s.preco)} | ${s.status || "-"}`;
            terminal.appendChild(p);
        });
        if (novos.length) terminal.scrollTop = terminal.scrollHeight;

    } catch (erro) {
        console.error("Erro ao carregar os dados:", erro);
    }
}

// Atualiza a tabela automaticamente a cada 10 segundos
setInterval(carregarSinais, 10000);

// Executa assim que a página abrir
carregarSinais();
