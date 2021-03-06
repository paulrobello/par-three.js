P.ParTicles = function(options){
  this.options={
    ps:this,
    particlesLength:1000,
    size:0.25,
    palette_name:'fire',
    pointSprite:{
      show:false,
      color:{r:255,g:255,b:255}
    }    
  };
  
  options=$.extend(true,this.options,options);
  
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
  
  this.palette_name=options.palette_name;
  this._colors=this.options.colors || P.ParTicles.palettes[options.palette_name];
  this.size=options.size;
  
  this._particles = new THREE.Geometry();
  var particles = this._particles;
  var pool=this._pool;
  
  // Create pools of vectors  
  for ( var i = 0; i < options.particlesLength; i ++ ) {
    particles.vertices.push( new THREE.Vector3() );
    particles.colors[i]= new THREE.Color(0xffffff);
    pool.add( i );    
  }

  if (!options.sprite_url){
    var canvas  = this.generatePointSprite(options);
    if (options.pointSprite.show) $(options.pointSprite.show).append(canvas);
    this._texture = new THREE.Texture( canvas );
  }else{
    this._texture=THREE.ImageUtils.loadTexture(options.sprite_url);
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

  options.p.scene.add( this._cloud );
    
  this.initSparks(options);
}

P.ParTicles.palettes={
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
  ]
};

P.ParTicles.prototype={

  changePalette:function(name){
    this.palette_name=name||'fire';
    this._colors=P.ParTicles.palettes[this.palette_name]||P.ParTicles.palettes[this.palette_name='fire'];
  },
  initSparks:function(options){
    options=options || {};

    options.emitterPos=options.emitterPos || new THREE.Vector3( 0, 0, 0 );
    options.gravity=options.gravity || new THREE.Vector3( 0, -9.81, 0 );
    options.drift=options.drift || new THREE.Vector3( 1, 1, 1 );
    options.lifeStart=options.lifeStart||0;
    options.lifeEnd=options.lifeEnd||2;
    options.steadyCounter=options.steadyCounter||100;
    options.p=options.p||null;
    
    if (options.autoStart===undefined) options.autoStart=true;
    
    var counter = new SPARKS.SteadyCounter( options.steadyCounter );
    var emitter = new SPARKS.Emitter( counter );
    emitter.p=options.p; // set master P object for this instance
    
    emitter.addInitializer( new SPARKS.Target( this, this.setTarget ) );
  //  emitter.addInitializer( new SPARKS.Position( new SPARKS.CubeZone( options.emitterPos,1,1,1 ) ) );
    emitter.addInitializer( this ); // allows us to set ps to this on particle so target can be looked up
    emitter.addInitializer( new SPARKS.Position( new SPARKS.PointZone( options.emitterPos ) ) );
    emitter.addInitializer( new SPARKS.Lifetime( options.lifeStart, options.lifeEnd ));
  //  emitter.addInitializer( new SPARKS.Velocity( new SPARKS.CubeZone( new THREE.Vector3( -5, -5, -5 ),10,10,10 ) ) );
    emitter.addAction( new SPARKS.Age(TWEEN.Easing.Linear.None) );
    emitter.addAction( this ); // allows us to change colors over life span
    emitter.addAction( new SPARKS.Accelerate( options.gravity.x, options.gravity.y, options.gravity.z ) );
    emitter.addAction( new SPARKS.RandomDrift( options.drift.x, options.drift.y, options.drift.z ) );	
    emitter.addAction( new SPARKS.Move() );
    emitter.addAction( new SPARKS.DeathZone( new SPARKS.CubeZone( new THREE.Vector3( -100, -11, -100 ),200,10,200 ) ) ); // die on floor

    emitter.addCallback( "created", this.onParticleCreated );
    emitter.addCallback( "dead", this.onParticleDead );
          
    this.emitter=emitter;
    if (options.autoStart) this.start();
    
    return emitter;
  },
  // each time a particle is created this gets called so the particle will have a pointer back to particle system
  initialize:function(emitter,particle){
    particle.ps=this;
  },
  // starts particle system animation
  start:function(){
    this.emitter.start();
    return this;
  },
  // stops particle system animation
  stop:function(){
    this.emitter.stop();
    return this;
  },
  // returns true if particle system is running
  isRunning:function(){
    return this.emitter.isRunning();
  },
  // toggle pause of particle system, still visible just not animated
  toggle:function(){
    if (this.isRunning()){
      this.stop();
    }else{
      this.start();
    }
    return this;
  },
  // generate a grey scale radial blended sprite for use as particle texture
  generatePointSprite:function(options) {    
    var o = $.extend(true,this.options.pointSprite,options);
    $.extend(o,o.color);
    
    var canvas = document.createElement( 'canvas' );
    canvas.width = 128;
    canvas.height = canvas.width;

    var context = canvas.getContext( '2d' );

    context.beginPath();
    context.arc( canvas.width/2, canvas.height/2, canvas.width/2-4, 0, P.TWO_PI, false) ;
    context.closePath();

    context.lineWidth = 0.5;
    context.stroke();
    context.restore();

    var gradient = context.createRadialGradient( canvas.width / 2, canvas.height / 2, 0, canvas.width / 2, canvas.height / 2, canvas.width / 2 );

    gradient.addColorStop( 0,   'rgba('+o.r+','+o.g+','+o.b+',1)' );
    gradient.addColorStop( 0.2, 'rgba('+o.r+','+o.g+','+o.b+',1)' );
    gradient.addColorStop( 0.4, 'rgba('+(o.r*0.8)+','+(o.g*0.8)+','+(o.b*0.8)+',1)' );
    gradient.addColorStop( 1,   'rgba(0,0,0,1)' );

    context.fillStyle = gradient;
    context.fill();

    return canvas;
  },
  // flag point sprits and colors as needing update
  render:function(options) {
    this._cloud.geometry.verticesNeedUpdate = true;
    this._cloud.geometry.colorsNeedUpdate = true;
  },
  // sparks js tags particles with this id which references our geometry point sprite
  setTarget:function() { 
    return this.target._pool.get();
  },
  onParticleCreated:function( particle ) { // sparks js event
    particle.velocity.set(
      (Math.random()-Math.random())*3,
      5+Math.random(),
      (Math.random()-Math.random())*3
    );
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
  // changes color of particle based on its age and current palette
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
