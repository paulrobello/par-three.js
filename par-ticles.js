P.ParTicles = function(settings){
  settings=settings || {};
  settings.ps=this;
  settings.particlesLength=settings.particlesLength || 1000;
  settings.size=settings.size || 0.25;
  settings.palette_name=settings.palette_name||'fire';
  
  this._settings=settings;
  this._pool = {
      __pools: [],
      // Get a new Vector
      get: function() {
        if ( this.__pools.length > 0 ) {
          return this.__pools.pop();
        }
        console.log( "pool ran out!" )
        return null;
      },
      // Release a vector back into the pool
      add: function( v ) {
        this.__pools.push( v );
      }
  };
  
  this.palettes={
      white:[
      new THREE.Color(0xffffff)
      ],
      fire:[
      new THREE.Color(0x860200),
      new THREE.Color(0xcc2200),
      new THREE.Color(0xe24800),
      new THREE.Color(0xff7701),
      new THREE.Color(0xff9c00),
      new THREE.Color(0xffcd2e),
      new THREE.Color(0x000000)
    ],
    water:[
      new THREE.Color(0x05273f),
      new THREE.Color(0x053c55),
      new THREE.Color(0x026493),
      new THREE.Color(0x3f9899),
      new THREE.Color(0x74cdc1),
      new THREE.Color(0x999999),
      new THREE.Color(0x000000)
    ],        
  };
  this.palette_name=settings.palette_name;
  this._colors=settings.colors || this.palettes[settings.palette_name];
  this.size=settings.size;
  
  this._particles = new THREE.Geometry();
  var particles = this._particles;
  var pool=this._pool;
  
  // Create pools of vectors  
  for ( var i = 0; i < settings.particlesLength; i ++ ) {
    particles.vertices.push( new THREE.Vector3() );
    particles.colors[i]= new THREE.Color(0xffffff);
    pool.add( i );    
  }

  if (!settings.sprite_url){
    var canvas  = this.generatePointSprite(255,255,255);
    if (settings.showPointSprite) $(settings.showPointSprite).append(canvas);
    this._texture = new THREE.Texture( canvas );
  }else{
    this._texture=THREE.ImageUtils.loadTexture(settings.sprite_url);
  }  
  
  this._texture.needsUpdate = true;

  this._material = new THREE.ParticleBasicMaterial( {
    size:		this.size,
    map:		this._texture,
    blending: 		THREE.AdditiveBlending,
    vertexColors: 	true,
    depthWrite:		false,
    transparent:	true
  });


  this._cloud = new THREE.ParticleSystem( this._particles, this._material );
  this._cloud.dynamic = true;
  //this._cloud.sortParticles = true;

  var vertices = this._cloud.geometry.vertices;
  for( var v = 0; v < vertices.length; v ++ ) {
    vertices[ v ].set( Number.POSITIVE_INFINITY, Number.POSITIVE_INFINITY, Number.POSITIVE_INFINITY );
  }

  settings.p.scene.add( this._cloud );
    
  this.initSparks(settings);
}

