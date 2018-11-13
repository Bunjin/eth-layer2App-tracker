network?="dev"

all: deploy

deploy:
	truffle compile --force && truffle migrate --reset --network $(network)

startOperator:
	node app/layer2-node.js operator flux 8008 true 8009

startClient:
	node app/layer2-node.js client flux 8008 true 8010
