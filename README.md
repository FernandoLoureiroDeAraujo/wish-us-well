# wish-us-well 💍

> Página de lista de presentes de casamento — **Lorena & Fernando · 14 de junho de 2026**
> Hospedada no GitHub Pages, dados lidos de uma planilha Google Sheets.

---

## ✨ Funcionalidades

- Tema Tiffany Blue elegante e responsivo
- Lista carregada ao vivo do Google Sheets (CSV publicado)
- Filtros por categoria + busca por nome
- Toggle "Só disponíveis"
- Badge **"Já Presenteado"** em itens comprados
- Botão **✓** por item → abre WhatsApp com mensagem pronta
- Seção PIX com botão copiar chave
- Seção de entrega com links WhatsApp
- Countdown para o casamento
- Skeleton loading enquanto carrega
- Mobile-first, sem frameworks, sem build step

---

## 🗂️ Como organizar a planilha

Limpe o que tiver na planilha atual e coloque **exatamente esses títulos na linha 1**
(use letras minúsculas, sem acento — igual abaixo):

| Coluna | Título     | O que colocar                               | Exemplo                              |
|--------|------------|---------------------------------------------|--------------------------------------|
| A      | `nome`     | Nome do produto                             | `Sanduicheira`                       |
| B      | `categoria`| Categoria (veja lista abaixo)               | `Cozinha`                            |
| C      | `imagem`   | URL da foto (da loja ou Imgur)              | `https://m.media-amazon.com/...jpg`  |
| D      | `link`     | Link para comprar                           | `https://amazon.com.br/...`          |
| E      | `preco`    | Preço ou faixa                              | `R$ 150–200`                         |
| F      | `destaque` | Item que vocês mais querem? `sim` ou `não`  | `sim`                                |
| G      | `comprado` | Já foi presenteado? `sim` ou `não`          | `não`                                |
| H      | `observacao`| Detalhes / cor / tamanho                   | `Preto ou Cinza`                     |

### Categorias sugeridas

`Cozinha` · `Mesa Posta` · `Quarto` · `Banheiro` · `Organização` · `Decoração`

Você pode usar qualquer nome — o site cria os filtros automaticamente a partir das categorias da planilha.

### Sua lista atual convertida para o novo formato

| nome                          | categoria    | imagem | link                   | preco | destaque | comprado | observacao          |
|-------------------------------|--------------|--------|------------------------|-------|----------|----------|---------------------|
| Sanduicheira                  | Cozinha      |        |                        |       | não      | não      | Preto ou Cinza      |
| Garrafa de café               | Cozinha      |        | *(link do Amazon)*     |       | não      | não      | Preta               |
| Espremedor de Laranja         | Cozinha      |        | *(link do Shopee)*     |       | não      | não      | Automático          |
| Cesto de roupa                | Organização  |        | *(link do Amazon)*     |       | não      | não      | Com tampa, Branco   |
| Jogo de sousplat              | Mesa Posta   |        |                        |       | não      | não      |                     |
| Manta de casal                | Quarto       |        | *(link do ML)*         |       | não      | não      | Cor chumbo          |
| Batedeira                     | Cozinha      |        |                        |       | sim      | não      |                     |
| Cobre Leito                   | Quarto       |        |                        |       | sim      | não      |                     |
| Jogo de toalha (cinza)        | Banheiro     |        | *(link do ML)*         |       | não      | não      | Cinza               |
| Jogo de toalha                | Banheiro     |        |                        |       | não      | não      |                     |
| Jogo de Jantar                | Mesa Posta   |        | *(link do Amazon)*     |       | sim      | não      |                     |
| Colher universal de servir    | Cozinha      |        |                        |       | não      | não      |                     |
| Concha de inox                | Cozinha      |        |                        |       | não      | não      |                     |
| Suporte de toalha de parede   | Banheiro     |        | *(link do Amazon)*     |       | não      | não      | Cromado             |
| Suporte de canecas            | Organização  |        | *(link do Shopee)*     |       | não      | não      |                     |
| Tábua de vidro                | Cozinha      |        | *(link do ML)*         |       | não      | não      | Temperado 25x37     |

---

## ⚙️ Configuração do site (`app.js`)

Abra `app.js` e atualize o objeto `CONFIG` no topo do arquivo:

```js
const CONFIG = {
  // URL da planilha publicada como CSV (veja como abaixo)
  csvUrl: 'https://docs.google.com/spreadsheets/d/SEU_ID_AQUI/pub?output=csv',

  // Seu número de WhatsApp: 55 + DDD + número (sem +, espaço ou traço)
  whatsappNumber: '5511987654321',

  // Chave PIX: CPF, e-mail, celular ou chave aleatória
  pixKey: 'seuemail@gmail.com',

  // Nomes usados nas mensagens do WhatsApp
  coupleNames: 'Lorena e Fernando',

  // Data do casamento (formato ISO)
  weddingDate: '2026-06-14T12:00:00',
};
```

---

## 📋 Como publicar a planilha como CSV

1. Abra a planilha no Google Sheets
2. Clique em **Arquivo → Compartilhar → Publicar na Web**
3. Em "Link", selecione **"Documento inteiro"** e o formato **"Valores separados por vírgula (.csv)"**
4. Clique em **Publicar** e confirme
5. Copie o link gerado (começa com `https://docs.google.com/spreadsheets/d/...`)
6. Cole no campo `csvUrl` dentro do `CONFIG` em `app.js`

> 💡 **Dica:** depois de publicada, qualquer edição na planilha aparece no site em menos de 1 minuto.
> Para marcar um item como presenteado, basta mudar a coluna `comprado` para `sim`.

---

## 🚀 Como publicar no GitHub Pages

1. Crie um repositório no GitHub — sugestão de nome: **`wish-us-well`**
2. Suba os arquivos (`index.html`, `style.css`, `app.js`) para o branch `main`
3. Acesse **Settings → Pages**
4. Em "Source", selecione **Deploy from a branch → main → / (root)**
5. Aguarde ~1 minuto — o site ficará disponível em:
   `https://SEU_USUARIO.github.io/wish-us-well/`

### Domínio personalizado (opcional)
Se quiser um endereço como `presentes.seucasamento.com.br`, configure o DNS apontando para o GitHub Pages e adicione o domínio em **Settings → Pages → Custom domain**.

---

## 📁 Estrutura dos arquivos

```
wish-us-well/
├── index.html   ← Estrutura da página
├── style.css    ← Visual (Tiffany Blue)
├── app.js       ← Lógica, CSV, filtros, WhatsApp, PIX
└── README.md    ← Este arquivo
```

---

## 💡 Dicas de uso

| O que fazer              | Como fazer                                                  |
|--------------------------|-------------------------------------------------------------|
| Marcar item como comprado| Coluna `comprado` → `sim` na planilha                       |
| Adicionar foto           | Cole a URL da imagem da loja na coluna `imagem`             |
| Destacar um item         | Coluna `destaque` → `sim` (aparece com badge "Wishlist")    |
| Mudar chave PIX          | Edite `CONFIG.pixKey` em `app.js`                           |
| Mudar número WhatsApp    | Edite `CONFIG.whatsappNumber` em `app.js`                   |
| Adicionar novo item      | Adicione uma linha nova na planilha — atualiza sozinho      |

---

*Feito com amor para Lorena & Fernando · 14 de junho de 2026* 💍
