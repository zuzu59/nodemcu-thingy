# nodemcu-thingy

**THIS PLUGIN IS CURRENTLY UNDER DEVOLOPMENT AND TO BE CONSIDERED PRE-ALPHA**
 
NodeMCU Thingy is an atom plugin for "over the air" development of lua scripts for the NodeMCU platform.
It uses a WebSocket connection to the NodeMCU for communication, so in an ideal world the USB cable should 
be needed only to upload the basic firmware and the initial websocket server to the NodeMCU.

Features include:
* Upload of files to the NodeMCU
* Download of files from the NodeMCU
* Interactive Console
 
The Websocket Server on the NodeMCU is a slightly modified version of the one in Creationix's
[nodemcu-webide](https://github.com/creationix/nodemcu-webide)
 
