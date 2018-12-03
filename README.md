# Eth Layer 2 APP Tracker 

[Insert image]


A JS module for tracking Ethereum Layer 2 Solutions/Apps (requires a layer 2 plugin specific to the layer 2 solutions)




## Installation

clone this repo
then `npm run compile` and in the package folder + metamask-extension use `npm link [...]` (see: https://github.com/MetaMask/metamask-extension/blob/develop/docs/developing-on-deps.md)

## Specifications

Creates a layer 2 tracker / wrapper around the specific layer 2 script

see SPECS.md for more details


## Temp notes:

The specific sub layer2 package should be iframed and ran in a secure fashion with an API to communicate with metamask to perform some actions and also to provide the state to metamask.

Also the part that is currently in layer2App view of the metamask-extension should be iframed and made into a package specific to the layer2 App.

We also need to be able to inject the layer2app functions into the inpage
