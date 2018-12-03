# Eth Layer 2 APP Tracker/ Script Wrapper

## Specifications

- layer1Provider: eth provider
- layer1BlockTracker: selected layer1 network evm block tracker
- layer1NetworkId: selected layer1 network Id
 
- layer1OwnerAddress: selected MetaMask account
 
- layer1ContractAddress: Gateway contract on layer1 to enter layer2 by depositing (code is specific to each layer2 solution but we may require some standard for the deposit action and to track initial locked eth balances)
- layer2NetworkUrl: (For now) Ws of the hub/server/operator (depending on the layer2 design) 
- layer2KeyDerivationPath: (Provided by layer 2 solution)
- layer2Script: npm package that contains the specific layer2 plugin code -- should be ran in a secure fashion
	-layer2ScriptInterface
	
	```
	    this.layer2Interface = {
	       actions:
	       [{name: "makePayment",
		 call:this.makePayment.bind(this),
		 params:[{name:"toAddress",
		 	 type:"address"},
		 	{name: "value",
		 	 type: "uint"}
		        ]},
	        {name: "requestWithdrawPayment",
		 call:this.withdrawPayment.bind(this),
		 params:[{name:"fromAddress",
			 type:"address"},
			{name:"latestMessage",
			 type:"string"}
		       ]
	       }]
	       }
       ```


 [Request permission from user for this (layer2KeyDerivationPath)]
- localDatabase(layer2KeyDerivationPath): isolated local DB in MetaMask to which the layer 2 solution is granted write/read to
- layer2Address(layer2KeyDerivationPath): Public address/key of the account 
- layer2PrivateKey(layer2KeyDerivationPath): 


## Temp Notes
Layer 2 means not only scalability solutions here (plasma, state channels), it means really a layer 2 plugin and app built on the evm layer 1, for any purpose. So this could work also potentially for privacy solutions Zk Snark / starks ... and more generally any app that's anchored in the evm by a smart contract and some actions/state (so even potentially a layer1 app ?)