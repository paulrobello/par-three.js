P.Controls = function ( settings ) {
  settings=settings||{camera:null,speed:10};
  settings.speed=settings.speed||10;
  settings.invertY=true;
  settings.invertY = settings.invertY ? -1 : 1;
  settings.enabled=settings.enabled==undefined ? true : settings.enabled;
  settings.showControls=settings.showControls || true;
  this.settings=settings;
  
  this.enabled = settings.enabled;    
  
//  this.gamepad = new P.Gamepad(settings);

  this.pitchObject = new THREE.Object3D();
  this.pitchObject.add( settings.camera );

  this.yawObject = new THREE.Object3D();
  this.yawObject.add( this.pitchObject );

  this.velocity = new THREE.Vector3(0,0,0);

  this.limit = Math.PI / 4;

  this.dc=0;

  var scope = this;
  
  var onMouseMove=function ( event ) {
    if ( scope.enabled === false || !scope.dc) return;
    var movementX = event.movementX || event.mozMovementX || event.webkitMovementX || 0;
    var movementY = event.movementY || event.mozMovementY || event.webkitMovementY || 0;

    if (movementX) scope.yawObject.rotation.y   -= movementX * 0.002;
    if (movementY) scope.pitchObject.rotation.x -= movementY * 0.002;
    scope.limitLook();
    
  };
  var onMouseDown=function ( event ) {
    if ( scope.enabled === false ) return;
    scope.dc++;
  };
  var onMouseUp=function ( event ) {
    if ( scope.enabled === false ) return;
    scope.dc--;
  };

  var onKeyDown= function ( event ) {
    switch ( event.keyCode ) {
      case 38: // up
      case 87: // w
        scope.velocity.z=-1;break;
      case 37: // left
      case 65: // a
        scope.velocity.x=-1; break;
      case 40: // down
      case 83: // s
        scope.velocity.z=1;break;
      case 39: // right
      case 68: // d
        scope.velocity.x=1;break;
      case 82: // r
        scope.velocity.y=1;break;
      case 70: // f
        scope.velocity.y=-1;break;
    }
  };
  var onKeyUp=function ( event ) {
    switch( event.keyCode ) {
	case 38: // up
	case 87: // w
  	  scope.velocity.z=0;break;
	case 37: // left
	case 65: // a
	  scope.velocity.x=0;break;
	case 40: // down
	case 83: // a
	  scope.velocity.z=0;break;
	case 39: // right
	case 68: // d
	  scope.velocity.x=0;break;
	case 82: // r
	  scope.velocity.y=0;break;
	case 70: // f
	  scope.velocity.y=0;break;
//			default:
//				console.log(event.keyCode);
    
    }
  };

 this.names = [
            'leftStick',
            'rightStick',
            'faceButton0',
            'faceButton1',
            'faceButton2',
            'faceButton3',
            'leftShoulder0',
            'rightShoulder0',
            'leftShoulder1',
            'rightShoulder1',
            'select',
            'start',
            'leftStickButton',
            'rightStickButton',
            'dpadUp',
            'dpadDown',
            'dpadLeft',
            'dpadRight'
        ];

 this.names_xbox = {
            'leftStick':'LeftStick',
            'rightStick':'RightStick',
            'faceButton0':'A',
            'faceButton1':'B',
            'faceButton2':'X',
            'faceButton3':'Y',
            'leftShoulder0':'LeftShoulder',
            'rightShoulder0':'RightShoulder',
            'leftShoulder1':'LeftTrigger',
            'rightShoulder1':'RightTrigger',
            'select':'Select',
            'start':'Start',
            'leftStickButton':'LeftStickButton',
            'rightStickButton':'RightStickButton',
            'dpadUp':'DPadUp',
            'dpadDown':'DPadDown',
            'dpadLeft':'DPadLeft',
            'dpadRight':'DPadRight'
        };
  
  document.addEventListener( 'mousemove', onMouseMove, false );
  document.addEventListener( 'mousedown', onMouseDown, false );
  document.addEventListener( 'mouseup', onMouseUp, false );
  document.addEventListener( 'keydown', onKeyDown, false );
  document.addEventListener( 'keyup', onKeyUp, false ); 
  this.createDomElements();
};

