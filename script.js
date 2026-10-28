// Cole aqui a mesma URL do seu Apps Script do Google Sheets
const SCRIPT_URL = "https://script.google.com/macros/s/AKfycbzRlZOY3oAAHqZ43owpuz06KD_5lvZhJOMI_oabSZcXVq0Lqn4HBGA50VywArgPa_1N/exec";

async function carregarSinais() {
    try {
        let resposta = await fetch(SCRIPT_URL);
        let dados = await resposta.json();
        
        let tabela = document.getElementById("sinais-tabela");
        
        if (dados.length === 0) {
            tabela.innerHTML = `<tr><td colspan="7" class="loading">Aguardando novos sinais da conta demo...</td></tr>`;
            return;
        }

        // Limpa a tabela e preenche com os dados mais recentes do Google Sheets
        tabela.innerHTML = "";
        
        // Mostra os mais recentes primeiro (invertendo a ordem se quiser)
        dados.reverse().forEach(sinal => {
            let linha = document.createElement("tr");
            linha.innerHTML = `
                <td>${sinal.Horario || '-'}</td>
                <td><strong>${sinal.Ativo || '-'}</strong></td>
                <td><span style="color: ${sinal.Acao === 'COMPRA' ? '#34d399' : '#f87171'}">${sinal.Acao || '-'}</span></td>
                <td>${sinal.Preco ? Number(sinal.Preco).toFixed(5) : '-'}</td>
                <td>${sinal.TP ? Number(sinal.TP).toFixed(5) : '-'}</td>
                <td>${sinal.SL ? Number(sinal.SL).toFixed(5) : '-'}</td>
                <td><span style="background: #065f46; color: #34d399; padding: 3px 8px; border-radius: 4px; font-size: 0.8rem;">${sinal.Status || 'Ativo'}</span></td>
            `;
            tabela.appendChild(linha);
        });

        // Atualiza também o terminal de logs com a última ação
        let ultimo = dados[dados.length - 1];
        if (ultimo) {
            let terminal = document.getElementById("terminal-log");
            terminal.innerHTML += `<p class="log-item">[Robô] Sinal executado em ${ultimo.Ativo} (${ultimo.Acao}) a ${ultimo.Preco}</p>`;
            terminal.scrollTop = terminal.scrollHeight;
        }

    } catch (erro) {
        console.error("Erro ao carregar os dados:", erro);
    }
}

// Atualiza a tabela automaticamente a cada 10 segundos
setInterval(carregarSinais, 10000);

// Executa assim que a página abrir
carregarSinais();
