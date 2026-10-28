# Floricultura

Protótipo interativo de uma loja de flores online com painel de atendimento da equipe.

Demonstração: https://floricultura-35d.pages.dev/

## Funcionalidades

- Catálogo com categorias e disponibilidade dos produtos.
- Personalização do presente, cartão, entrega ou retirada e revisão do pedido.
- Painel com cadastro, edição, busca e filtros de pedidos.
- Recebimentos fictícios: sinal, saldo, pagamento completo e estorno.
- Checklist de preparação, responsável, observações internas e histórico.
- Agenda de entregas e retiradas com atualização das etapas.
- Demonstração persistida no navegador, com opção de restaurar os exemplos.
- Prévia de compartilhamento com título, descrição e foto.

## Executar localmente

O site usa HTML, CSS e JavaScript, sem dependências nem etapa de build.

```sh
python -m http.server 4178 --bind 127.0.0.1
```

Abra `http://127.0.0.1:4178/` e use **Painel da loja** para ver o atendimento.

## Apresentação sugerida

1. Escolha um presente na loja e simule o pedido com dados fictícios.
2. Abra o pedido no painel, confirme o valor e o frete.
3. Registre um sinal e confira o saldo restante.
4. Marque a preparação e confira flores, cartão e embalagem.
5. Na agenda, simule a saída e a conclusão da entrega ou retirada.
6. Use **Recomeçar demonstração** para voltar aos exemplos iniciais.

## Limites do protótipo

- Use somente dados fictícios. O painel está aberto para apresentação, sem login.
- Os dados ficam no `localStorage` do navegador utilizado.
- Recebimentos, estornos e a chave Pix são apenas de demonstração. Não há cobrança nem envio de mensagens.
- Uma versão de produção precisaria de autenticação, backend, banco de dados e integração com pagamento.

## Estrutura

| Arquivo | Finalidade |
| --- | --- |
| `index.html` | Loja, formulários, painel e metadados de compartilhamento |
| `styles.css` | Layout para computador e celular |
| `app.js` | Catálogo, pedidos e fluxos simulados |
| `assets/` | Fotografias do site |
| `compartilhar.jpg` | Imagem da prévia de links |
| `CREDITOS.md` | Origem e licença das fotografias |

## Publicação

Publicado na Cloudflare Pages por envio direto:

```sh
npx wrangler pages deploy . --project-name floricultura --branch main
```
