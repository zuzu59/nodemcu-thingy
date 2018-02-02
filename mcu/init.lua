wifi.setmode(wifi.STATIONAP)
station_cfg={}

station_cfg.ssid="your ssid"
station_cfg.pwd="yout wifi password"
wifi.sta.sethostname("your hostname for the esp8266")

wifi.sta.config(station_cfg)
wifi.sta.connect()

tmr.alarm(0, 1000, 1, function ()
  local ip = wifi.sta.getip()
  if ip then
    tmr.stop(0)
    print(ip)
  end
end)

dofile("websocket.lc")
dofile("main.lc")
if file.exists("userinit.lua") then
  dofile("userinit.lua")
else
  print("userinit.lua not found")
end
