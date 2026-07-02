# AS School App - Deploy & Independência

Este projeto foi configurado para ser 100% independente da plataforma AI Studio e está pronto para ser alojado no **Render** e **GitHub Pages**.

## Estrutura de Ficheiros Multimédia
Como o projeto não faz upload automático, as imagens e vídeos devem ser colocados nas respetivas pastas:

- **Imagens:** Coloca em `public/fotos/`
- **Vídeos:** Coloca em `public/videos/`

Tudo o que estiver dentro da pasta `public` será automaticamente servido e copiado para a versão final de produção (pasta `dist`). Ao criar uma publicação no portal, basta colocar o nome exato do ficheiro (ex: `foto.jpg`) no campo correspondente, e o sistema buscará os ficheiros a partir destas pastas.

## Deploy no GitHub Pages
O projeto inclui um script do **GitHub Actions** (`.github/workflows/deploy.yml`) que faz o deploy automático sempre que enviares alterações para o branch `main`.

1. Cria um repositório no GitHub e faz push do teu código.
2. Vai às **Settings** do repositório > **Pages**.
3. Em "Build and deployment", certifica-te que a Source está como **GitHub Actions**.
4. Quando fizeres commit para o `main`, a Action vai correr e publicar o site na tua URL do GitHub Pages automaticamente!

## Deploy no Render
O projeto inclui um ficheiro `render.yaml` pronto a usar ("Infrastructure as Code").

1. Cria conta no [Render](https://render.com/).
2. Clica em **New+** -> **Blueprint**.
3. Conecta o teu repositório GitHub.
4. O Render vai ler o ficheiro `render.yaml` e criar um Web Service de tipo "Static Site" automaticamente, correndo o comando `npm run build` e servindo a pasta `dist`.
5. Qualquer push para o GitHub também fará trigger de um deploy automático no Render.

## Correr Localmente (Sem o AI Studio)
1. Instala o Node.js.
2. Instala as dependências: `npm install`
3. Inicia o servidor local: `npm run dev`
4. Para compilar para produção: `npm run build` (o código compilado ficará na pasta `dist`).
