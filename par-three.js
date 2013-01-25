self.console = self.console || {
  info: function () {},
  log: function () {},
  debug: function () {},
  warn: function () {},
  error: function () {}
};

var P=function(settings){
  settings=settings||{};
  this.settings=settings;  
  this.clock = new THREE.Clock();  
  this.helpers=false;  
  this.textureFlare=[];
  this.lights=[];
  this.scene=new THREE.Scene();  
//  this.scene.fog=new THREE.FogExp2(0x000000, 0.1);  
  this.camera=new THREE.PerspectiveCamera( 60, window.innerWidth / window.innerHeight, 0.1, 10000 );
  if (this.helpers){
    var c_helper= new THREE.CameraHelper(this.camera);
    this.scene.add(c_helper);
  }  
  this.renderer=null;
  this.stats=null;  
  var scope = this;
  this.onWindowResize=function() {
    if (scope.camera){
      scope.camera.aspect = window.innerWidth / window.innerHeight;
      scope.camera.updateProjectionMatrix();
    }
    if (scope.renderer){
      scope.renderer.setSize( window.innerWidth-1, window.innerHeight-1 );
    }
  };      
  window.addEventListener( 'resize', this.onWindowResize, false );
};
P.loadTex=function(settings){
  var maps=['map','normalMap','specularMap','bumpMap'];
  $.each(maps,function(i,map){
    if (settings[map]){
      settings[map]=THREE.ImageUtils.loadTexture( settings[map] );      
      if (settings.anisotropy) settings[map].anisotropy=settings.anisotropy;
      if (settings.repeat){
        settings[map].repeat.set(settings.repeat.s,settings.repeat.t);
        settings[map].wrapS = settings[map].wrapT = THREE.RepeatWrapping;      	
      }
    }
  });
  return settings;
};
P.TWO_PI=Math.PI*2;
P.PI2=Math.PI/2;
P.PI4=Math.PI/4;
P.PI8=Math.PI/4;

P.wrapRad=function(r){
  if (r>=P.TWO_PI) r-=P.TWO_PI;
  return r;
};

