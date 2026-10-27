# YouTubeMLP — PonyTube Pastel Theme

Tema de mlp pro yt é nois ta daorinha e feio tb

Extensão do Chrome que deixa o YouTube com cara de My Little Pony (Pinkie Pie).

## Instalar

1. Baixe/clone este repositório.
2. Abra `chrome://extensions` e ligue o **Modo do desenvolvedor**.
3. Clique em **Carregar sem compactação** e escolha esta pasta.

## Opções (no ícone da extensão)

- **Ativar tema** — liga/desliga tudo.
- **Papel de parede** — Pinkie Pie suave no fundo (desligado por padrão), com controle de intensidade.

## Como funciona

O YouTube gera suas cores a partir de variáveis CSS (tokens) com nomes que mudam a cada versão.
Em vez de fixar cores, o `palette.js` lê a paleta atual do YouTube (claro e escuro) e cria uma
versão rosada: cinzas viram tons de rosa/ameixa, azuis viram lavanda e vermelhos viram rosa-choque.
O resultado fica em cache, então nas próximas visitas o tema aparece na hora, sem custo.
