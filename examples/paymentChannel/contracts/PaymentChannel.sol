pragma solidity ^0.4.0;

contract PaymentChannel {

  mapping (address => uint) public balance;

  struct Deposit {
    address depositer;
    uint nonce;
    uint value;
  }
  mapping (bytes32 => Deposit) public depositByCustomHash;
  mapping (address => bytes32[]) public depositCustomHashesByAddress;
  
  constructor() {
	  
  }

  function balanceOf(address owner) public constant returns(uint){
    return balance[owner];
  }

  event Layer2Setup(address depositer, uint value_added, uint value_total, uint time, bytes32 depositCustomHash);
	
  function setup(uint timeout) payable returns (bytes32){
    require(msg.value != 0);
    address depositer = msg.sender;
    uint value;
    uint current_value = balance[depositer];
    value = current_value + msg.value;
    balance[depositer] = value;
    uint lastDepositDate = now;
    uint nonce = depositCustomHashesByAddress[msg.sender].length;
    bytes32 depositCustomHash = keccak256(now, msg.sender, nonce);
    depositByCustomHash[depositCustomHash] = Deposit(msg.sender, nonce, msg.value);
    depositCustomHashesByAddress[msg.sender].push(depositCustomHash);
    emit Layer2Setup(depositer, msg.value, value, lastDepositDate, depositCustomHash);
    return depositCustomHash; 
  }
	
  /* function CloseChannel(bytes32 h, uint8 v, bytes32 r, bytes32 s, uint value){ */

  /*   address signer; */
  /*   bytes32 proof; */

  /*   // get signer from signature */
  /*   signer = ecrecover(h, v, r, s); */

  /*   // signature is invalid, throw */
  /*   if (signer != channelSender && signer != channelRecipient) throw; */

  /*   proof = sha3(this, value); */

  /*   // signature is valid but doesn't match the data provided */
  /*   if (proof != h) throw; */

  /*   if (signatures[proof] == 0) */
  /*     signatures[proof] = signer; */
  /*   else if (signatures[proof] != signer){ */
  /*     // channel completed, both signatures provided */
  /*     if (!channelRecipient.send(value)) throw; */
  /*     selfdestruct(channelSender); */
  /*   } */

  /* } */

  /* function ChannelTimeout(){ */
  /*   if (startDate + channelTimeout > now) */
  /*     throw; */

  /*   selfdestruct(channelSender); */
  /* } */

}