P.prototype={
  initRenderer:function(clearColor,antialias,shadowMap){
    this.renderer = new THREE.WebGLRenderer({
      antialias		  : antialias,	// to get smoother output
      preserveDrawingBuffer : false	// to allow screenshot
    });
    this.renderer.shadowMapEnabled = shadowMap;
    this.renderer.shadowMapSoft = shadowMap;
    this.renderer.setClearColorHex( clearColor, 1 );
    
    this.onWindowResize();
    $("#render-container").append( this.renderer.domElement );  
  },
  addStats:function(dom){
    dom=dom||$("<div></div>");
    stats = new Stats();
    stats.domElement.style.position = 'absolute';
    stats.domElement.style.bottom	= '1px';
    this.stats=stats;
    $(dom).append( stats.domElement );
    return stats;
  },
  addAmbientLight:function(r,g,b){
    // hex
    var light = new THREE.AmbientLight( 0xffffff );    
    light.color.setRGB( r, g, b );
    this.scene.add( light );
    this.lights.push(light);    
    return light;  
  },  
  addPointLight:function( r, g, b, x, y, z, flare ) {
    // hex, intensity, distance
    var light = new THREE.PointLight( 0xffffff, 2.5, 4500 );
    light.position.set( x, y, z );
    light.color.setRGB( r, g, b );
    this.scene.add( light );
    
    if (flare){
      if (!this.textureFlare.length) this.initFlare();

      var flareColor = new THREE.Color( 0xffffff );
      flareColor.copy( light.color );
      THREE.ColorUtils.adjustHSV( flareColor, 0, -0.5, 0.5 );

      var lensFlare = new THREE.LensFlare( this.textureFlare[0], 700, 0.0, THREE.AdditiveBlending, flareColor );

      lensFlare.add( this.textureFlare[1], 512, 0.0, THREE.AdditiveBlending );
      lensFlare.add( this.textureFlare[1], 512, 0.0, THREE.AdditiveBlending );
      lensFlare.add( this.textureFlare[1], 512, 0.0, THREE.AdditiveBlending );

      lensFlare.add( this.textureFlare[2], 60, 0.6, THREE.AdditiveBlending );
      lensFlare.add( this.textureFlare[2], 70, 0.7, THREE.AdditiveBlending );
      lensFlare.add( this.textureFlare[2], 120, 0.9, THREE.AdditiveBlending );
      lensFlare.add( this.textureFlare[2], 70, 1.0, THREE.AdditiveBlending );

      lensFlare.customUpdateCallback = this.lensFlareUpdateCallback;
      lensFlare.position = light.position;

      this.scene.add( lensFlare );
    }
    
    if (this.helpers){
      var helper = new THREE.PointLightHelper(light,0.1);
      this.scene.add(sp_helper);    
    }
    this.lights.push(light);
    return light;
  },
  addDirectionalLight:function( r, g, b, x, y, z) {
    // hex, intensity
    var light = new THREE.DirectionalLight( 0xffffff, 1.5 );
    light.position.set( x, y, z );
    light.color.setRGB( r, g, b );
    this.scene.add( light );

    if (this.helpers){
      var helper = new THREE.DirectionalLightHelper(light,0.1);
      this.scene.add(sp_helper);                
    }
    this.lights.push(light);    
    return light;
  },
  addSpotLight:function(r, g, b, x, y, z, tx, ty, tz, shadow, flare ) {
    //hex, intensity, distance, angle, exponent
    var light = new THREE.SpotLight( 0xffffff, 2.5);
    light.position.set( x, y, z );
    light.target.position.set(tx, ty, tz);    
    light.color.setRGB( r, g, b );
    this.scene.add( light );    
    if (shadow){
      light.castShadow = true;
      light.shadowDarkness = 0.5;
      if (this.helpers) light.shadowCameraVisible = true;
      light.shadowMapWidth = 1024; 
      light.shadowMapHeight = 1024;  
      light.shadowCameraNear = 0.01; 
      light.shadowCameraFar = 100; 
      light.shadowCameraFov = 30;
  //  	light.shadowCameraRight     =  5;
  //  	light.shadowCameraLeft      = -5;
  //  	light.shadowCameraTop       =  5;
  //  	light.shadowCameraBottom    = -5;
    }

    if (flare){
      if (!this.textureFlare.length) this.initFlare();
    
      var flareColor = new THREE.Color( 0xffffff );
      flareColor.copy( light.color );
      THREE.ColorUtils.adjustHSV( flareColor, 0, -0.5, 0.5 );

      var lensFlare = new THREE.LensFlare( this.textureFlare[0], 700, 0.0, THREE.AdditiveBlending, flareColor );
      lensFlare.add( this.textureFlare[1], 512, 0.0, THREE.AdditiveBlending );
      lensFlare.add( this.textureFlare[1], 512, 0.0, THREE.AdditiveBlending );
      lensFlare.add( this.textureFlare[1], 512, 0.0, THREE.AdditiveBlending );

      lensFlare.add( this.textureFlare[2], 60, 0.6, THREE.AdditiveBlending );
      lensFlare.add( this.textureFlare[2], 70, 0.7, THREE.AdditiveBlending );
      lensFlare.add( this.textureFlare[2], 120, 0.9, THREE.AdditiveBlending );
      lensFlare.add( this.textureFlare[2], 70, 1.0, THREE.AdditiveBlending );

      lensFlare.customUpdateCallback = this.lensFlareUpdateCallback;
      lensFlare.position = light.position;

      this.scene.add( lensFlare );
    }

    if (this.helpers){
      var helper = new THREE.SpotLightHelper(light,0.1);
      this.scene.add(helper);
    }
    this.lights.push(light);    
    return light;
  },
  lensFlareUpdateCallback:function( object ) {
    var f, fl = object.lensFlares.length;
    var flare;
    var vecX = -object.positionScreen.x * 2;
    var vecY = -object.positionScreen.y * 2;

    for( f = 0; f < fl; f++ ) {
      flare = object.lensFlares[ f ];
      flare.x = object.positionScreen.x + vecX * flare.distance;
      flare.y = object.positionScreen.y + vecY * flare.distance;
      flare.rotation = 0;
    }

    object.lensFlares[ 1 ].y += 0.025;
    object.lensFlares[ 2 ].rotation = object.positionScreen.x * 0.5 + Math.PI/2;
  },
  initFlare:function(){
    this.textureFlare[0]= THREE.ImageUtils.loadTexture( "images/lensflare/lensflare0.png" );
    this.textureFlare[1]= THREE.ImageUtils.loadTexture( "images/lensflare/lensflare2.png" );
    this.textureFlare[2]= THREE.ImageUtils.loadTexture( "images/lensflare/lensflare3.png" );
  },
  initControls:function(obj){
    var controls = new P.Controls({camera:obj}); // Handles camera control
    controls.enabled=true;
//    controls.movementSpeed = MOVESPEED; // How fast the player can walk around
//    controls.rotateSpeed = 0.1;
//    controls.autoForward=false;
//    controls.lookSpeed = LOOKSPEED; // How fast the player can look around with the mouse
//    controls.dragToLook=true;  
    this.controls=controls;
    controls.getObject().position.y=0;
    this.scene.add(controls.getObject());
    return controls;
  },
  updateControls:function(delta){
    this.controls.update(delta); // Move dummy  
  },
};

function getDir(obj){
  var pLocal = new THREE.Vector3( 0, 0, -1 );
  //Now transform that point into world space:

  var pWorld = obj.matrixWorld.multiplyVector3( pLocal );
  //You can now construct the desired direction vector:

  var dir = pWorld.subSelf( obj.position ).normalize();  
  return dir;
}
function keepUp(obj){
  var up = new TREE.Vector3(0,1,0);
  var dir = getDir(obj);
  var right = new THREE.Vector3().cross( dir, up ).normalize(); 	
}
    
function lookAtAndOrient(objectToAdjust,pointToLookAt,pointToOrientXTowards) {
  // First we look at the pointToLookAt
  // set the object's up vector
  var v1 = pointToOrientXTowards.position.clone().subSelf( objectToAdjust.position ).normalize();
  var v2 = pointToLookAt.clone().subSelf( objectToAdjust.position ).normalize();
  var v3 = new THREE.Vector3().cross( v1, v2 ).normalize();
  objectToAdjust.up.copy( v3 );
  
  objectToAdjust.lookAt(pointToLookAt);

  // QUESTION HERE: 
  // Now, we need to rotate the object around its local Z axis such that its X axis
  // lies on the plane defined by objectToAdjust.position, pointToLookAt and pointToOrientXTowards
  // objectToAdjust.rotation.z = ??;
}    
