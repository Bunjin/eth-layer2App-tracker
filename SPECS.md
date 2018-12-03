# Eth Layer 2 APP Tracker/ Script Wrapper

## Specifications

- layer1Provider: eth provider
- layer1BlockTracker: selected layer1 network evm block tracker
- layer1NetworkId: selected layer1 network Id
 
- layer1OwnerAddress: selected MetaMask account

[Inputs for add custom layer2 solution]
- layer2SolutionContractAddress: Gateway contract on layer1 to enter layer2 by depositing (code is specific to each layer2 solution but we may require some standard for the deposit action and to track initial locked eth balances)
- layer2NetworkUrl: (For now) Ws of the hub/server/operator (depending on the layer2 design) 
- layer2KeyDerivationPath: (Provided by layer 2 solution)
- layer2Script: npm package that contains the specific layer2 plugin code -- should be ran in a secure fashion
	- layer2ScriptInterface
	example format:
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
- layer2Addresses(layer2KeyDerivationPath): Public addresses/keys of accounts created by the layer 2 solution (restricted to the derivation path)
- layer2PrivateKeys(layer2KeyDerivationPath): Private ...

## Metamask - plugin communication:
-add layer 2 solution: request permission from user to install script that uses localDb and new derivationpath + has key control for this path
-getAccount: for the given derivation seed path only, derive a new account
-deposit: lock some eth via a layer1 usual metamask tx from a main account of the user into the layer2 solution contract previously added
-derive: layer2 can use
-persist: store in local db
-sign: via an account outside of the derivationpath (e.g. the depositer main account) because signing with derivated accounts can be done fully in layer2 script
-withdraw: make a 0eth tx to the layer 2 with some tx data (maybe we require some standard for that to avoid potential exploits? not sure if there are any though if we restrict to the layer2 solution contract)
-getLayer2State: metamask->plugin
-updateLayer2State: plugin->metamask
-inject layer2 actions: website<->metamask<->plugin
-expose layer2 state: website<->metamask<->plugin


## Temp Notes
Layer 2 means not only scalability solutions here (plasma, state channels), it means really a layer 2 plugin and app built on the evm layer 1, for any purpose. So this could work also potentially for privacy solutions Zk Snark / starks ... and more generally any app that's anchored in the evm by a smart contract and some actions/state (so even potentially a layer1 app ?)