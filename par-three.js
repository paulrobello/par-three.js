//fix browsers with no console
self.console = self.console || {
  info: function () {},
  log: function () {},
  debug: function () {},
  warn: function () {},
  error: function () {}
};

var P=function(options){
  this.options={
    helpers:false,
    
    camera:{fov:60,near:1,far:1000},
    fog:{type:'FogExp2',color:0x000000,density:0.005},
    
    ambientLight:{color:0x555555},
    pointLight:{
      color:0xFFFFFF,
      intensity:1,
      distance:0,
      pos:{x:10,y:10,z:10},
      flare:false,
    },    
    directionalLight:{
      color:0xFFFFFF,
      intensity:1,
      dir:{x:10,y:10,z:10}
    },    
    spotLight:{
      color:0xFFFFFF,
      intensity:1,
      distance:0,
      angle:P.PI2,
      exponent:50,
      pos:{x:5,y:5,z:5},
      target:{x:0,y:0,z:0},
      flare:false,
      shadow:false,
      shadowDarkness:0.5,
      shadowMapWidth:1024,
      shadowMapHeight:1024
    },
    
    renderer:{
      clearColor:0x000000,
      clearAlpha:1,
      antialias:false,
      shadowMapEnabled:false,
      shadowMapSoft:false,
      preserveDrawingBuffer:false // true to allow screenshot      
    },
    stats:{
      dom:"<div></div>",
      domElement:{
        style:{
          position:'absolute',
          bottom:'0px'
        }
      }
    },
    sounds:{
      menu:{
        menu_open:"",
        menu_close"",
        menu_click:"affirm_bass",        
        item_click:"affirm_blip"
      }
    }
  };
  
  $.extend(true,this.options,options);
  
  // used as clock system clock
  this.clock = new THREE.Clock();  
  // used to hold lense flare textures
  this.textureFlare=[];
  // holds all scenes
  this.scenes=[];
  // holds all cameras
  this.cameras=[];
  // holds all renderers
  this.renderers=[];
  // holds all menus
  this.menus=[];

  // main scene
  this.scene=this.addScene(this.options)
  this.lights=this.scene.__lights;
  this.objects=this.scene.__objects;
  
  // main camera
  this.camera=this.addCamera(this.options);
  // main menu
  this.menu=this.addMenu(this.options);
  
  this.renderer=null;
  this.stats=null;  
  
  this.sound=new P.Sound();
  
  window.addEventListener( 'resize', this.onWindowResize.bind(this), false );
};

// diffrent map types used by the loadTex function
P.maps=['map','normalMap','specularMap','bumpMap'];

// static helper function for loading 1 or more textures in a set
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


// math helpers
P.TWO_PI=Math.PI*2;
P.PI2=Math.PI/2;
P.PI4=Math.PI/4;
P.PI8=Math.PI/8;

// used to cause rad values to wrap after +-2*PI
P.wrapRad=function(r){
  if (r>=P.TWO_PI) {
    r-=P.TWO_PI;
  }else if (r<=-P.TWO_PI) {
    r+=P.TWO_PI;
  }
  return r;
};

