
npm run build-prod

npm run test

git init
git add .
git commit -m 'deploy'
git push

eb deploy
