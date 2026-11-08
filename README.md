<div align="center">

# Floricultura

**Uma loja de flores online com o atendimento da equipe no mesmo lugar.**

Catálogo, personalização do presente e painel de pedidos com recebimentos, preparação e agenda de entregas.

![HTML5](https://img.shields.io/badge/HTML5-E34F26?style=flat-square&logo=html5&logoColor=white)
![CSS3](https://img.shields.io/badge/CSS3-1572B6?style=flat-square&logo=css3&logoColor=white)
![JavaScript](https://img.shields.io/badge/JavaScript-F7DF1E?style=flat-square&logo=javascript&logoColor=black)
![GitHub Pages](https://img.shields.io/badge/GitHub_Pages-222222?style=flat-square&logo=githubpages&logoColor=white)

[Demonstração](https://wrkcoronel.github.io/floricultura/) · [Funcionalidades](#funcionalidades) · [Como funciona](#como-funciona) · [Como testar](#como-testar)

**PROTÓTIPO INTERATIVO · Loja online e painel de atendimento**

</div>

---

## O que é o projeto

A Floricultura simula a jornada completa de uma floricultura: o cliente escolhe o presente, personaliza o cartão e define entrega ou retirada; a equipe acompanha o pedido no painel, registra recebimentos, confere a preparação e conduz a entrega.

O site funciona no navegador, com layout adaptado para celular e computador. Todos os dados são fictícios e ficam guardados no próprio navegador, o que permite apresentar o fluxo sem servidor nem cadastro.

## Funcionalidades

| Recurso | O que permite fazer |
| --- | --- |
| Loja e personalização | Escolher o presente, escrever o cartão e definir entrega ou retirada |
| Painel de pedidos | Cadastrar, editar, buscar e filtrar pedidos |
| Recebimentos | Registrar sinal, saldo, pagamento completo e estorno (fictícios) |
| Preparação e agenda | Conferir o checklist, o responsável e as etapas de entrega ou retirada |
| Demonstração persistente | Manter os dados no navegador e restaurar os exemplos iniciais |

## Como funciona

O protótipo representa a operação de uma floricultura do pedido à entrega. Cada pedido passa por etapas que o cliente e a equipe acompanham pelo mesmo registro.

```mermaid
flowchart TD
    A["Cliente escolhe o presente"] --> B["Personaliza o cartão e define entrega ou retirada"]
    B --> C["A confirmar: loja confere valor, frete e recebe o sinal"]
    C --> D["Em preparação: flores, cartão e embalagem"]
    D --> E["Pronto"]
    E -->|Entrega| F["Em entrega"]
    E -->|Retirada| G["Cliente retira na loja"]
    F --> H["Concluído: saldo quitado"]
    G --> H
    C -.->|Desistência| X["Cancelado: estorno do sinal"]
```

| Etapa | Responsável | O que acontece |
| --- | --- | --- |
| A confirmar | Atendimento | Confere o pedido, define o frete e registra o sinal |
| Em preparação | Produção | Monta o arranjo e marca o checklist de flores, cartão e embalagem |
| Pronto | Produção | Libera o pedido para a saída ou para a retirada |
| Em entrega | Entrega | Leva o presente no período escolhido pelo cliente |
| Concluído | Atendimento | Confirma a entrega ou a retirada e recebe o saldo |

## Como testar

1. Abra a [demonstração](https://wrkcoronel.github.io/floricultura/) e faça um pedido com dados fictícios.
2. Em **Painel da loja**, registre um sinal e marque a preparação.
3. Na agenda, conclua a entrega. **Recomeçar demonstração** volta aos exemplos.

Para rodar localmente, sem dependências: `python -m http.server 4178` e abra `http://127.0.0.1:4178/`.

## Limites do protótipo

- Use somente dados fictícios. O painel está aberto para apresentação, sem login.
- Os dados ficam no `localStorage` do navegador utilizado.
- Recebimentos, estornos e a chave Pix são apenas de demonstração. Não há cobrança nem envio de mensagens.
- Uma versão de produção precisaria de autenticação, backend, banco de dados e integração com pagamento.

## Créditos

As fotografias vêm do Unsplash, sob a Licença Unsplash. A origem de cada imagem está em [`CREDITOS.md`](CREDITOS.md).

---

<div align="center">

**FLORICULTURA** · Protótipo de loja online e painel de atendimento

</div>
