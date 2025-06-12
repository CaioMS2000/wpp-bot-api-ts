rm -rf node_modules
rm package-lock.json
sleep 1
clear
npm cache clean --force
npm install --foreground-scripts
npx @caioms/ts-utils generate