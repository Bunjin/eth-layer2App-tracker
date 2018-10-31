pragma solidity ^0.4.0;

contract PaymentChannel {

  mapping (address => uint) public balance;

  mapping (bytes32 => address) signatures;
  
  constructor() {
	  
  }

  function balanceOf(address owner) public constant returns(uint){
    return balance[owner];
  }


  event Layer2Setup(address depositer, uint value_added, uint value_total, uint time);
	
  function setup(uint timeout) payable {
    require(msg.value != 0);
    address depositer = msg.sender;
    uint value;
    uint current_value = balance[depositer];
    if ( current_value != 0) {
      value = current_value + msg.value;
    }
    else {
      value = msg.value;
    }
    balance[depositer] = value;
    uint startDate = now;
    emit Layer2Setup(depositer, msg.value, value, startDate);
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
