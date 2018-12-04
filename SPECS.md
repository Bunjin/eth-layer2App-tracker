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
- add layer 2 solution: request permission from user to install script that uses localDb and new derivationpath + has key control for this path
- getAccount: for the given derivation seed path only, derive a new account (may or may not require confirmation by user)
- deposit: lock some eth via a layer1 usual metamask tx from a main account of the user into the layer2 solution contract previously added
- persist: store in local db
- getFromLocalDb: 
- sign: via an account outside of the derivationpath (e.g. the depositer main account) because signing with derivated accounts can be done fully in layer2 script
- withdraw: make a 0eth tx to the layer 2 with some tx data (maybe we require some standard for that to avoid potential exploits? not sure if there are any though if we restrict to the layer2 solution contract)
- getLayer2State: metamask->plugin
- updateLayer2State: plugin->metamask
- inject layer2 actions: website<->metamask<->plugin
- expose layer2 state: website<->metamask<->plugin

- display layer2 UI: allows to show some confirmation screens from the layer2 script
  We could even better integrated some layer2 script's confirmation upon actions that require confirmation by the user

## Notes on "layer2 nodes", networkUrl + local db, p2p dbs and on layer 2 logic (what's in the plugin and what's in the node)
Current implementation uses a layer2 node for the layer 2 networking (broadcasting tx, fetching state), for the layer 2 actions history storage and for the layer 2 history verification (compute balances based on messages and verify/contest withdrawal requests). The layer 2 script in metamask only takes care of the signing and is communicating with the layer 2 node to receive/broadcast actions and update its state.
This layer 2 node is intented to be either ran locally by the user or used remotely (similar to infura).
This mimics the current behavior of layer 1 Metamask and the EVM node (local parity/geth / remote parity or geth...)

However the layer 2 script running in the plugin could itself contain "the layer 2 node" fully or partly and not only the signing. How much is fully embedded (p2p and serverless) into the metamask plugin can vary over 3 dimensions: 
- layer 2 tx networking
- layer 2 current state computation, verification and monitoring
- layer 2 history (tx and potentially also computed states) sync and storage


Note on computed state history: 
For a layer 2 network to be able to have light clients it needs to store the states too (or at least some) and provide them if requested by the light clients. Note that the light clients would have to give up on security of the dimension 2 too (layer 2 current state computation, verification and monitoring)

For instance, Counterfactual with playground seem to have layer 2 networking externalized (delegated to a hub). The current layer 2 state computation, storage and verification is internalized (they'd like to compute and store it into metamask). Regarding the layer 2 history sync and backup, it looks like they didn't implement it yet but they seem to be taking an approach of eternalisation for this through watchers (to be confirmed). 

My current implementation delegates and thus externalizes all 3 aspects to the local user or remote layer 2 node. 

One could think of implentations that internalize the layer 2 current state computing/monitoring and also the layer 2 history sync using a p2p db. 

Internalization of all 3 dimensions would require a p2p network formed by the metamask plugins (with sync) and a p2p database... kitsunet... mustekala ?

## How should we isolate the layer2 script execution?
(based on Dan's notes)
-Agoric
-iFrames (similar to Hardware wallets-Metamask)

## Temp Notes
Layer 2 means not only scalability solutions here (plasma, state channels), it means really a layer 2 plugin and app built on the evm layer 1, for any purpose. So this could work also potentially for privacy solutions Zk Snark / starks ... and more generally any app that's anchored in the evm by a smart contract and some actions/state (so even potentially a layer1 app ?).

should deposit/withdraw be merged in the plugin communications as "sign a layer1 tx to the layer2 contract address"?

Dan ideas about how these plugins can be seen as "networks" and even be layer1 blockchains themselves, such as Eth. One problem with this is that then plugins need to be able to communicate together and have permissions levels.
also this would need a full rewrite.
