P.Events = function(options){
  this.events={};
  this.init(options);
};
P.Events.prototype={
  init:function(options){
  },
  _cbf:function(name,e){
     console.log("EN:"+name);
     console.log( e );
     var a=this.events[name];
     if (!a || !a.length) return;
     for (var i = 0; i<a.length; i++){
       if (a[i].call(this,e)===false) break;
     }
  },
  _bind:function(name){
    $( this ).bind( name, this._cbf );
  },
  trigger:function(name,e){
    this._cbf(name,e);
    return this;
  },
  prepend:function(name,cbf){
    if (!this.events[name]) {
      this.events[name]=[];
    }
    this.events[name].unshift(cbf);
    return this;
  },
  append:function(name,cbf){
    if (!this.events[name]) {
      this.events[name]=[];
    }
    this.events[name].push(cbf);
    return this;
  },
  replace:function(name,cbf){
    if (!this.events[name]) return this.append(name,cbf);
    var i = this.events[name].indexOf(cbf);
    if (i<0) return this.append(name,cbf);
    this.events[name][i]=cbf;    
    return this;
  },
  remove:function(name,cbf){
    if (!this.events[name]) return this;
    var i = this.events[name].indexOf(cbf);
    this.events[name].splice(i,1);
    if (!this.events[name].length) return this.clear(name);
    return this;
  },
  clear:function(name){
    if (!this.events[name]) return this;
    this.events[name]=false;
    $( this ).unbind( name, this._cbf );
    return this;
  },
  list:function(){
    $.each(this.events,function(n,a){
      if (!a) return;
      console.log(n+" "+a.length);
    });
    return this;
  }
}
