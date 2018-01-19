'use babel';


const pingInterval=3000
// how many ms to wait for ping reply
const pongOffset=200

//find the position of the given byte in the byteArray
function findByte(byteArray, byte) {
  for(var i=0;i<byteArray.length;i++) {
    if (byteArray[i] == byte) {
      return i;
    }
  }
  return -1;
}

function parseFileList(arraybuffer) {
  var byteArray = new Uint8Array(arraybuffer);
  var dec= new TextDecoder('utf-8');
  var list = []
  var end=0;
  while ( (end = findByte(byteArray,0))>=0) {
     if (end==0){
       byteArray=byteArray.slice(1);
     }
     else{
       var strByte= byteArray.slice(0,end);
       //filename
       var str=dec.decode(strByte)
       byteArray=byteArray.slice(end+1);
       end=findByte(byteArray,0);
       var strByte= byteArray.slice(0,end);
       str = str+" ("+dec.decode(strByte)+")"
       byteArray= byteArray.slice(end);
       list.push(str);
    }
  }
  return list
}

function getFileName(event) {
  var str=event.target.innerText;
  str = str.substring(0,str.indexOf(" "));
  return str
}


import NodemcuThingyView from './nodemcu-thingy-view';
import { CompositeDisposable, Disposable } from 'atom';
export default {
  config:{
    mcu_hostname:{
      title: 'Host',
      description: 'Host name or ip of the nodemcu',
      type: 'string',
      default: '192.168.1.100',
    },
    download_dir:{
      title: 'Download folder',
      description: 'Defines a folder to receive the file, when you click  '+
      '``Download`` in the mcu file view.',
      type: 'string',
      default: 'mcu',
    }
  },
  nodemcuThingyView: null,
  subscriptions: null,
  connection:null,
  pongtime:null,
  pongReceived:null,
  lsRequested:null,
  loadRequested:null,
  downloadFileName:null,

  activate(state) {
    pongReceived=false;
    lsRequested=false;
    loadRequested=false;
    var t=this;
    this.startPing();

    this.nodemcuThingyView = new NodemcuThingyView(state.nodemcuThingyViewState);
    this.nodemcuThingyView.registerConnectButtonHandler(() => this.connectMCU());
    this.nodemcuThingyView.registerRestartButtonHandler(() => this.restartMCU());
    this.nodemcuThingyView.registerListButtonHandler(() => this.list());
    this.nodemcuThingyView.registerCmdLineHandler((event) => this.evalCmd(event));

    atom.confirm ({
  message: "You sure?",
  buttons: ["Cancel", "Delete"]});



    this.subscriptions = new CompositeDisposable(
      // Add an opener for our view.
      atom.workspace.addOpener(uri => {
        if (uri === 'atom://nodemcu-thingy') {
          return new NodemcuThingyView();
        }
      }),

      // Register command that toggles this view
      atom.commands.add('atom-workspace', {
        'nodemcu-thingy:toggle': () => this.toggle(),
        'nodemcu-thingy:upload': () => this.upload(),
        'nodemcu-thingy:list': () => this.list(),
        'nodemcu-thingy:sendTest': () => this.sendTest(),
        'nodemcu-thingy:download': (event) => this.download(event),
        'nodemcu-thingy:delete': (event) => this.delete(event)
      }),

      // Destroy any NodemcuThingyViews when the package is deactivated.
      new Disposable(() => {
        atom.workspace.getPaneItems().forEach(item => {
          if (item instanceof NodemcuThingyView) {
            item.destroy();
          }
        });
      })
    );

  },

  deactivate() {
    this.subscriptions.dispose();
    connection.close();
  },

  serialize() {
    return {
      nodemcuThingyViewState: this.nodemcuThingyView.serialize()
    };
  },
  startPing(){
    var t = this;
    const intervalObj = setInterval(() => {
      if (typeof connection !== 'undefined' && connection !== null && connection.readyState === WebSocket.OPEN ) {
             connection.send("ping");
       }
       //expect reply after a certain time
       setTimeout(() => {
         t.checkPongReceived();
       },pongOffset);
    }, pingInterval);
  },
  getView(){
    return this.nodemcuThingyView
  },
  checkConnectionAndRun(callback) {
    if (typeof connection !== 'undefined' && connection !== null && connection.readyState === WebSocket.OPEN ) {
      callback();
    }
    else {
      this.createConnection(callback);
    }
  } ,
  createConnection(callback) {
    var mcuView=this.nodemcuThingyView;
    mcuView.writeToConsole("connecting...\n");
    connection = new WebSocket('ws://'+atom.config.get('nodemcu-thingy.mcu_hostname'));
    connection.binaryType = "arraybuffer";
    // Log errors
    connection.onerror = function (error) {
      console.log('WebSocket Error ' + error);
      mcuView.writeToConsole('WebSocket Error ' + error);
    };

    connection.onopen = function (e) {
      mcuView.writeToConsole("connected\n");
      callback();
    }

    var fs = require('fs');
    var t=this
    // Log messages from the server
    connection.onmessage = function (e) {
      if (e.data instanceof ArrayBuffer) {
        if (e.data.byteLength==4 ){
          var dec= new TextDecoder('utf-8');
          var str=dec.decode(e.data)
          if (str == "pong") {
              //register reception globally
              pongReceived=true;
          }
        }
        if (!pongReceived){
          if(lsRequested) {
            lsRequested=false;
            var fileList =parseFileList(e.data)
            t.getView().setFileList(fileList);
          }
          if(loadRequested) {
            loadRequested=false;
            var dec= new TextDecoder('utf-8');
            var str=dec.decode(e.data)
            var wstream = fs.createWriteStream('/tmp/'+downloadFileName);
            wstream.write(str);
          }

        }

      }
      else {
        t.getView().writeToConsole(e.data);
      }
    }
  },
  //registered menu methods
  toggle() {
    atom.workspace.toggle('atom://nodemcu-thingy');
  },
  sendTest() {
    this.checkConnectionAndRun(() => {
      enc= new TextEncoder('utf-8');
      var bytes  = enc.encode("print(\"testing:\"..node.heap())")
      connection.send(bytes);
      connection.send('eval:bla');
    });
  },
  download(event) {
    var mcuFilename=getFileName(event);
    //store filename for websocket response
    downloadFileName=mcuFilename;
    loadRequested=true;
    connection.send('load:'+mcuFilename);
  },
  delete(event) {
        alert("Implement me:"+event)
  },
  sendCmd(cmd) {
    enc= new TextEncoder('utf-8');
    var bytes  = enc.encode(cmd)
    connection.send(bytes);
    connection.send('eval:cmd');
  },
  evalCmd(event) {
      switch(event.key) {
        case "ArrowUp":
        //FIXME implement
        break;
        case "ArrowDown":
        //FIXME implement
        break;
        case "Enter":
        var t= this;
        this.checkConnectionAndRun(() => {
          var cmd = t.getView().getCmdLineValue();
          t.sendCmd(cmd);
        });
      break;
    }
  },
  connectMCU(){
    var t= this;
    this.connection=null;
    this.checkConnectionAndRun(() => {
      var cmd = t.getView().getCmdLineValue();
      t.sendCmd('print("...")');
    });
  },
  restartMCU(){
    var t= this;
    this.checkConnectionAndRun(() => {
      var cmd = t.getView().getCmdLineValue();
      t.sendCmd('print("Restarting...")');
      t.sendCmd('node.restart()');
      connection.close();
    });
  },
  list(){
    var t= this;
    this.checkConnectionAndRun(() => {
      lsRequested=true;
      connection.send('ls');
    });
  },
  upload() {
    this.checkConnectionAndRun(() => {
      const editor = atom.workspace.getActiveTextEditor();
      const filePath=editor.getPath();
      if (filePath != null) {
        var fs = require('fs');
        var path = require('path');
        var contents = fs.readFileSync(filePath, { encoding: 'utf-8'});
        enc= new TextEncoder('utf-8');
        var bytes  = enc.encode(contents)
        connection.send(bytes);
        connection.send('save:'+path.basename(filePath));
      }
    });
  },
  checkPongReceived() {
    var s="pongReceived:"+pongReceived;
    //update status
    this.getView().setConnected(pongReceived);
    //reset for next ping
    pongReceived=false;
  }

};
