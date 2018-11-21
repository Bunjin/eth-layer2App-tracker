network?="dev"
version?="flux"

all: kill deploy resetOperator startOperator

kill:
	-sudo pkill -f "layer2-node.js"

startBoth: startOperator && startClient

deploy:
	truffle compile --force && truffle migrate --reset --network $(network)

startOperator:
	node app/layer2-node.js operator flux 8008 true 8009 MetaMaskPaymentChannelOperator$(version)

startClient:
	node app/layer2-node.js client flux 8008 true 8010 MetaMaskPaymentChannelClient$(version)

resetOperator:
	node resetMongo.js MetaMaskPaymentChannelOperator$(version)
