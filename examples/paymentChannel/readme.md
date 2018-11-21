Unilateral payment channel:

Actions:
-Deposit into layer2 (on chain)
-If on chain deposit: Send payment/gift to any given address (offchain)
-Close deposit channel (for withdraw)
-Withdraw your balance:
  -off chain allowance (gifts received)
  -unsent deposit (if closed)


Nodes:

-One operator:
  -network: receives and broadcasts messages
  -layer 2 permissions: none

-Clients:
  -full client:
    allows to send txes to the operator
    receives and stores all txes
    allows to verify integrity of channels
    allows to monitor and contest on chain withdrawals


remote wallet (node/wallet):
    metamask layer 2 app script


Todo:

- reset mongo DB