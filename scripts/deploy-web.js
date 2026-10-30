/**
 * Publica a versão web (pasta dist) na branch gh-pages do GitHub Pages.
 *
 * Por que existe: na 1ª publicação a branch gh-pages não existia, então o
 * gh-pages clona a branch main — que traz o .gitignore do projeto (com
 * "node_modules/"). Esse .gitignore sobrevive à limpeza e faz o "git add"
 * descartar dist/assets/node_modules/... (as fontes dos ícones Ionicons),
 * deixando os ícones como quadradinhos vazios. Aqui trocamos esse .gitignore
 * por um vazio antes do "git add", para publicar todos os arquivos.
 */

const fs = require('fs');
const path = require('path');
const ghpages = require('gh-pages');

ghpages.publish(
  path.join(__dirname, '..', 'dist'),
  {
    branch: 'gh-pages',
    nojekyll: true,
    beforeAdd: (git) => {
      fs.writeFileSync(path.join(git.cwd, '.gitignore'), '');
      // Caminhos como assets/node_modules/@expo/vector-icons/... são longos
      // demais para o limite de 260 caracteres do Windows.
      return git.exec('config', 'core.longpaths', 'true');
    },
  },
  (err) => {
    if (err) {
      console.error('Falha ao publicar:', err.message);
      process.exit(1);
    }
    console.log('Publicado no GitHub Pages (branch gh-pages)!');
  },
);