P.Controls.prototype={  
 createDomElements:function() {
   if (this.settings.showControls){
     var root = document.getElementById('gamepads');
      for (var i = 0; i < 1; ++i) {
          var pad = document.createElement('div');
          pad.id = 'pad' + i;
          root.appendChild(pad);
          pad.style.display = 'none';

          var title = document.createElement('h2');
          title.id = 'pad' + i + '_title';
          pad.appendChild(title);

          for (var j = 0; j < 2; ++j) {
              var stickouter = document.createElement('div');
              stickouter.style.width = '256px';
              stickouter.style.height = '256px';
              stickouter.style.border = '1px dotted #888';
              stickouter.style.margin = '1em';
              stickouter.style.cssFloat = 'left';
              stickouter.style.marginTop = '32px';
              var stickimg = document.createElement('img');
              stickimg.id = 'pad' + i + '_' + this.names[j];
              stickimg.style.position = 'relative';
              stickouter.appendChild(stickimg);
              pad.appendChild(stickouter);
          }

          for (var j = 2; j < this.names.length; ++j) {
              var name = this.names[j];
              if ((j - 2) % 4 == 0)
                  pad.appendChild(document.createElement('br'));
              var item = document.createElement('img');
              item.style.width = '64px';
              item.id = 'pad' + i + '_' + name;
              pad.appendChild(item);
          }
      }
    }
  },
  limitLook: function (){
    this.pitchObject.rotation.x = Math.max( -this.limit, Math.min( this.limit, this.pitchObject.rotation.x ) );  
  },
  getObject: function () {
    return this.yawObject;
  },
  getPad: function(num){
    num=num||0;
    var pads = Gamepad.getStates();
    if (!pads || !pads.length || num >= pads.length) return null;
    return pads[num];    
  },  
  bindButton: function(name,state,cbf){
    $( document ).bind( 'button', function (e, data) {
      if (data.name_maped!=name) return;
      if (state && data.state!=state) return;
      cbf(e,data);
    });
  },
  update: function ( delta ) {
    if ( this.enabled === false ) return;
    delta *= this.settings.speed;

    if (this.velocity.x) this.yawObject.translateX( this.velocity.x * delta);
    if (this.velocity.y) this.yawObject.translateY( this.velocity.y * delta); 
    if (this.velocity.z) this.yawObject.translateZ( this.velocity.z * delta);

      var pad = this.getPad(0);
      
      var i = 0;
      if (pad) {
        
        if (this.settings.showControls){
          document.getElementById('pad' + i).style.display = '';
          document.getElementById('pad' + i + '_title').innerHTML = pad.name;
          for (var j = 0; j < this.names.length; ++j) {
            var name = this.names[j];
            var buttonDom = document.getElementById('pad' + i + '_' + this.names[j]);
            buttonDom.src = pad.images[name];
            if (j >= 2) buttonDom.style.opacity = pad[name] / 0.8 + 0.2;
          }
          var leftStick = document.getElementById('pad' + i + '_leftStick');
          var rightStick = document.getElementById('pad' + i + '_rightStick');
          var imgSize = 32;
          leftStick.style.left = Math.floor((pad.leftStickX + 1.0) / 2.0 * 256 - imgSize) + 'px';
          leftStick.style.top = Math.floor((pad.leftStickY + 1.0) / 2.0 * 256 - imgSize) + 'px';
          rightStick.style.left = Math.floor((pad.rightStickX + 1.0) / 2.0 * 256 - imgSize) + 'px';
          rightStick.style.top = Math.floor((pad.rightStickY + 1.0) / 2.0 * 256 - imgSize) + 'px';
        }
        
        if (Math.abs(pad.rightStickY)>0.25) this.pitchObject.rotation.x+=pad.rightStickY*delta*0.25*this.settings.invertY;
        if (Math.abs(pad.rightStickX)>0.25) this.yawObject.rotation.y+=pad.rightStickX*delta*-0.25;
        this.limitLook();    
         
        if (Math.abs(pad.leftStickY)>0.25) this.yawObject.translateZ(pad.leftStickY*delta*this.settings.speed*0.1);
        if (Math.abs(pad.leftStickX)>0.25) this.yawObject.translateX(pad.leftStickX*delta*this.settings.speed*0.1);

        if (Math.abs(pad.leftShoulder1)>0.25) this.yawObject.translateY(pad.leftShoulder1*delta*this.settings.speed*-0.1);
        if (Math.abs(pad.rightShoulder1)>0.25) this.yawObject.translateY(pad.rightShoulder1*delta*this.settings.speed*0.1);
        
        
        var pad_old=this.pad_old;
        if (pad_old){
          for (var j = 0; j < this.names.length; ++j) {
            var name = this.names[j];
            if (name!="start" && name!="select" && name.indexOf("Button")<0 && name.indexOf("Shoulder0")<0) continue;
            if (pad[name]!=pad_old[name]){
              data={
                name_org:name,
                name_maped:this.names_xbox[name],
                state:pad[name]>0.25 ? 'down' : 'up',
                value:pad[name]
              };
              $( document ).trigger( 'button', data );
            }
          }
        }
        this.pad_old= jQuery.extend({}, pad);
      } else {
        document.getElementById('pad' + i).style.display = 'none';
      }            
      
  }
};