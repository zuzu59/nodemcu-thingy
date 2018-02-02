# nodemcu-thingy

**THIS PACKAGE IS CURRENTLY UNDER DEVOLOPMENT AND TO BE CONSIDERED PRE-ALPHA**

NodeMCU Thingy is an atom package for "over the air" development of lua scripts for the NodeMCU platform.
It uses a websocket connection to the NodeMCU for communication, so in an ideal world the USB cable should
be needed only to upload the basic firmware and the initial websocket server to the NodeMCU.

Features include:
* Upload of files to the NodeMCU
* Download of files from the NodeMCU
* Interactive Console

*Setup*

*Install firmware*
Flash your esp8266 with a current NodeMCU firmware. I recommend using a firmware built
with Marcel Stoer's excellent online tool.https://nodemcu-build.com/

Select branch master and the following 9 modules: bit crypto file gpio net node tmr uart wifi.

note that crypto and bit are not selected by default.

This builds two versions of the firmware: integer and float. If you do not know which one to use, the integer version is probably ok for you.

https://github.com/espressif/esptool

flash the firmware to the esp8266 with (use the appropriate --port parameter)

esptool.py --port /dev/ttyUSB0 erase_flash
esptool.py --port /dev/ttyUSB0 write_flash -fm dio 0x00000 nodemcu-master*.bin

which should produce an output like:

esptool.py v1.3-dev
Connecting...
Running Cesanta flasher stub...
Erasing flash (this may take a while)...
Erase took 6.6 seconds

esptool.py v1.3-dev
Connecting...
Auto-detected Flash size: 32m
Running Cesanta flasher stub...
Flash params set to 0x0240
Writing 401408 @ 0x0... 401408 (100 %)
Wrote 401408 bytes at 0x0 in 34.8 seconds (92.3 kbit/s)...
Leaving...



*Install websocket server*

cd to .atom/packages/nodemcu-thingy/mcu/
change init.lua to match your wireless LAN

station_cfg.ssid="your ssid"
station_cfg.pwd="yout wifi password"
wifi.sta.sethostname("your hostname for the esp8266")

edit upload.sh and check if the --port value matches your system

bash upload.sh

This takes some time and you should see a lot of lines like
->file.writeline([==[end]==]) -> ok

ending in

->file.flush() -> ok
->file.close() -> ok
--->>> All done <<<---

Restart the esp8266 by pressing the RST button.

After a few seconds you should be able to ping the esp8266

*Use atom package*

Open Atom's Preferences screen (Edit->Preferences or "Ctrl-,"). Open "Packages". Find package "nodemcu-thingy" and click "Settings".
Enter the ip address or hostname of your esp8266 (value from wifi.sta.sethostname()) into the "host" field.

Open the package with "Packages->nodemcu-thingy->Toggle"

Click "Connect".
If everything worked the red "Disconnected" changes to a green "Connected" after a few seconds.
You are now good to go.









*Credits*

The Websocket server on the NodeMCU is a slightly modified version of the one in Creationix's
[nodemcu-webide](https://github.com/creationix/nodemcu-webide)

The Python luatool comes from 4ref0nt@gmail.com  (http://esp8266.ru)
