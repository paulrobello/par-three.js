//fix browsers with no console
self.console = self.console || {
  info: function () {},
  log: function () {},
  debug: function () {},
  warn: function () {},
  error: function () {}
};

var P=function(options){
  options=options||{};
  this.options={
    helpers:false,
    camera:{fov:60,near:0.1,far:1000},
    fog:{type:'FogExp2',color:0x000000,density:0.005},
  };
  
  $.extend(this.options,options);
  
  // used as clock system clock
  this.clock = new THREE.Clock();  
  // used to hold lense flare textures
  this.textureFlare=[];
  // holds all lights
  this.lights=[];
  // holds all scenes
  this.scenes=[];
  // holds all cameras
  this.cameras=[];
  // holds all menus
  this.menus=[];

  // main scene
  this.scene=this.addScene(this.options)
  // main camera
  this.camera=this.addCamera(this.options);
  // main menu
  this.menu=this.addMenu(this.options);
  
  this.renderer=null;
  this.stats=null;  
  
  // this is needed by the call backfunction because self=window when its called
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
P.loadTex=function(options){  
  $.each(P.maps,function(i,map){
    if (options[map]){
      options[map]=THREE.ImageUtils.loadTexture( options[map] );      
      if (options.anisotropy) options[map].anisotropy=options.anisotropy;
      if (options.repeat){
        options[map].repeat.set(options.repeat.s,options.repeat.t);
        options[map].wrapS = options[map].wrapT = THREE.RepeatWrapping;      	
      }
    }
  });
  return options;
};

// diffrent map types used by the loadTex function
P.maps=['map','normalMap','specularMap','bumpMap'];

// math helpers
P.TWO_PI=Math.PI*2;
P.PI2=Math.PI/2;
P.PI4=Math.PI/4;
P.PI8=Math.PI/8;

// used to cause rad values to wrap after 2*PI
P.wrapRad=function(r){
  if (r>=P.TWO_PI) {
    r-=P.TWO_PI;
  }else if (r<=-P.TWO_PI) {
    r+=P.TWO_PI;
  }
  return r;
};

P.prototype={
  addScene:function(options){
    var scene=new THREE.Scene();  
    if (options.fog){
      switch (options.fog.type){
        case 'Fog':scene.fog=new THREE.Fog(options.fog.color, options.fog.near, options.fog.far);break;
        case 'FogExp2':scene.fog=new THREE.FogExp2(options.fog.color, options.fog.density);break;        
        default: scene.fog=null;
      }
    }
    this.scenes.push(scene);
    return scene;
  },
  addCamera:function(options){
    var camera = new THREE.PerspectiveCamera( 
      options.camera.fov, 
      window.innerWidth / window.innerHeight, 
      options.camera.near, options.camera.far 
    );
    if (options.helpers){
      var c_helper= new THREE.CameraHelper(camera);
      this.scene.add(c_helper);
    }  
    
    this.cameras.push(camera);
    return camera;
  },  
  addMenu:function(options){
    var menu=new P.Menu(options);
    this.menus.push(menu);
    return menu;
  },  
  initRenderer:function(hex,options){
    var o={
      antialias:false,
      shadowMapEnabled:false,
      shadowMapSoft:false,
      preserveDrawingBuffer:false
    };
    $.extend(o,options);
    var renderer = new THREE.WebGLRenderer({
      antialias		  : o.antialias,	// to get smoother output
      preserveDrawingBuffer : o.preserveDrawingBuffer	// to allow screenshot
    });
    renderer.shadowMapEnabled = o.shadowMapEnabled;
    renderer.shadowMapSoft = o.shadowMapSoft;
    renderer.setClearColorHex( hex, 1 );
    
    this.renderer=renderer;    
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
  // takes arguments of ether 
  // object with r,g,b members
  // r,g,b
  // r which will apply r to g and b also
  addAmbientLight:function(hex){
    // hex
    var light = new THREE.AmbientLight( hex==undefined ? 0x555555 : hex );
    this.scene.add( light );
    this.lights.push(light);    
    return light;  
  },  
  addPointLight:function( hex, pos, flare ) {
    var o={
      intensity:1,
      distance:0,
      flare:false
    };
    $.extend(o,options);
  
    var light = new THREE.PointLight( hex==undefined ? 0xffffff : hex, o.intensity, o.distance );
    light.position.set( pos.x, pos.y, pos.z );
    this.scene.add( light );
    
    if (o.flare){
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
    
    if (this.options.helpers){
      var helper = new THREE.PointLightHelper(light,0.1);
      this.scene.add(sp_helper);    
    }
    this.lights.push(light);
    return light;
  },
  addDirectionalLight:function( hex, dir, options) {
    var o={
      intensity:1
    }
    $.extend(o,options);
    
    var light = new THREE.DirectionalLight( hex==undefined ? 0xffffff : hex, o.intensity );
    light.position.set( dir.x, dir.y, dir.z );
    this.scene.add( light );

    if (this.options.helpers){
      var helper = new THREE.DirectionalLightHelper(light,0.1);
      this.scene.add(sp_helper);                
    }
    this.lights.push(light);    
    return light;
  },
  addSpotLight:function(hex, pos, tar, options ) {
    var o={
      intensity:1,
      distance:0,
      angle:P.PI2,
      exponent:10,
      flare:false,
      shadow:false,
      shadowMapWidth:1024,
      shadowMapHeight:1024
    }
    $.extend(o,options);

    var light = new THREE.SpotLight( 
      hex==undefined ? 0xffffff : hex, 
      o.intensity, 
      o.distance, 
      o.angle, 
      o.exponent
    );
    light.position.set( pos.x, pos.y, pos.z );
    light.target.position.set(tar.x, tar.y, tar.z);    
    this.scene.add( light );    
    if (o.shadow){
      light.castShadow = true;
      light.shadowDarkness = 0.5;
      if (this.options.helpers) light.shadowCameraVisible = true;
      light.shadowMapWidth = o.shadowMapWidth; 
      light.shadowMapHeight = o.shadowMapHeight;  
      light.shadowCameraNear = this.options.camera.near; 
      light.shadowCameraFar = this.options.camera.far; 
      light.shadowCameraFov = this.options.camera.fov;
      //light.shadowCameraRight     =  5;
      //light.shadowCameraLeft      = -5;
      //light.shadowCameraTop       =  5;
      //light.shadowCameraBottom    = -5;
    }

    if (o.flare){
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

    if (this.options.helpers){
      var helper = new THREE.SpotLightHelper(light,0.1);
      this.scene.add(helper);
    }
    this.lights.push(light);    
    return light;
  },
  // used to update flare layout if camera / light moves
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
  // load flare textures
  initFlare:function(){
    this.textureFlare[0]= THREE.ImageUtils.loadTexture( "images/lensflare/lensflare0.png" );
    this.textureFlare[1]= THREE.ImageUtils.loadTexture( "images/lensflare/lensflare2.png" );
    this.textureFlare[2]= THREE.ImageUtils.loadTexture( "images/lensflare/lensflare3.png" );
  },
  initControls:function(obj){
    var controls = new P.Controls({camera:obj}); // Handles camera control
    this.controls=controls;
    this.scene.add(controls.getObject());
    return controls;
  },
  updateControls:function(delta){
    if (this.controls) this.controls.update(delta); // Move dummy  
  },
};


// functions below are ready
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