P.ParTicles.prototype={

  changePalette:function(name){
    this.palette_name=name||'fire';
    this._colors=this.palettes[this.palette_name]||this.palettes[this.palette_name='fire'];
  },
  initSparks:function(settings){
    settings=settings || {};

    settings.emitterPos=settings.emitterPos || new THREE.Vector3( 0, 0, 0 );
    settings.gravity=settings.gravity || new THREE.Vector3( 0, -9.81, 0 );
    settings.drift=settings.drift || new THREE.Vector3( 1, 1, 1 );
    settings.lifeStart=settings.lifeStart||0;
    settings.lifeEnd=settings.lifeEnd||2;
    settings.steadyCounter=settings.steadyCounter||100;
    settings.p=settings.p||null;
    
    if (settings.autoStart===undefined) settings.autoStart=true;
    
    var counter = new SPARKS.SteadyCounter( settings.steadyCounter );
    var emitter = new SPARKS.Emitter( counter );
    emitter.p=settings.p; // set master P object for this instance
    
    emitter.addInitializer( new SPARKS.Target( this, this.setTarget ) );
  //  emitter.addInitializer( new SPARKS.Position( new SPARKS.CubeZone( settings.emitterPos,1,1,1 ) ) );
    emitter.addInitializer( this ); // allows us to set ps to this on particle so target can be looked up
    emitter.addInitializer( new SPARKS.Position( new SPARKS.PointZone( settings.emitterPos ) ) );
    emitter.addInitializer( new SPARKS.Lifetime( settings.lifeStart, settings.lifeEnd ));
  //  emitter.addInitializer( new SPARKS.Velocity( new SPARKS.CubeZone( new THREE.Vector3( -5, -5, -5 ),10,10,10 ) ) );
    emitter.addAction( new SPARKS.Age(TWEEN.Easing.Linear.None) );
    emitter.addAction( this ); // allows us to change colors over life span
    emitter.addAction( new SPARKS.Accelerate( settings.gravity.x, settings.gravity.y, settings.gravity.z ) );
    emitter.addAction( new SPARKS.RandomDrift( settings.drift.x, settings.drift.y, settings.drift.z ) );	
    emitter.addAction( new SPARKS.Move() );
    emitter.addAction( new SPARKS.DeathZone( new SPARKS.CubeZone( new THREE.Vector3( -100, -11, -100 ),200,10,200 ) ) ); // die on floor

    emitter.addCallback( "created", this.onParticleCreated );
    emitter.addCallback( "dead", this.onParticleDead );
          
    this.emitter=emitter;
    if (settings.autoStart) this.start();
    
    return emitter;
  },
  initialize:function(emitter,particle){
    particle.ps=this;
  },
  start:function(){
    this.emitter.start();
    return this;
  },
  stop:function(){
    this.emitter.stop();
    return this;
  },
  isRunning:function(){
    return this.emitter.isRunning();
  },
  toggle:function(){
    if (this.isRunning()){
      this.stop();
    }else{
      this.start();
    }
    return this;
  },
  generatePointSprite:function(r,g,b) {
    r=r||255;
    g=g||255;
    b=b||255;
    var canvas = document.createElement( 'canvas' );

    canvas.width = 128;
    canvas.height = 128;

    var context = canvas.getContext( '2d' );

    context.beginPath();
    context.arc( 64, 64, 60, 0, Math.PI * 2, false) ;
    context.closePath();

    context.lineWidth = 0.5;
    context.stroke();
    context.restore();

    var gradient = context.createRadialGradient( canvas.width / 2, canvas.height / 2, 0, canvas.width / 2, canvas.height / 2, canvas.width / 2 );

    gradient.addColorStop( 0, 'rgba('+r+','+g+','+b+',1)' );
    gradient.addColorStop( 0.2, 'rgba('+r+','+g+','+b+',1)' );
    gradient.addColorStop( 0.4, 'rgba('+(r*0.8)+','+(g*0.8)+','+(b*0.8)+',1)' );
    gradient.addColorStop( 1, 'rgba(0,0,0,1)' );

    context.fillStyle = gradient;
    context.fill();

    return canvas;
  },
  render:function() {
    this._cloud.geometry.verticesNeedUpdate = true;
    this._cloud.geometry.colorsNeedUpdate = true;
  },
  setTarget:function() { // sparks js tags particles with this id which references our geometry point sprite
    return this.target._pool.get();
  },
  onParticleCreated:function( particle ) { // sparks js event
    particle.velocity.set((Math.random()-Math.random())*3,5+Math.random(),(Math.random()-Math.random())*3);
    var target = particle.target;
    if (target){
//    console.log(target,particles.vertices[target]);
      particle.ps._particles.colors[ target ].copy(particle.ps._colors[0]);
      particle.ps._particles.vertices[ target ] = particle.position;
    }
  },
  onParticleDead:function( particle ) { // sparks js event
    var target = particle.target;
    if ( target ) {
      // Hide the particle
      particle.ps._particles.vertices[ target ].set( Number.POSITIVE_INFINITY, Number.POSITIVE_INFINITY, Number.POSITIVE_INFINITY );
      particle.ps._particles.colors[ target ].copy(particle.ps._colors[particle.ps._colors.length-1]);
      // Mark particle system as available by returning to pool
      particle.ps._pool.add( particle.target );
    }
  },
  update:function (emitter, particle, time) { // sparks compatable action
    var target = particle.target; // used to update geometry
    var f=particle.age / particle.lifetime; // percentage through lifetime
    var n=this._colors.length; // cache length for speed
    var c1 = Math.floor(n*f); // get first color
    if (c1>=n) c1=n-1; // ensure we are not past last color
    var c2 = c1+1; // get next color
    if (c2>=n) c2=c1; // ensure we are not past last color

    var r1=c1/n; // convert first color number to percent of total
    var r2=c2/n; // convert second color number to percent of total

    f-=r1; // set baseline of life percentage to first color percent
    r2-=r1;
    if (r2==0) r2=1; // prevent divide by zero
    f/=r2; // find percentage between fist and second color
    if (f>1) f=1; // clamp
    if (f<0) f=0; // clamp
    var f2=1-f; // cache inverse speed up
    
    c1=this._colors[c1]; // get first rgb color
    c2=this._colors[c2]; // get second rgb color
    // set new interpolated color 
    this._particles.colors[ target ].setRGB(
      (c1.r*f2)+(c2.r*f),
      (c1.g*f2)+(c2.g*f),
      (c1.b*f2)+(c2.b*f)
    );
  }
};