P.prototype={
  // correct aspect ratio and projection matrix when window size changes
  onWindowResize:function() {
    if (this.camera){
      this.camera.aspect = window.innerWidth / window.innerHeight;
      this.camera.updateProjectionMatrix();
    }
    if (this.renderer){
      this.renderer.setSize( window.innerWidth, window.innerHeight );
    }
  },
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
    var that=this;
    
    $(".piemenu").each(function(){
      options.element=this;
      var menu=new P.Menu(options);
      $(this).data("menu",menu);
      that.menus.push(menu);
    });
    if (that.menus.length) return that.menus[that.menus.length-1];
    return null;
  },  
  initRenderer:function(options){
    var o = $.extend(true,{},this.options.renderer,options);
    var renderer = $.extend(new THREE.WebGLRenderer(o),o);
    this.renderer=renderer;    
    $("#render-container").append( this.renderer.domElement );      
    this.onWindowResize();
  },
  addStats:function(options){
    var o=$.extend(true,{},this.options.stats,options);
    stats = new Stats();
    $(stats.domElement).css(o.domElement.style);
    this.stats=stats;
    $(o.dom).append( stats.domElement );
    return stats;
  },
  // used by positional lights to generate lense flare if enabled
  buildFlare:function(light,flareColor){
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
    return lensFlare;  
  },  
  addAmbientLight:function(options){
    var o = $.extend(true,{},this.options.ambientLight,options);
    var light = new THREE.AmbientLight( o.color );
    this.scene.add( light );
    return light;  
  },  
  addPointLight:function( options ) {
    var o = $.extend(true,{},this.options.pointLight,options);
  
    var light = new THREE.PointLight( o.color, o.intensity, o.distance );
    light.position.set( o.pos.x, o.pos.y, o.pos.z );
    this.scene.add( light );
    
    if (o.flare){
      if (!this.textureFlare.length) this.initFlare();

      var flareColor = new THREE.Color( 0xffffff );
      flareColor.copy( light.color );
      flareColor.offsetHSL( 0, -0.5, 0.5 );
      this.scene.add( this.buildFlare(light,flareColor) );
    }
    
    if (this.options.helpers){
      var helper = new THREE.PointLightHelper(light,0.1);
      this.scene.add(sp_helper);    
    }
    return light;
  },
  addDirectionalLight:function(options) {
    var o = $.extend(true,this.options.directinalLight,options);
    
    var light = new THREE.DirectionalLight( o.color, o.intensity );
    light.position.set( o.dir.x, o.dir.y, o.dir.z );
    this.scene.add( light );

    if (this.options.helpers){
      var helper = new THREE.DirectionalLightHelper(light,0.1);
      this.scene.add(sp_helper);                
    }
    return light;
  },
  addSpotLight:function(options) {
    var o = $.extend(true,{},this.options.spotLight,options);

    var light = new THREE.SpotLight( 
      o.color,
      o.intensity, 
      o.distance, 
      o.angle, 
      o.exponent
    );
    light.position.set( o.pos.x, o.pos.y, o.pos.z );
    light.target.position.set(o.target.x, o.target.y, o.target.z);    
    this.scene.add( light );    
    if (o.shadow){
      light.castShadow = true;
      light.shadowDarkness = o.shadowDarkness;
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
      flareColor.offsetHSL( 0, -0.5, 0.5 );

      this.scene.add( this.buildFlare(light,flareColor) );
    }

    if (this.options.helpers){
      var helper = new THREE.SpotLightHelper(light,0.1);
      this.scene.add(helper);
    }
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
  update:function(delta){
    this.updateControls(delta);
    if (this.stats) this.stats.update();
    var o = this.objects;
    var i = o.length;
    while (i--){
      var ob=o[i];
      if (ob.onUpdate) ob.onUpdate(delta);
    }
  },
  // update control object based on delta time
  updateControls:function(delta){
    if (this.controls) this.controls.update(delta); 
  },
  // used to capture pointer if browser supports it and user allows it
  setupPointerLock:function(element) {
    var self = this
    element = element || document.body
    if (typeof element !== 'object') element = document.querySelector(element)
    var pointer = this.pointer = interact(element)
    if (!pointer.pointerAvailable()) this.pointerLockDisabled = true
    pointer.on('attain', function(movements) {
      self.controls.enabled = true;
      movements.pipe(self.controls)
    });
    pointer.on('release', function() {
      self.controls.enabled = false;
    });
    pointer.on('error', function() {
      // user denied pointer lock OR it's not available
      self.pointerLockDisabled = true;
      console.error('pointerlock error');
    });
  },
  // todo
  intersectAllMeshes:function(start, direction, maxDistance){
    var hits=[]
    $.each(this.objects,function(i,o){
      if ( o.boundingSphere === null ) o.computeBoundingSphere();
      
    });
    return hits;
  },
  raycast:function(maxDistance) {
    var start = this.controls.getObject().position.clone();
    var direction = this.camera.matrixWorld.multiplyVector3(new THREE.Vector3(0,0,-1));
    var intersects = this.intersectAllMeshes(start, direction, maxDistance);
    return intersects;
  },
  requestPointerLock:function(element) {
    if (!this.pointer) this.setupPointerLock(element);
    this.pointer.request();
  },
  // todo
  notCapable:function() {
    if( !Detector().webgl ) {
      var wrapper = document.createElement('div');
      wrapper.className = "errorMessage";
      var a = document.createElement('a');
      a.title = "You need WebGL and Pointer Lock (Chrome 23/Firefox 14) to play this game. Click here for more information.";
      a.innerHTML = a.title;
      a.href = "http://get.webgl.org";
      wrapper.appendChild(a);
      this.element = wrapper;
      return true;
    }
    return false;
  }  
};


// functions below are not ready
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
