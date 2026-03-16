# MCI — Minha Cozinha Inteligente

[![last commit](https://img.shields.io/github/last-commit/automatize05-pixel/mci3)](https://github.com/automatize05-pixel/mci3/commits/main)
[![issues](https://img.shields.io/github/issues/automatize05-pixel/mci3)](https://github.com/automatize05-pixel/mci3/issues)
[![license](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)

## Descrição do Projeto

O **MCI — Minha Cozinha Inteligente** é uma plataforma digital que combina rede social culinária e inteligência artificial para ajudar pessoas a descobrir, compartilhar e preparar receitas de forma simples e inteligente.

Nosso objetivo é conectar amantes da culinária, cozinheiros e chefs em uma comunidade interativa onde é possível publicar pratos, compartilhar receitas, seguir chefs, trocar mensagens e aprender novas formas de cozinhar todos os dias.

Um dos principais diferenciais do MCI é o **Assistente de Cozinha com Inteligência Artificial**, que permite aos usuários inserir ingredientes disponíveis em casa e receber sugestões de pratos que podem ser preparados com esses ingredientes. Após escolher um prato sugerido, a IA gera uma receita completa com ingredientes, modo de preparo, tempo de cozimento e dicas culinárias.

O objetivo do MCI é se tornar a principal comunidade culinária digital de Angola, utilizando tecnologia e inteligência artificial para tornar a experiência de cozinhar mais acessível, interativa e inspiradora.

## Funcionalidades principais

- Assistente de receitas com Inteligência Artificial
- Sugestão de pratos a partir de ingredientes disponíveis
- Geração automática de receitas passo a passo
- Feed social de pratos e receitas
- Sistema de seguidores entre usuários e chefs
- Comentários com respostas encadeadas
- Sistema de mensagens privadas
- Ranking de chefs e receitas populares
- Desafios culinários semanais
- Compartilhamento de receitas em redes sociais
- Sistema de planos para chefs, com recursos premium

## Tecnologias utilizadas

- Vite
- TypeScript
- React
- shadcn-ui
- Tailwind CSS
- Supabase (backend e autenticação)
- Playwright & Vitest (testes)

## Estrutura do Projeto

```
src/
  assets/
  components/     # Componentes reutilizáveis React
  hooks/          # Hooks customizados
  integrations/   # Integração com APIs externas e IA
  lib/            # Utilitários/bibliotecas internas
  pages/          # Páginas principais do app
  test/           # Testes automatizados
.env
public/
supabase/
```

## Como rodar o projeto

Pré-requisitos: Node.js e npm instalados.

```sh
# Clone o repositório
git clone https://github.com/automatize05-pixel/mci3.git
cd mci3

# Instale as dependências
npm install

# Crie ou ajuste o arquivo .env conforme necessário

# Rode o servidor de desenvolvimento
npm run dev

# Acesse: http://localhost:5173/
```

## Roadmap

Veja abaixo as etapas de desenvolvimento previstas:

- [ ] Cadastro e login de usuários
- [ ] Publicação de receitas com fotos e descrição
- [ ] Sistema de comentários e respostas
- [ ] Feed social com receitas recentes/populares
- [ ] Seguir e ser seguido por outros usuários e chefs
- [ ] Salvar receitas favoritas
- [ ] Busca e filtros de receitas
- [ ] Assistente de receitas com IA (ingredientes → sugestões)
- [ ] Mensagens privadas entre usuários
- [ ] Rankings e desafios culinários semanais
- [ ] Painel de assinatura para chefs

Sinta-se livre para sugerir novas features ou discutir prioridades em nossas issues!

## Como contribuir

Quer contribuir? Com certeza, toda ajuda é bem-vinda!

1. Faça um fork deste repositório;
2. Crie uma branch nova (`git checkout -b minha-feature`);
3. Faça suas alterações e commits;
4. Dê push para seu fork (`git push origin minha-feature`);
5. Abra um Pull Request explicando seu objetivo.

Consulte nosso [guia de contribuição](./.github/CONTRIBUTING.md) para mais detalhes.

## Contato

Dúvidas ou sugestões?  
Abra uma [issue](https://github.com/automatize05-pixel/mci3/issues) ou envie um e-mail para: contato@minhacozinhainteligente.com

---

Desenvolvido por [automatize05-pixel](https://github.com/automatize05-pixel) e colaboradores.